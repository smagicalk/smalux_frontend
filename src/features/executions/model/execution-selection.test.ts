import { describe, expect, it } from "vitest";

import {
  countApprovalTemplates,
  countFailedExecutionRuns,
  createExecutionSelectionSummary,
  findCommandTemplate
} from "@/features/executions/model/execution-selection";
import type { CommandTemplate, ExecutionRun } from "@/features/executions/model/mock-executions";

const templates: CommandTemplate[] = [
  {
    id: "safe",
    name: "Safe",
    description: "read only",
    command: "df -h",
    scope: "Operator",
    risk: "low",
    requiresApproval: false
  },
  {
    id: "danger",
    name: "Danger",
    description: "write operation",
    command: "systemctl restart nginx",
    scope: "Admin",
    risk: "high",
    requiresApproval: true
  }
];

const runs: ExecutionRun[] = [
  {
    id: "success",
    target: "node-1",
    command: "df -h",
    operator: "operator@example.com",
    status: "success",
    risk: "low",
    startedAt: "2026-06-09T00:00:00.000Z",
    durationMs: 100,
    outputPreview: "ok"
  },
  {
    id: "failed",
    target: "node-2",
    command: "systemctl restart nginx",
    operator: "admin@example.com",
    status: "failed",
    risk: "high",
    startedAt: "2026-06-09T00:00:00.000Z",
    durationMs: 1000,
    outputPreview: "failed"
  }
];

describe("execution selection", () => {
  it("finds selected templates and falls back to the first template", () => {
    expect(findCommandTemplate(templates, "danger")?.id).toBe("danger");
    expect(findCommandTemplate(templates, "missing")?.id).toBe("safe");
  });

  it("counts approval templates and failed runs", () => {
    expect(countApprovalTemplates(templates)).toBe(1);
    expect(countFailedExecutionRuns(runs)).toBe(1);
  });

  it("creates a direct execution summary", () => {
    expect(createExecutionSelectionSummary(templates, "danger", "Edge 分组")).toMatchObject({
      selectedTemplate: templates[1],
      selectedRisk: "高风险",
      impactValue: "Edge 分组",
      tokenScope: "Admin",
      approvalLabel: "需要"
    });
  });
});
