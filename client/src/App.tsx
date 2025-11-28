import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import Home from "@/pages/Home";
import Projects from "@/pages/Projects";
import Templates from "@/pages/Templates";
import Calculators from "@/pages/Calculators";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router({ mode }: { mode: "development" | "hr" }) {
  return (
    <Switch>
      <Route path="/">
        <Home mode={mode} />
      </Route>
      <Route path="/projects" component={Projects} />
      <Route path="/templates" component={Templates} />
      <Route path="/calculators" component={Calculators} />
      <Route path="/documents" component={Templates} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [mode, setMode] = useState<"development" | "hr">("development");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar mode={mode} />
            <div className="flex flex-1 flex-col min-w-0">
              <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ModeSwitcher mode={mode} onModeChange={setMode} />
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-hidden">
                <Router mode={mode} />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
