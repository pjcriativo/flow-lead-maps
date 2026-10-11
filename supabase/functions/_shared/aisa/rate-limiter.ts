interface WaitingTask {
  resolve: () => void;
  reject: (error: Error) => void;
  signal?: AbortSignal;
}

export interface AisaRateLimiterOptions {
  maxConcurrent?: number;
  requestsPerMinute?: number;
  maxQueue?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class AisaRateLimiter {
  private readonly maxConcurrent: number;
  private readonly requestsPerMinute: number;
  private readonly maxQueue: number;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly queue: WaitingTask[] = [];
  private active = 0;
  private tokens: number;
  private lastRefillAt: number;

  constructor(options: AisaRateLimiterOptions = {}) {
    this.maxConcurrent = Math.max(1, Math.floor(options.maxConcurrent ?? 5));
    this.requestsPerMinute = Math.max(1, Math.floor(options.requestsPerMinute ?? 60));
    this.maxQueue = Math.max(1, Math.floor(options.maxQueue ?? 100));
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.tokens = this.requestsPerMinute;
    this.lastRefillAt = this.now();
  }

  async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    await this.acquire(signal);
    try {
      await this.consumeToken(signal);
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(new Error("AISA request aborted before queueing."));
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return Promise.resolve();
    }
    if (this.queue.length >= this.maxQueue) {
      return Promise.reject(new Error("AISA local rate-limit queue is full."));
    }
    return new Promise<void>((resolve, reject) => this.queue.push({ resolve, reject, signal }));
  }

  private async consumeToken(signal?: AbortSignal): Promise<void> {
    while (true) {
      this.refillTokens();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      if (signal?.aborted) throw new Error("AISA request aborted while rate limited.");
      const waitMs = Math.ceil(60_000 / this.requestsPerMinute);
      await this.sleep(waitMs);
    }
  }

  private refillTokens(): void {
    const current = this.now();
    const elapsed = Math.max(0, current - this.lastRefillAt);
    if (elapsed === 0) return;
    const replenished = (elapsed * this.requestsPerMinute) / 60_000;
    this.tokens = Math.min(this.requestsPerMinute, this.tokens + replenished);
    this.lastRefillAt = current;
  }

  private release(): void {
    this.active -= 1;
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) return;
      if (next.signal?.aborted) {
        next.reject(new Error("AISA request aborted while queued."));
        continue;
      }
      this.active += 1;
      next.resolve();
      return;
    }
  }
}
