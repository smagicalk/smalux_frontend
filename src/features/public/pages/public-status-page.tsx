import { Link } from "@tanstack/react-router";
import { ActivityIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { mockNotificationEvents } from "@/features/notifications/model/mock-notifications";
import { mockPingChecks, createPingSummary } from "@/features/ping/model/mock-ping";
import { pingLossTrend } from "@/features/ping/model/mock-ping-metrics";
import { PublicEventTimeline } from "@/features/public/components/public-event-timeline";
import { PublicFleetSection } from "@/features/public/components/public-fleet-section";
import { PublicHealthPanel } from "@/features/public/components/public-health-panel";
import { PublicHeroPanel } from "@/features/public/components/public-hero-panel";
import { PublicServiceSection } from "@/features/public/components/public-service-section";

const uptimeBars = [
  "success",
  "success",
  "success",
  "success",
  "warning",
  "success",
  "success",
  "success",
  "danger",
  "success",
  "success",
  "success",
  "success",
  "success"
] as const;

export function PublicStatusPage() {
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const pingSummary = createPingSummary(mockPingChecks);
  const onlineNodes = mockNodes.filter((node) => node.status === "online").length;
  const degradedChecks = mockPingChecks.filter((check) => check.status !== "ok");
  const isOperational = degradedChecks.length === 0 && onlineNodes === mockNodes.length;
  const availabilityTrend = pingLossTrend.map((value) => 100 - value);

  const subscribeStatusUpdates = () => {
    const normalizedEmail = subscriberEmail.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("邮箱格式需要检查", {
        description: "请输入可接收公开状态更新的邮箱地址。"
      });
      return;
    }

    toast.success("订阅请求已记录", {
      description: `${normalizedEmail} · mock public status subscription`
    });
  };

  const announceNode = (node: (typeof mockNodes)[number]) => {
    toast.info(node.name, {
      description: `${node.region} · ${node.group} · CPU ${node.cpu}% · ${node.latencyMs}ms`
    });
  };

  const announceService = (check: (typeof mockPingChecks)[number]) => {
    toast.info(check.name, {
      description: `${check.protocol} · ${check.region} · ${check.availability.toFixed(2)}%`
    });
  };

  const announceEvent = (event: (typeof mockNotificationEvents)[number], index: number) => {
    toast.info(event.title, {
      description: `${index === 0 ? "刚刚" : index === 1 ? "23 分钟前" : "1 小时前"} · ${event.detail}`
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <header className="border-b border-white/45 bg-background/76 backdrop-blur-xl dark:border-white/8">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <ActivityIcon aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                Public Status
              </p>
              <p className="truncate text-lg font-semibold tracking-[-0.03em]">smalux</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/50 bg-white/60 px-4 text-sm font-semibold text-muted-foreground transition hover:-translate-y-0.5 hover:text-foreground dark:border-white/8 dark:bg-white/6"
          >
            后台
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <PublicHeroPanel
            isOperational={isOperational}
            onlineNodes={onlineNodes}
            totalNodes={mockNodes.length}
            availability={pingSummary.availability}
            latency={pingSummary.latency}
          />
          <PublicHealthPanel
            uptimeBars={uptimeBars}
            apiAvailability={99.91}
            pageAvailability={99.98}
            edgeAvailability={93.4}
            trendValues={availabilityTrend}
          />
        </section>

        <PublicFleetSection nodes={mockNodes} onNodeClick={announceNode} />

        <PublicServiceSection
          checks={mockPingChecks}
          regions={mockNodes}
          subscriberEmail={subscriberEmail}
          onSubscriberEmailChange={setSubscriberEmail}
          onSubscribe={subscribeStatusUpdates}
          onServiceClick={announceService}
          onRegionClick={announceNode}
        />

        <PublicEventTimeline events={mockNotificationEvents.slice(0, 3)} onEventClick={announceEvent} />
      </main>
    </div>
  );
}
