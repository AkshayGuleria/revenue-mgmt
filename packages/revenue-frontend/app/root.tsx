import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";

import type { Route } from "./+types/root";
import "./app.css";
import { queryClient } from "~/lib/api/query-client";
import { Toaster } from "~/components/ui/sonner";
import { APP_NAME } from "~/lib/constants";
import { apiClient } from "~/lib/api/client";
import { queryKeys } from "~/lib/api/query-client";
import { useConfigStore } from "~/lib/stores/config-store";
import type { AppConfig } from "~/lib/api/hooks/use-config";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.png" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{APP_NAME}</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * clientLoader runs before the root component renders on every navigation.
 * It seeds the React Query cache AND the Zustand config store so all
 * components see the correct currency on their very first render — no flash.
 */
export async function clientLoader() {
  try {
    const config = await queryClient.fetchQuery<AppConfig>({
      queryKey: queryKeys.config.all,
      queryFn: async () => {
        const response = await apiClient.get<AppConfig>("/api/config");
        return response.data as AppConfig;
      },
      staleTime: 30 * 60 * 1000,
      retry: 0,
    });
    useConfigStore.getState().setConfig(
      config.defaultCurrency,
      config.supportedCurrencies,
    );
  } catch {
    // Config failure is non-fatal; store retains its persisted/default value
  }
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
