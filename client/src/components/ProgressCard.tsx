import { Loader2, Check, Code2, FileText, Rocket, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ActionType = "analyzing" | "coding" | "deploying" | "documenting";

interface ProgressCardProps {
  action: ActionType;
  title: string;
  description?: string;
  progress?: number;
  status: "pending" | "in-progress" | "completed";
}

const actionIcons = {
  analyzing: Search,
  coding: Code2,
  deploying: Rocket,
  documenting: FileText,
};

export function ProgressCard({
  action,
  title,
  description,
  progress,
  status,
}: ProgressCardProps) {
  const Icon = actionIcons[action];

  return (
    <Card
      className="overflow-hidden"
      data-testid={`card-progress-${action}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
              status === "completed"
                ? "bg-status-online/10 text-status-online"
                : status === "in-progress"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {status === "completed" ? (
              <Check className="h-4 w-4" />
            ) : status === "in-progress" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium truncate">{title}</h4>
              {status === "in-progress" && progress !== undefined && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {progress}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            )}
            {status === "in-progress" && progress !== undefined && (
              <Progress value={progress} className="h-1 mt-2" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
