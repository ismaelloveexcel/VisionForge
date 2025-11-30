import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ["/"], description: "Focus chat input" },
  { keys: ["Ctrl", "N"], description: "Clear chat / New conversation" },
  { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
  { keys: ["Ctrl", "Shift", "M"], description: "Toggle Development/HR mode" },
  { keys: ["Ctrl", "Shift", "H"], description: "Go to Home/Chat" },
  { keys: ["Ctrl", "Shift", "P"], description: "Go to Projects" },
  { keys: ["Ctrl", "Shift", "T"], description: "Go to Templates" },
  { keys: ["Ctrl", ","], description: "Go to Settings" },
  { keys: ["Shift", "?"], description: "Show this help" },
  { keys: ["Escape"], description: "Close dialogs / Clear focus" },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate AI-DAN faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {shortcuts.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
              <div className="flex items-center gap-1">
                {keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1">
                    <KeyBadge>{key}</KeyBadge>
                    {index < keys.length - 1 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Press <KeyBadge>Escape</KeyBadge> to close this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
