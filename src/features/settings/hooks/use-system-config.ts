import { useMutation } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http/http-client";

/**
 * 诊断网络连通性与 DNS 延时 (HTTP POST /api/v1/system/network/diagnose)
 */
export function useDiagnoseNetwork() {
  return useMutation({
    mutationFn: () =>
      httpClient.post<{ ok: boolean; dnsLatency: number; gatewayLatency: number; probeMeshLatency: number }>(
        "/api/v1/system/network/diagnose"
      )
  });
}
