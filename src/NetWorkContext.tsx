import { createContext, useEffect, useState } from "react";

export const NetworkContext = createContext({ isOnline: true });

export function NetworkProvider({ children }: any) {
  const [isOnline, setIsOnline] = useState(true);

  const checkConnection = async () => {
    const isElectron = !!(window as any).require;
    try {
      if (isElectron) {
        const response = await fetch("https://www.google.com/generate_204", {
          method: "GET",
          cache: "no-cache",
        });
        return response.ok;
      } else {
        return navigator.onLine;
      }
    } catch {
      return false;
    }
  };

  const updateStatus = async () => {
    const status = await checkConnection();
    setIsOnline(status);
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 3000);

    if (typeof window !== "undefined") {
      window.addEventListener("online", updateStatus);
      window.addEventListener("offline", updateStatus);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}