import { describe, expect, it } from "vitest";

import { createRuntimeSegments } from "@/features/deployment/model/deployment-page-insights";
import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";

const targets: DeploymentTarget[] = [
  {
    id: "static",
    name: "静态部署",
    description: "dist",
    status: "ready",
    strengths: [],
    checklist: []
  },
  {
    id: "rust",
    name: "Rust",
    description: "embed",
    status: "planned",
    strengths: [],
    checklist: []
  },
  {
    id: "nginx",
    name: "Nginx",
    description: "proxy",
    status: "ready",
    strengths: [],
    checklist: []
  }
];

describe("deployment page insights", () => {
  it("creates runtime status segments from deployment targets", () => {
    expect(createRuntimeSegments(targets).map((segment) => [segment.label, segment.value])).toEqual([
      ["已就绪", 2],
      ["规划中", 1]
    ]);
  });
});
