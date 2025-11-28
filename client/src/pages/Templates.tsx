import { useState } from "react";
import { TemplateCard } from "@/components/TemplateCard";
import { Button } from "@/components/ui/button";

type CategoryFilter = "all" | "web-app" | "discord-bot" | "api" | "dashboard" | "hr";

const templates = [
  {
    type: "discord-bot" as const,
    title: "Discord Notification Bot",
    description: "Send automated notifications to your Discord server with customizable triggers",
    tags: ["Discord.js", "Node.js", "Webhooks"],
    category: "discord-bot" as const,
  },
  {
    type: "web-app" as const,
    title: "Task Management App",
    description: "Full-stack task manager with real-time updates and team collaboration",
    tags: ["React", "Express", "PostgreSQL", "WebSockets"],
    category: "web-app" as const,
  },
  {
    type: "api" as const,
    title: "REST API Starter",
    description: "Production-ready REST API with authentication and rate limiting",
    tags: ["Express", "JWT", "PostgreSQL"],
    category: "api" as const,
  },
  {
    type: "dashboard" as const,
    title: "Analytics Dashboard",
    description: "Beautiful data visualization dashboard with charts and real-time updates",
    tags: ["React", "Recharts", "Tailwind"],
    category: "dashboard" as const,
  },
  {
    type: "discord-bot" as const,
    title: "Moderation Bot",
    description: "Discord moderation bot with auto-mod, warnings, and logging features",
    tags: ["Discord.js", "Node.js", "SQLite"],
    category: "discord-bot" as const,
  },
  {
    type: "web-app" as const,
    title: "E-commerce Store",
    description: "Complete e-commerce solution with cart, checkout, and payment integration",
    tags: ["React", "Stripe", "PostgreSQL"],
    category: "web-app" as const,
  },
  {
    type: "hr-contract" as const,
    title: "UAE Employment Contract",
    description: "Compliant fixed-term employment contract template for UAE private sector",
    tags: ["Legal", "UAE Labor Law", "Template"],
    category: "hr" as const,
  },
  {
    type: "hr-calculator" as const,
    title: "HR Compliance Suite",
    description: "Complete HR toolkit with gratuity calculator, leave tracker, and WPS validator",
    tags: ["Calculator", "Compliance", "2025 Updates"],
    category: "hr" as const,
  },
];

const categories: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "web-app", label: "Web Apps" },
  { value: "discord-bot", label: "Discord Bots" },
  { value: "api", label: "APIs" },
  { value: "dashboard", label: "Dashboards" },
  { value: "hr", label: "HR Documents" },
];

export default function Templates() {
  const [filter, setFilter] = useState<CategoryFilter>("all");

  const filteredTemplates =
    filter === "all"
      ? templates
      : templates.filter((t) => t.category === filter);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Templates</h1>
        <p className="text-muted-foreground">
          Start building faster with pre-built templates for apps, bots, and HR documents
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(({ value, label }) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(value)}
            data-testid={`button-filter-${value}`}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map((template, index) => (
          <TemplateCard
            key={index}
            {...template}
            onUse={() => console.log("Use template:", template.title)}
          />
        ))}
      </div>
    </div>
  );
}
