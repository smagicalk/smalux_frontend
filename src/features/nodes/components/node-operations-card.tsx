import { KeyRoundIcon, RotateCwIcon, ShieldAlertIcon, TagsIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type NodeOperationsCardProps = {
  groups: readonly string[];
  onCreateToken: () => void;
  onRotateKeys: () => void;
};

export function NodeOperationsCard({
  groups,
  onCreateToken,
  onRotateKeys
}: NodeOperationsCardProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>运维控制</CardTitle>
        <CardDescription>节点页只保留最常用的操作入口。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button className="w-full justify-start" onClick={onCreateToken}>
          <KeyRoundIcon data-icon="inline-start" aria-hidden />
          创建注册 Token
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={onRotateKeys}>
          <RotateCwIcon data-icon="inline-start" aria-hidden />
          批量轮换密钥
        </Button>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <Badge key={group} variant="outline">
              <TagsIcon className="mr-1 size-3" aria-hidden />
              {group}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 rounded-xl border border-danger/25 bg-[color:var(--surface-danger)] p-3 text-sm">
          <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <span>吊销、删除和轮换必须二次确认，并写入审计。</span>
        </div>
      </CardContent>
    </Card>
  );
}
