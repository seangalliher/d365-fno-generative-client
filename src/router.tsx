/**
 * Router configuration with lazy-loaded routes.
 * Includes Power Apps basename normalization (required for Code Apps hosting).
 */

import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load page components for code splitting
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const FormPage = lazy(() =>
  import("@/pages/FormPage").then((m) => ({ default: m.FormPage }))
);

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Power Apps Code App basename normalization
// In Code Apps, the app is served from a subpath ending in /index.html.
// On standard hosting (dev or prod at root), basename must stay "/" so that
// deep links like /form/SalesTableListPage resolve correctly.
const isCodeApp = location.pathname.endsWith("/index.html");
const BASENAME = isCodeApp ? new URL(".", location.href).pathname : "/";
if (isCodeApp) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppShell />,
      children: [
        {
          index: true,
          element: (
            <PageSuspense>
              <DashboardPage />
            </PageSuspense>
          ),
        },
        {
          path: "module/:moduleId",
          element: (
            <PageSuspense>
              <DashboardPage />
            </PageSuspense>
          ),
        },
        {
          path: "form/:menuItemName",
          element: (
            <PageSuspense>
              <FormPage />
            </PageSuspense>
          ),
        },
      ],
    },
  ],
  { basename: BASENAME }
);
