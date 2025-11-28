import {
  Bot,
  Globe,
  LayoutDashboard,
  Server,
  FileText,
  Calculator,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TemplateType =
  | "discord-bot"
  | "web-app"
  | "api"
  | "dashboard"
  | "hr-contract"
  | "hr-calculator";

interface TemplateCardProps {
  type: TemplateType;
  title: string;
  description: string;
  tags: string[];
  onUse: () => void;
}

const typeIcons = {
  "discord-bot": Bot,
  "web-app": Globe,
  api: Server,
  dashboard: LayoutDashboard,
  "hr-contract": FileText,
  "hr-calculator": Calculator,
};

export function TemplateCard({
  type,
  title,
  description,
  tags,
  onUse,
}: TemplateCardProps) {
  const Icon = typeIcons[type];

  return (
    <Card
      className="group overflow-hidden hover-elevate"
      data-testid={`card-template-${type}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={onUse}
              data-testid={`button-use-template-${type}`}
            >
              Use Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
