import { nginxSnippet } from "@/features/deployment/model/deployment-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function DeploymentNginxCard() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Nginx 代理重点</CardTitle>
        <CardDescription>
          前端只依赖运行时配置，不在源码里硬编码后端地址。Nginx 的价值在于把静态交付和协议转发粘在一起。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="max-w-full overflow-x-auto whitespace-pre rounded-[1.15rem] bg-[color:var(--surface-muted)] p-4 text-xs leading-relaxed dark:bg-white/6">
          {nginxSnippet}
        </pre>
      </CardContent>
    </Card>
  );
}
