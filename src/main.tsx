import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootstrapServices } from "./services/bootstrap";
import App from "./App";
import "./index.css";

// Initialize services before rendering
bootstrapServices();

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
