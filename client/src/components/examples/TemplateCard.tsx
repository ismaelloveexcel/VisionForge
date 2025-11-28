import { TemplateCard } from "../TemplateCard";

export default function TemplateCardExample() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      <TemplateCard
        type="discord-bot"
        title="Discord Notification Bot"
        description="A bot that sends notifications to your Discord server"
        tags={["Discord.js", "Node.js"]}
        onUse={() => console.log("Use Discord bot template")}
      />
      <TemplateCard
        type="web-app"
        title="Task Management App"
        description="Full-stack task manager with real-time updates"
        tags={["React", "Express", "PostgreSQL"]}
        onUse={() => console.log("Use web app template")}
      />
    </div>
  );
}
