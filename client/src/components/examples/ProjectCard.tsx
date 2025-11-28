import { ProjectCard } from "../ProjectCard";

export default function ProjectCardExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      <ProjectCard
        id="1"
        name="Task Manager App"
        description="A full-stack task management application with real-time updates"
        status="deployed"
        techStack={["React", "Express", "PostgreSQL", "WebSockets"]}
        lastUpdated={new Date(Date.now() - 1000 * 60 * 60 * 2)}
        githubUrl="https://github.com"
        deployUrl="https://example.com"
        onOpen={() => console.log("Open project")}
        onDelete={() => console.log("Delete project")}
      />
      <ProjectCard
        id="2"
        name="Discord Notification Bot"
        description="Sends custom notifications to your Discord server"
        status="building"
        techStack={["Discord.js", "Node.js"]}
        lastUpdated={new Date(Date.now() - 1000 * 60 * 30)}
      />
    </div>
  );
}
