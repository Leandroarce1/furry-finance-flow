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
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card/80 backdrop-blur sticky top-0 z-20 flex items-center px-3 md:px-6 gap-3">
            {/* Trigger visível em tablet (md até lg); escondido em mobile (tem bottom-nav) e em desktop (menu fixo) */}
            <SidebarTrigger className="hidden md:flex lg:hidden h-10 w-10 rounded-lg hover:bg-accent items-center justify-center">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-xl font-display font-bold truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
            </div>
            {actions}
          </header>
          {/* pb-20 em mobile dá espaço para a bottom-nav fixa */}
          <main className="flex-1 p-3 md:p-6 pb-20 md:pb-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
