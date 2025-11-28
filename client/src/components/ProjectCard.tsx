import { formatDistanceToNow } from "date-fns";
import { MoreVertical, ExternalLink, Github, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  status: "planning" | "building" | "deployed" | "error";
  techStack: string[];
  lastUpdated: Date;
  githubUrl?: string;
  deployUrl?: string;
  onOpen?: () => void;
  onDelete?: () => void;
}

const statusColors = {
  planning: "bg-chart-4/10 text-chart-4",
  building: "bg-chart-1/10 text-chart-1",
  deployed: "bg-status-online/10 text-status-online",
  error: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  planning: "Planning",
  building: "Building",
  deployed: "Deployed",
  error: "Error",
};

export function ProjectCard({
  id,
  name,
  description,
  status,
  techStack,
  lastUpdated,
  githubUrl,
  deployUrl,
  onOpen,
  onDelete,
}: ProjectCardProps) {
  return (
    <Card
      className="group hover-elevate overflow-hidden cursor-pointer"
      onClick={onOpen}
      data-testid={`card-project-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium truncate">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {description}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 shrink-0"
                data-testid={`button-project-menu-${id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {githubUrl && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(githubUrl, "_blank");
                  }}
                >
                  <Github className="h-4 w-4 mr-2" />
                  Open in GitHub
                </DropdownMenuItem>
              )}
              {deployUrl && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(deployUrl, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Deployment
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
          {techStack.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {techStack.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{techStack.length - 3}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
