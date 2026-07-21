import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect
} from "@tanstack/react-router";

import type { RuntimeConfig } from "@/app/config/runtime-config";

const AppShell = lazyRouteComponent(() => import("@/app/shell/app-shell"), "AppShell");
const OverviewPage = lazyRouteComponent(
  () => import("@/features/overview/pages/overview-page"),
  "OverviewPage"
);
const ServersPage = lazyRouteComponent(
  () => import("@/features/servers/pages/servers-page"),
  "ServersPage"
);
const ServerDetailPage = lazyRouteComponent(
  () => import("@/features/servers/pages/server-detail-page"),
  "ServerDetailPage"
);
const TasksPage = lazyRouteComponent(
  () => import("@/features/tasks/pages/tasks-page"),
  "TasksPage"
);
const CronPage = lazyRouteComponent(
  () => import("@/features/cron/pages/cron-page"),
  "CronPage"
);
const PingPage = lazyRouteComponent(
  () => import("@/features/ping/pages/ping-page"),
  "PingPage"
);
const AlertsPage = lazyRouteComponent(
  () => import("@/features/alerts/pages/alerts-page"),
  "AlertsPage"
);
const NotificationsPage = lazyRouteComponent(
  () => import("@/features/notifications/pages/notifications-page"),
  "NotificationsPage"
);
const LogsPage = lazyRouteComponent(
  () => import("@/features/logs/pages/logs-page"),
  "LogsPage"
);
const TokensPage = lazyRouteComponent(
  () => import("@/features/tokens/pages/tokens-page"),
  "TokensPage"
);
const AccountsPage = lazyRouteComponent(
  () => import("@/features/accounts/pages/accounts-page"),
  "AccountsPage"
);
const ThemesPage = lazyRouteComponent(
  () => import("@/features/themes/pages/themes-page"),
  "ThemesPage"
);
const SettingsPage = lazyRouteComponent(
  () => import("@/features/settings/pages/settings-page"),
  "SettingsPage"
);
const DeploymentPage = lazyRouteComponent(
  () => import("@/features/deployment/pages/deployment-page"),
  "DeploymentPage"
);

/**
 * Code-based route tree. The admin shell wraps every /admin/* route so the
 * sidebar/topbar persist across navigation. Public page (/) is intentionally
 * not built in this round and redirects to /admin for now.
 */
export interface RouterContext {
  config: RuntimeConfig;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />
});

function buildRouteTree() {
  return rootRoute.addChildren([
    indexRoute,
    adminRoute.addChildren([
      overviewRoute,
      serversRoute,
      serverDetailRoute,
      tasksRoute,
      cronRoute,
      pingRoute,
      alertsRoute,
      notificationsRoute,
      logsRoute,
      tokensRoute,
      accountsRoute,
      themesRoute,
      settingsRoute,
      deploymentRoute
    ])
  ]);
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  }
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AppShell
});

const overviewRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: OverviewPage
});

const serversRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "servers",
  component: ServersPage
});

const serverDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "servers/$id",
  component: ServerDetailPage
});

const tasksRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "tasks",
  component: TasksPage
});

const cronRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "cron",
  component: CronPage
});

const pingRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "ping",
  component: PingPage
});

const alertsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "alerts",
  component: AlertsPage
});

const notificationsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "notifications",
  component: NotificationsPage
});

const logsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "logs",
  component: LogsPage
});

const tokensRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "tokens",
  component: TokensPage
});

const accountsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "accounts",
  component: AccountsPage
});

const themesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "themes",
  component: ThemesPage
});

const settingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "settings",
  component: SettingsPage
});

const deploymentRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "deployment",
  component: DeploymentPage
});

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree: buildRouteTree(),
    context
  });
}
