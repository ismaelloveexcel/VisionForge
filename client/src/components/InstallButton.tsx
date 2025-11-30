import { Download, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/use-pwa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA();

  if (isInstalled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-emerald-500"
            data-testid="button-installed"
          >
            <Check className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>App installed</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={installApp}
          className="gap-1.5"
          data-testid="button-install-app"
        >
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Install App</span>
          <Download className="h-3 w-3 sm:hidden" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Install AI-DAN on your device</p>
      </TooltipContent>
    </Tooltip>
  );
}
