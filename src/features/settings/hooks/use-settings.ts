import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export function useSettings() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => client.call("config.list", {}, methods["config.list"].result)
  });
}

/** Batch-save the changed settings as a single mutation. */
export function useSaveSettings() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (changes: { key: string; value: string }[]) => {
      for (const c of changes) {
        await client.call("config.update", c, methods["config.update"].result);
      }
      return { ok: true };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings })
  });
}
