import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  MessageSquare,
  FolderKanban,
  LayoutTemplate,
  Settings,
  History,
  Calculator,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import aiDanAvatar from "@assets/generated_images/ai-dan_nerdy_mascot_avatar.png";
import { IntegrationBadge } from "./IntegrationBadge";

interface AppSidebarProps {
  mode: "development" | "hr";
}

const devNavItems = [
  { icon: MessageSquare, label: "Chat", path: "/" },
  { icon: FolderKanban, label: "Projects", path: "/projects" },
  { icon: LayoutTemplate, label: "Templates", path: "/templates" },
  { icon: History, label: "History", path: "/history" },
];

const hrNavItems = [
  { icon: MessageSquare, label: "Chat", path: "/" },
  { icon: Calculator, label: "Calculators", path: "/calculators" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { icon: History, label: "History", path: "/history" },
];

export function AppSidebar({ mode }: AppSidebarProps) {
  const [location] = useLocation();
  const [integrationsOpen, setIntegrationsOpen] = useState(true);
  const navItems = mode === "development" ? devNavItems : hrNavItems;

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={aiDanAvatar} alt="AI-DAN" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              DAN
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">AI-DAN</span>
            <span className="text-xs text-muted-foreground">
              {mode === "development" ? "Dev Mode" : "HR Mode"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ icon: Icon, label, path }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === path}
                  >
                    <Link href={path} data-testid={`nav-${label.toLowerCase()}`}>
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {mode === "development" && (
          <Collapsible
            open={integrationsOpen}
            onOpenChange={setIntegrationsOpen}
          >
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer flex items-center justify-between w-full">
                  <span>Integrations</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      integrationsOpen ? "rotate-180" : ""
                    }`}
                  />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="px-2 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <IntegrationBadge name="github" status="connected" />
                    <IntegrationBadge name="discord" status="connected" />
                    <IntegrationBadge name="notion" status="connected" />
                  </div>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings" data-testid="nav-settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
