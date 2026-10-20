export type UpdateAsset = {
  name: string;
  size?: number;
  version?: string;
};

export type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "not-available" }
  | { status: "available"; version?: string; asset?: UpdateAsset }
  | {
      status: "downloading";
      version?: string;
      asset?: UpdateAsset;
      percent: number;
      bytesPerSecond?: number;
      transferred?: number;
      total?: number;
    }
  | { status: "downloaded"; version?: string; asset?: UpdateAsset }
  | { status: "error"; message?: string };

export type UpdateActionChannel =
  | "download_update"
  | "restart_app"
  | "check_for_update";

export type UpdateAction = {
  id: "download" | "downloading" | "restart" | "retry" | "checking" | "none";
  label: string;
  disabled: boolean;
  channel?: UpdateActionChannel;
  testId?: string;
};

export type UpdateScreenOptions = {
  dismissed: boolean;
  retrying: boolean;
};

export function getPrimaryAction(state: UpdateState): UpdateAction {
  switch (state.status) {
    case "available":
      return {
        id: "download",
        label: "Baixar atualização",
        disabled: false,
        channel: "download_update",
        testId: "download-update-button",
      };
    case "downloading":
      return {
        id: "downloading",
        label: "Baixando...",
        disabled: true,
        testId: "downloading-update-button",
      };
    case "downloaded":
      return {
        id: "restart",
        label: "Reiniciar agora",
        disabled: false,
        channel: "restart_app",
        testId: "restart-update-button",
      };
    case "error":
      return {
        id: "retry",
        label: "Tentar novamente",
        disabled: false,
        channel: "check_for_update",
        testId: "retry-update-button",
      };
    case "checking":
      return {
        id: "checking",
        label: "Verificando...",
        disabled: true,
        testId: "checking-update-button",
      };
    default:
      return {
        id: "none",
        label: "",
        disabled: true,
      };
  }
}

export function shouldShowUpdateScreen(
  state: UpdateState,
  options: UpdateScreenOptions
): boolean {
  if (options.dismissed) return false;

  return (
    state.status === "available" ||
    state.status === "downloading" ||
    state.status === "downloaded" ||
    state.status === "error" ||
    (options.retrying && state.status === "checking")
  );
}

export function getProgress(state: UpdateState): number {
  if (state.status === "downloaded") return 100;
  if (state.status !== "downloading") return 0;

  const percent = Number.isFinite(state.percent) ? state.percent : 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function getSpeedLabel(state: UpdateState): string | null {
  if (state.status !== "downloading") return null;
  if (!state.bytesPerSecond || state.bytesPerSecond <= 0) return null;

  return `${(state.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
}

export function getInstallerLabel(state: UpdateState): string | null {
  if (
    state.status === "available" ||
    state.status === "downloading" ||
    state.status === "downloaded"
  ) {
    return state.asset?.name || null;
  }

  return null;
}

export function getUpdateTitle(state: UpdateState): string {
  switch (state.status) {
    case "error":
      return "Não foi possível atualizar";
    case "downloaded":
      return "Atualização pronta";
    case "checking":
      return "Verificando atualizações";
    case "available":
      return "Atualização disponível";
    default:
      return "Atualizando o Konexus";
  }
}

export function getUpdateMessage(state: UpdateState): string {
  switch (state.status) {
    case "error":
      return state.message || "Ocorreu um erro ao baixar a atualização.";
    case "downloaded":
      return "O download foi concluído. Reinicie o aplicativo para aplicar a nova versão.";
    case "checking":
      return "Aguarde enquanto verificamos a versão mais recente.";
    case "available":
      return "O download será feito diretamente pelo atualizador do Konexus. Nenhuma página do GitHub será aberta.";
    case "downloading":
      return "O download está sendo feito diretamente pelo atualizador do Konexus.";
    case "not-available":
      return "O Konexus já está na versão mais recente.";
    default:
      return "Preparando a verificação de atualizações.";
  }
}
