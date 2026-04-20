import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, actions, children }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card/80 backdrop-blur sticky top-0 z-20 flex items-center px-3 md:px-6 gap-3">
            <SidebarTrigger className="h-10 w-10 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center md:bg-transparent md:hover:bg-accent md:text-foreground">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-xl font-display font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            {actions}
          </header>
          <main className="flex-1 p-3 md:p-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
