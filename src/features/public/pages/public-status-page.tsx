import { useState } from "react";
import { toast } from "sonner";

import { mockNodes } from "@/features/nodes/model/mock-nodes";
import { mockNotificationEvents } from "@/features/notifications/model/mock-notifications";
import { mockPingChecks } from "@/features/ping/model/mock-ping";
import { pingLossTrend } from "@/features/ping/model/mock-ping-metrics";
import { PublicEventTimeline } from "@/features/public/components/public-event-timeline";
import { PublicFleetSection } from "@/features/public/components/public-fleet-section";
import { PublicHealthPanel } from "@/features/public/components/public-health-panel";
import { PublicHeroPanel } from "@/features/public/components/public-hero-panel";
import { PublicServiceSection } from "@/features/public/components/public-service-section";
import { PublicStatusHeader } from "@/features/public/components/public-status-header";
import { createPublicStatusSummary, publicUptimeBars } from "@/features/public/model/public-status-summary";

export function PublicStatusPage() {
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const statusSummary = createPublicStatusSummary(mockNodes, mockPingChecks);
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
      <PublicStatusHeader />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <PublicHeroPanel
            isOperational={statusSummary.isOperational}
            onlineNodes={statusSummary.onlineNodes}
            totalNodes={statusSummary.totalNodes}
            availability={statusSummary.availability}
            latency={statusSummary.latency}
          />
          <PublicHealthPanel
            uptimeBars={publicUptimeBars}
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
