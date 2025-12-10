import { useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { NetworkContext } from "../NetWorkContext";
import { OfflineToast } from "../utils/OfflineToast";

const OFFLINE_TOAST_ID = "offline-toast";

export function useNetworkToast() {
  const { isOnline } = useContext(NetworkContext);

  useEffect(() => {
    if (!isOnline) {
      if (!toast.isActive(OFFLINE_TOAST_ID)) {
        toast(<OfflineToast />, {
          toastId: OFFLINE_TOAST_ID,
          type: "error",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          closeButton: false,
        });
      }
    } else {
      toast.dismiss(OFFLINE_TOAST_ID);

      toast("🟢 Conexão restabelecida!", {
        type: "success",
        autoClose: 3000,
      });
    }
  }, [isOnline]);
}
