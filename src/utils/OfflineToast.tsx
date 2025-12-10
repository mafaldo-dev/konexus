// src/utils/OfflineToast.tsx
export const OfflineToast = () => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <strong>❌ Conexão perdida</strong>
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-1">
        Tentando reconectar
        <span className="flex gap-0.5">
          <span className="animate-blink" style={{ animationDelay: '0s' }}>.</span>
          <span className="animate-blink" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-blink" style={{ animationDelay: '0.4s' }}>.</span>
        </span>
      </div>
    </div>
  );
};