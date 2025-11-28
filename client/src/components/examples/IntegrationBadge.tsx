import { IntegrationBadge } from "../IntegrationBadge";

export default function IntegrationBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <IntegrationBadge name="github" status="connected" />
      <IntegrationBadge name="discord" status="connected" />
      <IntegrationBadge name="notion" status="connected" />
    </div>
  );
}
