import type { MonitorNode } from "@/shared/domain/node";
import type { PingCheck } from "@/features/ping/model/mock-ping";

import { PublicRegionCard } from "@/features/public/components/public-region-card";
import { PublicServiceList } from "@/features/public/components/public-service-list";
import { PublicSubscribeCard } from "@/features/public/components/public-subscribe-card";

type PublicServiceSectionProps = {
  checks: readonly PingCheck[];
  regions: readonly MonitorNode[];
  subscriberEmail: string;
  onSubscriberEmailChange: (value: string) => void;
  onSubscribe: () => void;
  onServiceClick: (check: PingCheck) => void;
  onRegionClick: (node: MonitorNode) => void;
};

export function PublicServiceSection({
  checks,
  regions,
  subscriberEmail,
  onSubscriberEmailChange,
  onSubscribe,
  onServiceClick,
  onRegionClick
}: PublicServiceSectionProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <PublicServiceList checks={checks} onServiceClick={onServiceClick} />
      <div className="grid gap-4">
        <PublicSubscribeCard
          subscriberEmail={subscriberEmail}
          onSubscriberEmailChange={onSubscriberEmailChange}
          onSubscribe={onSubscribe}
        />
        <PublicRegionCard regions={regions} onRegionClick={onRegionClick} />
      </div>
    </section>
  );
}
