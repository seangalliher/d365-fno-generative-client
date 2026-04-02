/**
 * MSAL authentication service for D365 F&O.
 * Uses redirect flow (more reliable than popup for first-party app IDs).
 */

import {
  PublicClientApplication,
  type Configuration,
  type SilentRequest,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

const D365_SCOPE = "https://fy26-h2-standard.operations.dynamics.com/.default";
const MCP_SCOPE = import.meta.env.VITE_MCP_SCOPE as string || "https://agent365.svc.cloud.microsoft/.default";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "400d41be-8e60-4d14-8845-904bed7c2714",
    authority: import.meta.env.VITE_MSAL_AUTHORITY || "https://login.microsoftonline.com/72e09152-7233-4fe8-b12b-b66e273e0369",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

let msalInstance: PublicClientApplication | null = null;
let redirectHandled = false;

async function getInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  if (!redirectHandled) {
    redirectHandled = true;
    const result = await msalInstance.handleRedirectPromise();
    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
    }
  }
  return msalInstance;
}

/**
 * Ensure the user is logged in. Tries silent first, then redirects to Microsoft login.
 * Returns true if the app can proceed, false if a redirect is in progress.
 */
export async function login(): Promise<boolean> {
  const pca = await getInstance();

  // If we already have an account (e.g. from redirect or cached session), we're good
  const accounts = pca.getAllAccounts();
  if (accounts.length > 0) {
    pca.setActiveAccount(accounts[0] ?? null);
    return true;
  }

  // No account — redirect to Microsoft login (page will reload after login)
  console.info("[auth] No account found, redirecting to login...");
  await pca.loginRedirect({ scopes: [D365_SCOPE] });
  return false; // Won't actually reach here — page navigates away
}

/**
 * Get a fresh access token for D365 F&O. Silently refreshes if possible.
 */
export async function getAccessToken(): Promise<string> {
  const pca = await getInstance();
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];

  if (!account) {
    // This shouldn't happen if login() was called first, but handle gracefully
    await pca.loginRedirect({ scopes: [D365_SCOPE] });
    throw new Error("Login redirect initiated — page will reload");
  }

  const request: SilentRequest = {
    scopes: [D365_SCOPE],
    account,
  };

  try {
    const result = await pca.acquireTokenSilent(request);
    return result.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await pca.acquireTokenRedirect({ scopes: [D365_SCOPE] });
      throw new Error("Token redirect initiated — page will reload");
    }
    throw e;
  }
}

/**
 * Get a fresh access token for the MCP server (may use a different scope/audience).
 */
export async function getMcpAccessToken(): Promise<string> {
  const pca = await getInstance();
  const account = pca.getActiveAccount() ?? pca.getAllAccounts()[0];

  if (!account) {
    throw new Error("No account — login required before MCP token acquisition");
  }

  const request: SilentRequest = {
    scopes: [MCP_SCOPE],
    account,
  };

  try {
    const result = await pca.acquireTokenSilent(request);
    return result.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      // Need consent for MCP scope — redirect
      await pca.acquireTokenRedirect({ scopes: [MCP_SCOPE] });
      throw new Error("MCP token redirect initiated — page will reload");
    }
    throw e;
  }
}
