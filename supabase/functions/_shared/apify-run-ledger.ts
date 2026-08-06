export type ExistingApifyLedgerLog = {
  id: string;
  action: string;
  external_id: string | null;
  cost_usd: number;
  created_at: string;
};

export type RemoteApifyRun = {
  id: string;
  status: string;
  usageTotalUsd: number;
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string | null;
  keyLabel: string;
};

export type ApifyRunLedgerAction =
  | { kind: "update_existing"; logId: string; run: RemoteApifyRun }
  | { kind: "match_reconciliation"; logId: string; run: RemoteApifyRun }
  | { kind: "insert_unattributed"; run: RemoteApifyRun };

// A conciliação manual legada foi registrada com duas casas decimais; aceite até meio centavo
// para ligá-la ao valor detalhado do run sem criar uma cobrança duplicada.
const COST_TOLERANCE_USD = 0.005;

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function planApifyRunLedgerSync(
  logs: ExistingApifyLedgerLog[],
  remoteRuns: RemoteApifyRun[],
): ApifyRunLedgerAction[] {
  const logsByExternalId = new Map(
    logs
      .filter((log): log is ExistingApifyLedgerLog & { external_id: string } =>
        Boolean(log.external_id),
      )
      .map((log) => [log.external_id, log]),
  );
  const availableReconciliations = logs.filter(
    (log) => log.action === "account_reconciliation" && log.cost_usd > 0,
  );
  const usedReconciliations = new Set<string>();

  return remoteRuns.map((run) => {
    const existing = logsByExternalId.get(run.id);
    if (existing) return { kind: "update_existing", logId: existing.id, run };

    const matchingReconciliation = availableReconciliations
      .filter(
        (log) =>
          !usedReconciliations.has(log.id) &&
          Math.abs(log.cost_usd - run.usageTotalUsd) <= COST_TOLERANCE_USD,
      )
      .sort(
        (left, right) =>
          Math.abs(timestamp(left.created_at) - timestamp(run.startedAt)) -
          Math.abs(timestamp(right.created_at) - timestamp(run.startedAt)),
      )[0];
    if (matchingReconciliation) {
      usedReconciliations.add(matchingReconciliation.id);
      return { kind: "match_reconciliation", logId: matchingReconciliation.id, run };
    }

    return { kind: "insert_unattributed", run };
  });
}
