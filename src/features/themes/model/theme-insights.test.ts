import { describe, expect, it } from "vitest";

import {
  createThemeConfigTypeBars,
  createThemeStatusSegments,
  filterThemesByStatus
} from "@/features/themes/model/theme-insights";
import type { PublicTheme } from "@/features/themes/model/mock-themes";

const themes: PublicTheme[] = [
  {
    id: "active",
    name: "Active",
    short: "active",
    version: "1.0.0",
    author: "smalux",
    status: "active",
    entry: "dist/index.html",
    updatedAt: "2026-06-09T00:00:00.000Z",
    configuration: [
      { key: "brand", label: "品牌", type: "string", value: "smalux", group: "基础" },
      { key: "accent", label: "强调色", type: "color", value: "#00967d", group: "颜色" }
    ]
  },
  {
    id: "draft",
    name: "Draft",
    short: "draft",
    version: "0.1.0",
    author: "community",
    status: "draft",
    entry: "dist/index.html",
    updatedAt: "2026-06-09T00:00:00.000Z",
    configuration: [
      { key: "showCharts", label: "显示图表", type: "boolean", value: true, group: "展示" }
    ]
  }
];

describe("theme insights", () => {
  it("filters themes by lifecycle status", () => {
    expect(filterThemesByStatus(themes, "draft").map((theme) => theme.id)).toEqual(["draft"]);
  });

  it("groups theme configuration fields by type", () => {
    expect(createThemeConfigTypeBars(themes)).toEqual([
      { label: "string", value: 1 },
      { label: "color", value: 1 },
      { label: "boolean", value: 1 }
    ]);
  });

  it("creates lifecycle status segments in stable order", () => {
    expect(createThemeStatusSegments(themes).map((segment) => [segment.label, segment.value])).toEqual([
      ["已启用", 1],
      ["预览中", 0],
      ["草稿", 1]
    ]);
  });
});
