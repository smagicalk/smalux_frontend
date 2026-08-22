import { useQuery } from "@tanstack/react-query";
import { methods, type OverviewStatsResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * Fetch dedicated aggregate cluster metrics for the Overview Cockpit HUD.
 * Wraps the `overview.stats` RPC in a TanStack Query with automatic caching & refetching.
 */
export function useOverviewStats() {
  const { client } = useRpc();
  return useQuery<OverviewStatsResult>({
    queryKey: queryKeys.overviewStats,
    queryFn: () =>
      client.call(
        "overview.stats",
        {},
        methods["overview.stats"].result
      ),
    refetchInterval: 5000 // Automatically refresh cockpit HUD every 5s
  });
}
