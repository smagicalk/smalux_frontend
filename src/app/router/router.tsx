import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent
} from "@tanstack/react-router";

import { RootLayout } from "@/app/router/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout
});

const publicStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(
    () => import("@/features/public/pages/public-status-page"),
    "PublicStatusPage"
  )
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: lazyRouteComponent(
    () => import("@/features/dashboard/pages/dashboard-page"),
    "DashboardPage"
  )
});

const nodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/nodes",
  component: lazyRouteComponent(() => import("@/features/nodes/pages/nodes-page"), "NodesPage")
});

const pingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/ping",
  component: lazyRouteComponent(() => import("@/features/ping/pages/ping-page"), "PingPage")
});

const executionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/executions",
  component: lazyRouteComponent(
    () => import("@/features/executions/pages/executions-page"),
    "ExecutionsPage"
  )
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/notifications",
  component: lazyRouteComponent(
    () => import("@/features/notifications/pages/notifications-page"),
    "NotificationsPage"
  )
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/accounts",
  component: lazyRouteComponent(
    () => import("@/features/accounts/pages/accounts-page"),
    "AccountsPage"
  )
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/logs",
  component: lazyRouteComponent(() => import("@/features/logs/pages/logs-page"), "LogsPage")
});

const themesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/themes",
  component: lazyRouteComponent(
    () => import("@/features/themes/pages/themes-page"),
    "ThemesPage"
  )
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/settings",
  component: lazyRouteComponent(
    () => import("@/features/settings/pages/settings-page"),
    "SettingsPage"
  )
});

const deploymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/deployment",
  component: lazyRouteComponent(
    () => import("@/features/deployment/pages/deployment-page"),
    "DeploymentPage"
  )
});

const routeTree = rootRoute.addChildren([
  publicStatusRoute,
  dashboardRoute,
  nodesRoute,
  pingRoute,
  executionsRoute,
  notificationsRoute,
  accountsRoute,
  logsRoute,
  themesRoute,
  settingsRoute,
  deploymentRoute
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadDelay: 120
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
