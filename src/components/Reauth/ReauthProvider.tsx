import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { ReauthIntent, setReauthHandler } from "../../api/reauth";
import { requestReauthGrant } from "../../services/reauthService";
import ReauthModal from "./ReauthModal";

export interface ReauthContextValue {
  /** Abre o modal e devolve a concessao (ou null quando o usuario cancela). */
  requestReauth: (intent: ReauthIntent, payload?: unknown) => Promise<string | null>;
}

const ReauthContext = createContext<ReauthContextValue | undefined>(undefined);

interface PendingRequest {
  intent: ReauthIntent;
  payload: unknown;
  resolve: (grantId: string | null) => void;
}

const GENERIC_ERROR = "Não foi possível confirmar sua identidade. Verifique sua senha.";

/**
 * Provider de reautenticacao.
 *
 * Registra o manipulador usado pelo cliente HTTP: quando o backend responde
 * 403 com `REAUTH_REQUIRED`, o modal e exibido, a senha e validada no
 * servidor e a requisicao original e repetida com a concessao.
 */
export function ReauthProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef<PendingRequest | null>(null);

  const requestReauth = useCallback(
    (intent: ReauthIntent, payload?: unknown) =>
      new Promise<string | null>((resolve) => {
        pendingRef.current = { intent, payload, resolve };
        setPending({ intent, payload, resolve });
        setError(null);
      }),
    []
  );

  useEffect(() => {
    setReauthHandler((intent, payload) => requestReauth(intent, payload));
    return () => setReauthHandler(null);
  }, [requestReauth]);

  const close = useCallback(() => {
    pendingRef.current = null;
    setPending(null);
    setError(null);
    setLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    const current = pendingRef.current;
    close();
    // Cancelamento no frontend: a operacao nao e executada. O cancelamento
    // so chega ao servidor se a requisicao ja tiver sido enviada.
    current?.resolve(null);
  }, [close]);

  const handleConfirm = useCallback(
    async (password: string) => {
      const current = pendingRef.current;
      if (!current || loading) return;

      setLoading(true);
      setError(null);

      try {
        const response = await requestReauthGrant({
          password,
          intent: current.intent,
          payload: current.payload,
        });

        if (!response.success || !response.grant) {
          setError(
            response.status === 429
              ? response.error ||
                "Muitas tentativas. Aguarde alguns instantes e tente novamente."
              : GENERIC_ERROR
          );
          setLoading(false);
          return;
        }

        close();
        current.resolve(response.grant.grantId);
      } catch {
        setError(GENERIC_ERROR);
        setLoading(false);
      }
    },
    [close, loading]
  );

  const description = pending?.intent.description || "esta alteração";

  return (
    <ReauthContext.Provider value={{ requestReauth }}>
      {children}
      <ReauthModal
        open={Boolean(pending)}
        description={description}
        entityId={pending?.intent.entityId}
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ReauthContext.Provider>
  );
}

export function useReauth(): ReauthContextValue {
  const context = useContext(ReauthContext);
  if (!context) {
    throw new Error("useReauth deve ser usado dentro de ReauthProvider");
  }
  return context;
}
