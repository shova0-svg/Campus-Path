import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/sohoj/ErrorState";
import { FeedbackHost } from "@/components/sohoj/FeedbackDialog";
import { PushSoundHost } from "@/components/sohoj/PushSoundHost";
import { GlobalTabBar } from "@/components/sohoj/GlobalTabBar";
import { openFeedback } from "@/lib/feedback";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerServiceWorker } from "../lib/pwa";
import { hideLovableBadge } from "../lib/hide-badge";

function NotFoundComponent() {
  return (
    <ErrorState
      title="Page not found (404)"
      description="The page you're looking for doesn't exist or has been moved."
      onRetry={() => window.location.reload()}
      onHome={() => {
        window.location.href = "/";
      }}
      onReport={() =>
        openFeedback({ category: "idea", message: "Page not found link report", page: "404" })
      }
    />
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorState
      title="This page didn't load"
      description="Something went wrong while opening this page. Try again, go home, or send us a report."
      onRetry={() => {
        router.invalidate();
        reset();
      }}
      onHome={() => {
        window.location.href = "/";
      }}
      onReport={() =>
        openFeedback({
          category: "bug",
          message: `Auto error report: ${(error as Error).message.slice(0, 300)}`,
          page: "route-error",
        })
      }
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route, / included, must still set its own head().
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Campus Path — Find your way on campus" },
      {
        name: "description",
        content:
          "Find your way on campus — class routines, room navigation and QR checkpoints for polytechnic students in Bangladesh.",
      },
      { name: "author", content: "Campus Path" },
      { property: "og:title", content: "Campus Path" },
      {
        property: "og:description",
        content: "Find your way on campus — smart campus navigation for polytechnic students.",
      },
      { name: "theme-color", content: "#0B1F3A" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Campus Path" },
      { name: "application-name", content: "Campus Path" },
      { property: "og:site_name", content: "Campus Path" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Campus Path" },
      { name: "twitter:description", content: "Find your way on campus" },
      { property: "og:image", content: "/og-image.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { rel: "icon", href: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Hind+Siliguri:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    registerServiceWorker();
    return hideLovableBadge();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <ErrorBoundary>
        <AuthProvider>
          <Outlet />
          <GlobalTabBar />
        </AuthProvider>
      </ErrorBoundary>
      <FeedbackHost />
      <PushSoundHost />
      {/* Toasts sit just above the bottom tab bar, never over the header. */}
      <Toaster
        position="bottom-center"
        richColors
        closeButton
        duration={5000}
        className="!bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
      />
    </QueryClientProvider>
  );
}
