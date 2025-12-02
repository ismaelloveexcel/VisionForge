import { SiGithub, SiDiscord, SiNotion } from "react-icons/si";
import { Badge } from "@/components/ui/badge";

interface IntegrationBadgeProps {
  name: "github" | "discord" | "notion";
  status: "connected" | "available" | "setup-required";
}

const icons = {
  github: SiGithub,
  discord: SiDiscord,
  notion: SiNotion,
};

const labels = {
  github: "GitHub",
  discord: "Discord",
  notion: "Notion",
};

export function IntegrationBadge({ name, status }: IntegrationBadgeProps) {
  const Icon = icons[name];

  return (
    <Badge
      variant="secondary"
      className="gap-1.5"
      data-testid={`badge-integration-${name}`}
    >
      <Icon className="h-3 w-3" />
      <span>{labels[name]}</span>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "connected"
            ? "bg-green-500"
            : status === "available"
              ? "bg-blue-400"
              : "bg-amber-500"
        }`}
      />
    </Badge>
  );
}
