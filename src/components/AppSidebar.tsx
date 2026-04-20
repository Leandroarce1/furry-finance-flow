import { NavLink, useLocation } from "react-router-dom";
import {
  Home, PawPrint, Wallet, Settings as SettingsIcon, Sparkles,
  BookOpen, Target, Building2, Truck, GitCompare, FileText, ArrowLeftRight,
} from "lucide-react";
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

const groups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "Operacional",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Clientes & Pets", url: "/clientes", icon: PawPrint },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Lançamentos", url: "/financeiro", icon: Wallet },
      { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: ArrowLeftRight },
      { title: "DRE", url: "/dre", icon: FileText },
      { title: "Previsto x Realizado", url: "/previsto-realizado", icon: GitCompare },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Plano de Contas", url: "/plano-de-contas", icon: BookOpen },
      { title: "Bancos", url: "/bancos", icon: Building2 },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Metas", url: "/metas", icon: Target },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/configuracoes", icon: SettingsIcon },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [settings] = useSettings();

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate">{settings.nomePetshop}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gestão Completa</p>
          </div>
        </div>

        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
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
                          <span className="text-sm">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
