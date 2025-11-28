import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Code2, Users, Rocket } from "lucide-react";
import aiDanAvatar from "@assets/generated_images/ai-dan_nerdy_mascot_avatar.png";

interface WelcomeCardProps {
  mode: "development" | "hr";
  onQuickAction: (action: string) => void;
}

const devActions = [
  { icon: Code2, label: "Build an App", prompt: "I want to build a new application" },
  { icon: Rocket, label: "Create Discord Bot", prompt: "Create a Discord bot for me" },
  { icon: Sparkles, label: "Generate API", prompt: "Generate a REST API" },
];

const hrActions = [
  { icon: Users, label: "Check Compliance", prompt: "Review my HR compliance" },
  { icon: Sparkles, label: "Calculate Gratuity", prompt: "Calculate end of service gratuity" },
  { icon: Code2, label: "Draft Contract", prompt: "Help me draft an employment contract" },
];

export function WelcomeCard({ mode, onQuickAction }: WelcomeCardProps) {
  const actions = mode === "development" ? devActions : hrActions;

  return (
    <Card className="border-dashed" data-testid="card-welcome">
      <CardContent className="flex flex-col items-center py-8 text-center">
        <Avatar className="h-20 w-20 mb-4">
          <AvatarImage src={aiDanAvatar} alt="AI-DAN" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
            DAN
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-semibold mb-1">Hey there! I'm AI-DAN</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          {mode === "development"
            ? "Your nerdy coding genius ready to turn your ideas into fully deployed apps. I can create repos, deploy bots, and document everything in Notion!"
            : "Your UAE HR compliance expert. I know Federal Decree-Law No. 33/2021 inside out and can help with gratuity calculations, contract reviews, and Emiratisation quotas."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {actions.map(({ icon: Icon, label, prompt }) => (
            <Button
              key={label}
              variant="secondary"
              onClick={() => onQuickAction(prompt)}
              className="gap-2"
              data-testid={`button-quick-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
