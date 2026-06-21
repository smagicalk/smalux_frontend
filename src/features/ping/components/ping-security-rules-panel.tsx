import { ShieldAlertIcon } from "lucide-react";

import { pingSecurityRules } from "@/features/ping/model/ping-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type PingSecurityRulesPanelProps = {
  onInspect: (rule: string) => void;
};

export function PingSecurityRulesPanel({ onInspect }: PingSecurityRulesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>安全限制</CardTitle>
        <CardDescription>外联能力必须持续暴露风险边界，而不是只显示“可新增目标”。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 lg:grid-cols-2">
        {pingSecurityRules.map((item) => (
          <InteractiveCardButton
            key={item}
            tone="muted"
            padding="sm"
            className="flex gap-3 bg-[color:var(--surface-warning)] text-left text-sm border-warning/25"
            onClick={() => onInspect(item)}
          >
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <span>{item}</span>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
