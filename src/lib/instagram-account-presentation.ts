export type CustomerConnectionTone = "success" | "warning" | "danger";

export function customerAccountLabel(input: {
  displayName: string | null;
  username: string | null;
}): string {
  return input.displayName?.trim() || (input.username ? `@${input.username}` : "Instagram");
}

export function customerAccountType(accountType: string | null): string {
  switch (accountType?.toUpperCase()) {
    case "BUSINESS":
      return "Conta comercial";
    case "CREATOR":
    case "MEDIA_CREATOR":
      return "Criador de conteúdo";
    case "PERSONAL":
      return "Conta pessoal";
    default:
      return "Conta profissional";
  }
}

export function customerConnectionStatus(status: string): {
  label: string;
  tone: CustomerConnectionTone;
} {
  switch (status) {
    case "conectado":
      return { label: "Conectada", tone: "success" };
    case "expirada":
      return { label: "Conexão expirada", tone: "warning" };
    case "aguardando":
      return { label: "Aguardando confirmação", tone: "warning" };
    case "desconectado":
      return { label: "Desconectada", tone: "danger" };
    default:
      return { label: "Atenção necessária", tone: "danger" };
  }
}
