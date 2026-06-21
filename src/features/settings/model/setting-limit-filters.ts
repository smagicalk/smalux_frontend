import type { SettingLimitGroup } from "@/features/settings/model/setting-limits";

export type SettingLimitFilters = {
  query: string;
  selectedGroupTitle: string;
};

export function filterSettingLimitGroups(
  groups: readonly SettingLimitGroup[],
  filters: SettingLimitFilters
): SettingLimitGroup[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return groups
    .filter((group) => filters.selectedGroupTitle === "all" || group.title === filters.selectedGroupTitle)
    .map((group) => ({
      ...group,
      rows: group.rows.filter(([key, value]) => {
        if (!normalizedQuery) {
          return true;
        }

        return [group.title, group.badge, key, value].join(" ").toLowerCase().includes(normalizedQuery);
      })
    }))
    .filter((group) => group.rows.length > 0);
}

export function countSettingLimitRows(groups: readonly SettingLimitGroup[]) {
  return groups.reduce((total, group) => total + group.rows.length, 0);
}
