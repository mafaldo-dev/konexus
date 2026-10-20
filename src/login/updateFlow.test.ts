import {
  getInstallerLabel,
  getPrimaryAction,
  getProgress,
  getSpeedLabel,
  getUpdateMessage,
  getUpdateTitle,
  shouldShowUpdateScreen,
  UpdateState,
} from "./updateFlow";

const asset = {
  name: "Konexus-Setup-1.2.12.exe",
  size: 214732379,
  version: "1.2.12",
};

describe("fluxo da tela de atualização", () => {
  it("oferece download direto quando há atualização disponível", () => {
    const action = getPrimaryAction({ status: "available", version: "1.2.12", asset });

    expect(action.id).toBe("download");
    expect(action.label).toBe("Baixar atualização");
    expect(action.channel).toBe("download_update");
    expect(action.disabled).toBe(false);
  });

  it("não oferece segundo download enquanto o download está em andamento", () => {
    const action = getPrimaryAction({
      status: "downloading",
      version: "1.2.12",
      asset,
      percent: 42,
    });

    expect(action.id).toBe("downloading");
    expect(action.label).toBe("Baixando...");
    expect(action.disabled).toBe(true);
    expect(action.channel).toBeUndefined();
  });

  it("oferece reinício somente depois do download concluído", () => {
    const action = getPrimaryAction({ status: "downloaded", version: "1.2.12", asset });

    expect(action.id).toBe("restart");
    expect(action.channel).toBe("restart_app");
    expect(action.disabled).toBe(false);
  });

  it("oferece nova verificação em caso de erro", () => {
    const action = getPrimaryAction({ status: "error", message: "falha de rede" });

    expect(action.id).toBe("retry");
    expect(action.channel).toBe("check_for_update");
    expect(action.disabled).toBe(false);
  });

  it("mantém a verificação bloqueada enquanto consulta a versão", () => {
    const action = getPrimaryAction({ status: "checking" });

    expect(action.id).toBe("checking");
    expect(action.disabled).toBe(true);
    expect(action.channel).toBeUndefined();
  });

  it("exibe a tela para estados de atualização e para retry em andamento", () => {
    expect(
      shouldShowUpdateScreen({ status: "available" }, { dismissed: false, retrying: false })
    ).toBe(true);
    expect(
      shouldShowUpdateScreen({ status: "downloading", percent: 10 }, { dismissed: false, retrying: false })
    ).toBe(true);
    expect(
      shouldShowUpdateScreen({ status: "downloaded" }, { dismissed: false, retrying: false })
    ).toBe(true);
    expect(
      shouldShowUpdateScreen({ status: "error" }, { dismissed: false, retrying: false })
    ).toBe(true);
    expect(
      shouldShowUpdateScreen({ status: "checking" }, { dismissed: false, retrying: true })
    ).toBe(true);
    expect(
      shouldShowUpdateScreen({ status: "checking" }, { dismissed: false, retrying: false })
    ).toBe(false);
    expect(
      shouldShowUpdateScreen({ status: "not-available" }, { dismissed: false, retrying: false })
    ).toBe(false);
    expect(
      shouldShowUpdateScreen({ status: "available" }, { dismissed: true, retrying: false })
    ).toBe(false);
  });

  it("calcula progresso e velocidade com limites seguros", () => {
    expect(getProgress({ status: "downloading", percent: 42.6 })).toBe(43);
    expect(getProgress({ status: "downloading", percent: -10 })).toBe(0);
    expect(getProgress({ status: "downloading", percent: 150 })).toBe(100);
    expect(getProgress({ status: "downloaded" })).toBe(100);
    expect(getProgress({ status: "available", asset })).toBe(0);
    expect(getSpeedLabel({ status: "downloading", percent: 1, bytesPerSecond: 2 * 1024 * 1024 })).toBe(
      "2.00 MB/s"
    );
    expect(getSpeedLabel({ status: "downloading", percent: 1 })).toBeNull();
  });

  it("apresenta o arquivo correto e mensagens sem abrir o GitHub", () => {
    expect(getInstallerLabel({ status: "available", asset })).toBe(asset.name);
    expect(getInstallerLabel({ status: "downloaded", asset })).toBe(asset.name);
    expect(getInstallerLabel({ status: "error" })).toBeNull();

    const message = getUpdateMessage({ status: "available", asset });
    expect(message).toContain("diretamente");
    expect(message).not.toContain("github.com");
    expect(getUpdateTitle({ status: "available" })).toBe("Atualização disponível");
    expect(getUpdateTitle({ status: "error" })).toBe("Não foi possível atualizar");
  });

  it("mantém os estados de carregamento, sucesso e falha tipados", () => {
    const states: UpdateState[] = [
      { status: "idle" },
      { status: "checking" },
      { status: "not-available" },
      { status: "available", asset },
      { status: "downloading", percent: 0 },
      { status: "downloaded", asset },
      { status: "error", message: "falha" },
    ];

    expect(states.map((state) => state.status)).toEqual([
      "idle",
      "checking",
      "not-available",
      "available",
      "downloading",
      "downloaded",
      "error",
    ]);
  });
});
