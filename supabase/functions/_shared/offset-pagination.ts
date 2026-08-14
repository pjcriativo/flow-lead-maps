export type OffsetPage<T> = {
  items: readonly T[];
  total?: number | null;
};

export type OffsetPageLoader<T> = (offset: number, limit: number) => Promise<OffsetPage<T>>;

export async function collectUniqueOffsetPages<T>(
  loadPage: OffsetPageLoader<T>,
  getId: (item: T) => string,
  pageSize = 1_000,
): Promise<T[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("O tamanho da página deve ser um inteiro positivo.");
  }

  const rows: T[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  let knownTotal: number | null = null;

  while (true) {
    const page = await loadPage(offset, pageSize);
    const reportedTotal = page.total;
    if (reportedTotal !== undefined && reportedTotal !== null) {
      if (!Number.isSafeInteger(reportedTotal) || reportedTotal < 0) {
        throw new RangeError("O total da paginação deve ser um inteiro não negativo.");
      }
      knownTotal = Math.max(knownTotal ?? 0, reportedTotal);
    }

    if (page.items.length === 0) {
      if (knownTotal !== null && offset < knownTotal) {
        throw new Error(
          `Paginação incompleta: página vazia no offset ${offset} antes do total ${knownTotal}.`,
        );
      }
      break;
    }

    for (const item of page.items) {
      const id = getId(item);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      rows.push(item);
    }

    offset += page.items.length;
    if (knownTotal !== null && offset >= knownTotal) break;
  }

  return rows;
}
