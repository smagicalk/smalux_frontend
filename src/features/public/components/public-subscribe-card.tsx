import { MailIcon, SignalIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type PublicSubscribeCardProps = {
  subscriberEmail: string;
  onSubscriberEmailChange: (value: string) => void;
  onSubscribe: () => void;
};

export function PublicSubscribeCard({
  subscriberEmail,
  onSubscriberEmailChange,
  onSubscribe
}: PublicSubscribeCardProps) {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>订阅更新</CardTitle>
        <CardDescription>访客可以订阅公开事件，后台渠道和敏感通知配置不会外露。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">邮箱</span>
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/45 bg-white/70 px-3 dark:border-white/8 dark:bg-white/6">
            <MailIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              placeholder="you@example.com"
              value={subscriberEmail}
              onChange={(event) => onSubscriberEmailChange(event.target.value)}
            />
          </div>
        </label>
        <Button onClick={onSubscribe}>
          <SignalIcon data-icon="inline-start" aria-hidden />
          订阅状态更新
        </Button>
      </CardContent>
    </Card>
  );
}
