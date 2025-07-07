import { ChatProvider } from "./ChatContext";
import { ErrorBoundary } from "./components/utils/ErrorBoundary";
import AppRoutes from "./routes/AppRoutes";
import { SystemStatusProvider } from "./SystemStatusContext";


const App = () => {
  return (
    <SystemStatusProvider>
      <ErrorBoundary>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </ErrorBoundary>
    </SystemStatusProvider>
  );
};

export default App;
