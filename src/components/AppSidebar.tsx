import { NavLink, useLocation } from "react-router-dom";
import { Home, PawPrint, Wallet, Settings as SettingsIcon, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSettings } from "@/store/useStore";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Clientes & Pets", url: "/clientes", icon: PawPrint },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Configurações", url: "/configuracoes", icon: SettingsIcon },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [settings] = useSettings();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-bold text-sm leading-tight truncate">{settings.nomePetshop}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Banho & Tosa</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground font-medium shadow-elegant"
                              : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
