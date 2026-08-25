import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { ThemeListResult } from "@/shared/api/methods";

export function useThemes() {
  return useQuery({
    queryKey: queryKeys.themes,
    queryFn: () => httpClient.get<ThemeListResult>("/api/v1/themes")
  });
}

export function useUploadTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; version: string }) =>
      httpClient.post("/api/v1/themes/upload", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}

export function usePublishTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.post(`/api/v1/themes/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}

export function useArchiveTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.post(`/api/v1/themes/${id}/archive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.themes })
  });
}
