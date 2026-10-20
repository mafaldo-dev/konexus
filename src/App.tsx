import { ChatProvider } from "./ChatContext";
import { ErrorBoundary } from "./components/utils/ErrorBoundary";
import { SystemStatusProvider } from "./SystemStatusContext";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./routes/AppRoutes";
import "react-toastify/dist/ReactToastify.css";
import { NetworkProvider } from "./NetWorkContext";
import { NetworkToastManager } from "./utils/NetWorkToastManager";
import { ReauthProvider } from "./components/Reauth";


const App = () => {
  return (
    <NetworkProvider>
      <NetworkToastManager />
      <SystemStatusProvider>
        <ErrorBoundary>      
          <ChatProvider>  
            <ReauthProvider>
              <ToastContainer />
              <AppRoutes />
            </ReauthProvider>
          </ChatProvider>
        </ErrorBoundary>
      </SystemStatusProvider>
    </NetworkProvider>
  );
};

export default App;
