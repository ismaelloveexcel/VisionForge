import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mockProjects = [
  {
    id: "1",
    name: "Task Manager Pro",
    description: "A full-stack task management application with real-time collaboration features",
    status: "deployed" as const,
    techStack: ["React", "Express", "PostgreSQL", "WebSockets"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2),
    githubUrl: "https://github.com/user/task-manager",
    deployUrl: "https://task-manager.replit.app",
  },
  {
    id: "2",
    name: "Discord Notification Bot",
    description: "Sends custom notifications to your Discord server based on webhook triggers",
    status: "building" as const,
    techStack: ["Discord.js", "Node.js"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 30),
    githubUrl: "https://github.com/user/discord-bot",
  },
  {
    id: "3",
    name: "E-commerce API",
    description: "REST API for e-commerce platform with Stripe payment integration",
    status: "planning" as const,
    techStack: ["Express", "Stripe", "PostgreSQL"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "4",
    name: "Analytics Dashboard",
    description: "Real-time analytics dashboard with beautiful charts and data visualization",
    status: "error" as const,
    techStack: ["React", "Recharts", "D3.js"],
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 5),
    githubUrl: "https://github.com/user/analytics",
  },
];

export default function Projects() {
  const [search, setSearch] = useState("");

  const filteredProjects = mockProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI-DAN generated projects
          </p>
        </div>
        <Button className="gap-2" data-testid="button-new-project">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-projects"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button variant="secondary" data-testid="button-create-first">
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              onOpen={() => console.log("Open project:", project.id)}
              onDelete={() => console.log("Delete project:", project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
