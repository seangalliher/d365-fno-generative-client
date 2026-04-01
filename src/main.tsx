import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootstrapServices } from "./services/bootstrap";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

// Show a loading message while MSAL + services initialize
root.textContent = "Signing in...";

bootstrapServices()
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((err) => {
    console.error("[bootstrap] Failed:", err);
    root.textContent = `Authentication error: ${err.message ?? err}`;
  });
