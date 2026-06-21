import { describe, expect, it } from "vitest";
import { FileArchiveIcon, RadioIcon } from "lucide-react";

import { countSettingLimitRows, filterSettingLimitGroups } from "@/features/settings/model/setting-limit-filters";
import type { SettingLimitGroup } from "@/features/settings/model/setting-limits";

const groups: SettingLimitGroup[] = [
  {
    title: "主题上传",
    icon: FileArchiveIcon,
    badge: "高风险",
    rows: [
      ["maxZipSizeMb", "20"],
      ["isolatePublicThemeCookies", "true"]
    ]
  },
  {
    title: "Ping 监测",
    icon: RadioIcon,
    badge: "外联",
    rows: [
      ["allowPrivateAddress", "false"],
      ["maxTargets", "200"]
    ]
  }
];

describe("setting limit filters", () => {
  it("filters groups by title and query", () => {
    const result = filterSettingLimitGroups(groups, {
      query: "private",
      selectedGroupTitle: "Ping 监测"
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.rows).toEqual([["allowPrivateAddress", "false"]]);
  });

  it("counts visible rows after filtering", () => {
    const result = filterSettingLimitGroups(groups, {
      query: "",
      selectedGroupTitle: "all"
    });

    expect(countSettingLimitRows(result)).toBe(4);
  });
});
