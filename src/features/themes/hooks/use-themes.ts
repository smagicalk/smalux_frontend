import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export function useThemes() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.themes,
    queryFn: () => client.call("theme.list", {}, methods["theme.list"].result)
  });
}

export function useUploadTheme() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; version: string }) =>
      client.call("theme.upload", params, methods["theme.upload"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}

export function usePublishTheme() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("theme.publish", { id }, methods["theme.publish"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}

export function useArchiveTheme() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("theme.archive", { id }, methods["theme.archive"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}
