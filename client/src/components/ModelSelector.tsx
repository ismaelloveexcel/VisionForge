import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";

interface ModelConfig {
  provider: string;
  name: string;
  description: string;
}

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

const providerLabels: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  openrouter: "DeepSeek & Grok",
};

const providerColors: Record<string, string> = {
  openai: "bg-green-500/10 text-green-500",
  anthropic: "bg-orange-500/10 text-orange-500",
  openrouter: "bg-blue-500/10 text-blue-500",
};

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { data: models, isLoading } = useQuery<Record<string, ModelConfig>>({
    queryKey: ["/api/models"],
  });

  if (isLoading || !models) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4 animate-pulse" />
        Loading models...
      </div>
    );
  }

  const groupedModels = Object.entries(models).reduce(
    (acc, [id, config]) => {
      if (!acc[config.provider]) {
        acc[config.provider] = [];
      }
      acc[config.provider].push({ id, ...config });
      return acc;
    },
    {} as Record<string, Array<{ id: string } & ModelConfig>>
  );

  const currentModel = models[value];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="w-[220px] gap-2"
        data-testid="select-model"
      >
        <Cpu className="h-4 w-4 shrink-0" />
        <SelectValue placeholder="Select AI model">
          {currentModel?.name || "Select model"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs ${providerColors[provider] || ""}`}
              >
                {providerLabels[provider] || provider}
              </Badge>
            </SelectLabel>
            {providerModels.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                data-testid={`model-option-${model.id}`}
              >
                <div className="flex flex-col">
                  <span>{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
