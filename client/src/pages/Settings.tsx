import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { IntegrationBadge } from "@/components/IntegrationBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExternalLink, RefreshCw } from "lucide-react";

export default function Settings() {
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [showCodePreview, setShowCodePreview] = useState(true);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Configure AI-DAN and manage your integrations
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Customize the look and feel of AI-DAN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Code Preview</Label>
                <p className="text-sm text-muted-foreground">
                  Display code preview panel in Development mode
                </p>
              </div>
              <Switch
                checked={showCodePreview}
                onCheckedChange={setShowCodePreview}
                data-testid="switch-code-preview"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior</CardTitle>
            <CardDescription>Configure how AI-DAN works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-save Conversations</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save chat history
                </p>
              </div>
              <Switch
                checked={autoSave}
                onCheckedChange={setAutoSave}
                data-testid="switch-auto-save"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when AI-DAN completes a task
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Integrations</CardTitle>
            <CardDescription>Manage your connected services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <IntegrationBadge name="github" status="connected" />
              <IntegrationBadge name="discord" status="connected" />
              <IntegrationBadge name="notion" status="connected" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-accent/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">GitHub</span>
                  <span className="text-xs text-muted-foreground">Connected as @username</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-accent/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">Discord</span>
                  <span className="text-xs text-muted-foreground">Connected to 3 servers</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-accent/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">Notion</span>
                  <span className="text-xs text-muted-foreground">Connected to workspace</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="gap-1">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Project Settings</CardTitle>
            <CardDescription>Configure defaults for new projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="github-org">GitHub Organization</Label>
              <Input
                id="github-org"
                placeholder="your-organization"
                data-testid="input-github-org"
              />
              <p className="text-xs text-muted-foreground">
                New repositories will be created under this organization
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notion-page">Notion Parent Page</Label>
              <Input
                id="notion-page"
                placeholder="Projects"
                data-testid="input-notion-page"
              />
              <p className="text-xs text-muted-foreground">
                Documentation will be created under this page
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
