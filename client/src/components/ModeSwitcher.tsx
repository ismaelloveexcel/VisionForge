import { Code2, Users } from "lucide-react";

interface ModeSwitcherProps {
  mode: "development" | "hr";
  onModeChange: (mode: "development" | "hr") => void;
}

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
      <button
        onClick={() => onModeChange("development")}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === "development"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover-elevate"
        }`}
        data-testid="button-mode-development"
      >
        <Code2 className="h-4 w-4" />
        <span className="hidden sm:inline">Development</span>
      </button>
      <button
        onClick={() => onModeChange("hr")}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          mode === "hr"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover-elevate"
        }`}
        data-testid="button-mode-hr"
      >
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">HR Mode</span>
      </button>
    </div>
  );
}
