export type ThemeStatus = "active" | "preview" | "draft";

export type PublicTheme = {
  id: string;
  name: string;
  short: string;
  version: string;
  author: string;
  status: ThemeStatus;
  entry: string;
  updatedAt: string;
  configuration: Array<{
    key: string;
    label: string;
    type: "string" | "boolean" | "color" | "select";
    value: string | boolean;
    group: string;
  }>;
};

export const mockPublicThemes: PublicTheme[] = [
  {
    id: "theme-modern",
    name: "Modern Status",
    short: "modern-status",
    version: "1.0.0",
    author: "smalux",
    status: "active",
    entry: "dist/index.html",
    updatedAt: "2026-06-09T09:00:00.000Z",
    configuration: [
      {
        key: "brandName",
        label: "品牌名称",
        type: "string",
        value: "smalux",
        group: "基础"
      },
      {
        key: "primaryColor",
        label: "主色",
        type: "color",
        value: "#00967d",
        group: "颜色"
      },
      {
        key: "showOfflineNodes",
        label: "展示离线服务器",
        type: "boolean",
        value: true,
        group: "展示"
      }
    ]
  },
  {
    id: "theme-compact",
    name: "Compact Ops",
    short: "compact-ops",
    version: "0.8.2",
    author: "community",
    status: "preview",
    entry: "dist/index.html",
    updatedAt: "2026-06-08T14:30:00.000Z",
    configuration: [
      {
        key: "density",
        label: "密度",
        type: "select",
        value: "compact",
        group: "布局"
      },
      {
        key: "showCharts",
        label: "显示图表",
        type: "boolean",
        value: true,
        group: "展示"
      }
    ]
  },
  {
    id: "theme-neon",
    name: "Public Neon",
    short: "public-neon",
    version: "0.2.0",
    author: "community",
    status: "draft",
    entry: "dist/index.html",
    updatedAt: "2026-06-09T07:55:00.000Z",
    configuration: [
      {
        key: "accentColor",
        label: "强调色",
        type: "color",
        value: "#d946ef",
        group: "颜色"
      },
      {
        key: "allowRemoteAssets",
        label: "允许远程资源",
        type: "boolean",
        value: false,
        group: "安全"
      },
      {
        key: "layoutMode",
        label: "布局模式",
        type: "select",
        value: "public-safe",
        group: "布局"
      }
    ]
  },
  {
    id: "theme-enterprise",
    name: "Enterprise Grid",
    short: "enterprise-grid",
    version: "1.1.3",
    author: "smalux",
    status: "preview",
    entry: "dist/index.html",
    updatedAt: "2026-06-09T06:20:00.000Z",
    configuration: [
      {
        key: "showRegionMap",
        label: "展示区域地图",
        type: "boolean",
        value: true,
        group: "展示"
      },
      {
        key: "publicDetailLevel",
        label: "公开详情级别",
        type: "select",
        value: "summary",
        group: "隐私"
      }
    ]
  }
];
