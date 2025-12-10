export {};

declare global {
  interface Window {
    // Variáveis customizadas da aplicação
    __ORDER_NUMBER__: string | undefined;
    __HOT_RELOAD__: boolean | undefined;
    
    // Electron APIs
    ipcRenderer?: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
      once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
      removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    
    // Node.js require (disponível no Electron com contextIsolation: false)
    require?: NodeRequire | any;
    
    // Process do Node.js
    process?: {
      type: string;
      versions: {
        electron?: string;
        chrome?: string;
        node?: string;
      };
      platform: string;
      env: Record<string, string | undefined>;
    };
  }
}