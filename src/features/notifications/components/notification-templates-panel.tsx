import { MailIcon, RadioIcon, ShieldCheckIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

const notificationTemplates = [
  { icon: RadioIcon, title: "告警触发", value: "{{severity}} {{target}} {{message}}" },
  { icon: ShieldCheckIcon, title: "恢复通知", value: "{{target}} 已恢复，持续 {{duration}}" },
  { icon: MailIcon, title: "测试通知", value: "smalux 测试消息 / {{channel}}" }
] as const;

type NotificationTemplatesPanelProps = {
  onInspect: (title: string, value: string) => void;
};

export function NotificationTemplatesPanel({ onInspect }: NotificationTemplatesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>通知模板</CardTitle>
        <CardDescription>模板变量可前端预览，但真正渲染和脱敏逻辑必须以后端为准。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {notificationTemplates.map((template) => (
          <TemplateRow
            key={template.title}
            icon={template.icon}
            title={template.title}
            value={template.value}
            onInspect={onInspect}
          />
        ))}
      </CardContent>
    </Card>
  );
}

type TemplateRowProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  onInspect: (title: string, value: string) => void;
};

function TemplateRow({ icon: Icon, title, value, onInspect }: TemplateRowProps) {
  return (
    <InteractiveCardButton
      tone="muted"
      padding="sm"
      className="text-left"
      onClick={() => onInspect(title, value)}
    >
      <div className="flex items-center gap-2 font-semibold tracking-[-0.02em]">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span>{title}</span>
      </div>
      <p className="mt-2 rounded-xl bg-white/70 p-2 font-mono text-xs dark:bg-white/6">{value}</p>
    </InteractiveCardButton>
  );
}
