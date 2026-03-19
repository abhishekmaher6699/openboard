import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/auth-context.tsx";
import { ThemeProvider } from "./context/theme-context.tsx";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" richColors closeButton/>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  // </StrictMode>,
);
