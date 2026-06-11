import { ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";

const rules = [
  "限制 zip 大小",
  "禁止路径穿越",
  "校验 manifest",
  "隔离公开主题 Cookie",
  "支持预览与回滚"
];

export function ThemePackageRules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>安全校验</CardTitle>
        <CardDescription>主题上传属于高风险入口，这里的限制项决定公开面是否会反向污染后台边界。</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
          {rules.map((rule) => (
            <li key={rule}>
              <InteractiveCardButton
                tone="muted"
                padding="sm"
                className="flex w-full items-center gap-3"
                onClick={() =>
                  toast.info("安全校验", {
                    description: rule
                  })
                }
              >
                <ShieldCheckIcon className="size-4 text-success" aria-hidden />
                <span>{rule}</span>
              </InteractiveCardButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
