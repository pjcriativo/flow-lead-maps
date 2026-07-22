import posthog from "posthog-js";

let initialized = false;

// Debug mode: on in dev by default; toggle at runtime with
//   localStorage.setItem("ph_debug", "1"|"0") then reload,
// or via window.__phDebug(true|false).
function debugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const ls = window.localStorage?.getItem("ph_debug");
  if (ls === "1") return true;
  if (ls === "0") return false;
  return import.meta.env.DEV;
}

function logEvent(event: string, props?: Record<string, unknown>) {
  if (!debugEnabled()) return;

  console.log(`%c[PostHog] ${event}`, "color:#7c3aed;font-weight:600", props ?? {});
}

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  posthog.init("phc_Dh4TzUi5H8zXX6ddEL9dh38o7A4r5vbNKBU22B5QsrsM", {
    api_host: "https://us.i.posthog.com",
    autocapture: true,
    capture_pageview: true,
    loaded: (ph) => {
      if (debugEnabled()) {
        ph.debug();

        console.log("%c[PostHog] debug mode ON", "color:#7c3aed;font-weight:600", {
          distinct_id: ph.get_distinct_id(),
        });
      }
    },
  });

  // Wrap capture/identify so every call logs with its properties in debug.
  const origCapture = posthog.capture.bind(posthog);
  posthog.capture = ((event: string, props?: Record<string, unknown>, ...rest: unknown[]) => {
    logEvent(event, props);
    // @ts-expect-error passthrough
    return origCapture(event, props, ...rest);
  }) as typeof posthog.capture;

  const origIdentify = posthog.identify.bind(posthog);
  posthog.identify = ((
    distinctId?: string,
    props?: Record<string, unknown>,
    ...rest: unknown[]
  ) => {
    logEvent("identify", { distinct_id: distinctId, ...props });
    // @ts-expect-error passthrough
    return origIdentify(distinctId, props, ...rest);
  }) as typeof posthog.identify;

  if (typeof window !== "undefined") {
    const w = window as unknown as {
      __phDebug?: (on: boolean) => void;
      posthog?: typeof posthog;
    };
    w.__phDebug = (on: boolean) => {
      window.localStorage.setItem("ph_debug", on ? "1" : "0");

      console.log(`[PostHog] debug ${on ? "ON" : "OFF"} — reload to apply init-time flags`);
    };
    w.posthog = posthog;
  }

  initialized = true;
}

export { posthog };
