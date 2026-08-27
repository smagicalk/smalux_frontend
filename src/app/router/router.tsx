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
const InfrastructurePage = lazyRouteComponent(
  () => import("@/features/infrastructure/pages/infrastructure-page"),
  "InfrastructurePage"
);
const ServerDetailPage = lazyRouteComponent(
  () => import("@/features/infrastructure/pages/server-detail-page"),
  "ServerDetailPage"
);
const ServerTasksPage = lazyRouteComponent(
  () => import("@/features/infrastructure/pages/server-tasks-page"),
  "ServerTasksPage"
);
const AutomationPage = lazyRouteComponent(
  () => import("@/features/automation/pages/automation-page"),
  "AutomationPage"
);
const AlertsPage = lazyRouteComponent(
  () => import("@/features/alerts/pages/alerts-page"),
  "AlertsPage"
);
const SettingsPage = lazyRouteComponent(
  () => import("@/features/settings/pages/settings-page"),
  "SettingsPage"
);

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
      overviewIndexRoute,
      overviewRoute,
      infrastructureRoute,
      infrastructureServerDetailRoute,
      infrastructureServerTasksRoute,
      automationRoute,
      alertsRoute,
      settingsRoute,
      // Legacy redirects to cohesive modules
      serversRedirectRoute,
      serversIdRedirectRoute,
      pingRedirectRoute,
      tasksRedirectRoute,
      cronRedirectRoute,
      notificationsRedirectRoute,
      logsRedirectRoute,
      tokensRedirectRoute,
      accountsRedirectRoute,
      themesRedirectRoute,
      deploymentRedirectRoute
    ])
  ]);
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/overview" });
  }
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AppShell
});

const overviewIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: OverviewPage
});

const overviewRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "overview",
  component: OverviewPage
});

const infrastructureRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "infrastructure",
  component: InfrastructurePage
});

const infrastructureServerDetailRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "infrastructure/servers/$serverId",
  component: ServerDetailPage
});

const infrastructureServerTasksRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "infrastructure/servers/$serverId/tasks",
  component: ServerTasksPage
});

const automationRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "automation",
  component: AutomationPage
});

const alertsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "alerts",
  component: AlertsPage
});

const settingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "settings",
  component: SettingsPage
});

// Legacy redirects
const serversRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "servers",
  beforeLoad: () => { throw redirect({ to: "/admin/infrastructure" }); }
});
const serversIdRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "servers/$serverId",
  beforeLoad: ({ params }) => { throw redirect({ to: `/admin/infrastructure/servers/${params.serverId}` }); }
});
const pingRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "ping",
  beforeLoad: () => { throw redirect({ to: "/admin/infrastructure" }); }
});
const tasksRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "tasks",
  beforeLoad: () => { throw redirect({ to: "/admin/automation" }); }
});
const cronRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "cron",
  beforeLoad: () => { throw redirect({ to: "/admin/automation" }); }
});
const notificationsRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "notifications",
  beforeLoad: () => { throw redirect({ to: "/admin/alerts" }); }
});
const logsRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "logs",
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); }
});
const tokensRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "tokens",
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); }
});
const accountsRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "accounts",
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); }
});
const themesRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "themes",
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); }
});
const deploymentRedirectRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "deployment",
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); }
});

export function createAppRouter(context: RouterContext) {
  const basepath = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  return createRouter({
    routeTree: buildRouteTree(),
    basepath: basepath.replace(/\/+$/, "") || undefined,
    context
  });
}
