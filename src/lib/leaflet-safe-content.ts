type PopupData = {
  businessName: unknown;
  category?: unknown;
  phone?: unknown;
  address?: unknown;
  website?: unknown;
  score?: unknown;
};

function element(tag: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function appendText(parent: HTMLElement, tag: string, value: unknown, className?: string): void {
  if (value === null || value === undefined || String(value).trim() === "") return;
  const child = element(tag, className);
  child.textContent = String(value);
  parent.appendChild(child);
}

export function normalizeExternalHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

export function createLeafletPopupContent(data: PopupData): HTMLElement {
  const root = element("div", "flow-map-popup");
  appendText(root, "strong", data.businessName || "Empresa", "flow-map-popup__title");
  appendText(root, "div", data.category, "flow-map-popup__category");
  appendText(root, "div", data.address || "Sem endereço cadastrado", "flow-map-popup__address");
  appendText(root, "div", data.phone, "flow-map-popup__phone");
  if (data.score !== undefined && data.score !== null) {
    appendText(root, "div", `Score: ${String(data.score)} pts`, "flow-map-popup__score");
  }

  const website = normalizeExternalHttpUrl(data.website);
  if (website) {
    const link = element("a", "flow-map-popup__link");
    link.textContent = "Abrir site";
    link.setAttribute("href", website);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    root.appendChild(link);
  }
  return root;
}

export function createLeafletTextContent(value: unknown, fallback = "Lead"): HTMLElement {
  const node = element("span");
  node.textContent =
    value === null || value === undefined || String(value).trim() === "" ? fallback : String(value);
  return node;
}
