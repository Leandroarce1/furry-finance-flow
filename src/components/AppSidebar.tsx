import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, PawPrint, Wallet, Settings as SettingsIcon,
  BookOpen, Target, Building2, GitCompare, FileText, ArrowLeftRight,
  ArrowDownCircle, ArrowUpCircle, ListOrdered, CalendarDays, BarChart3,
  ChevronDown, DollarSign, Users, FolderCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSettings } from "@/store/useStore";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  matchPaths?: string[]; // paths considered active for this parent when no exact submatch
  children?: { title: string; url: string; icon: any }[];
};

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    matchPaths: ["/financeiro", "/previsto-realizado", "/dre", "/fluxo-caixa"],
    children: [
      { title: "Nova Entrada", url: "/financeiro?novaEntrada=1", icon: ArrowUpCircle },
      { title: "Nova Saída", url: "/financeiro?novaSaida=1", icon: ArrowDownCircle },
      { title: "Lançamentos", url: "/financeiro", icon: ListOrdered },
      { title: "Previsto vs Realizado", url: "/previsto-realizado", icon: GitCompare },
      { title: "Resultado do Mês", url: "/dre", icon: FileText },
      { title: "Fluxo Diário", url: "/fluxo-caixa?view=diario", icon: CalendarDays },
      { title: "Fluxo Mensal", url: "/fluxo-caixa?view=mensal", icon: BarChart3 },
    ],
  },
  { title: "Clientes", url: "/clientes", icon: Users },
  {
    title: "Cadastros",
    url: "#cadastros",
    icon: FolderCog,
    matchPaths: ["/plano-de-contas", "/metas", "/bancos", "/configuracoes"],
    children: [
      { title: "Plano de Contas", url: "/plano-de-contas", icon: BookOpen },
      { title: "Serviços / Metas", url: "/metas", icon: Target },
      { title: "Contas Bancárias", url: "/bancos", icon: Building2 },
      { title: "Configurações", url: "/configuracoes", icon: SettingsIcon },
    ],
  },
];

// Itens fixos para a bottom-nav mobile (máx. 4)
const bottomNavItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Clientes", url: "/clientes", icon: PawPrint },
  { title: "Cadastros", url: "/plano-de-contas", icon: FolderCog },
];

function isPathActive(pathname: string, url: string) {
  const base = url.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base;
}

export function AppSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [settings] = useSettings();

  // Mantém abertos os grupos cujo caminho ativo pertence a eles
  const initialOpen: Record<string, boolean> = {};
  navItems.forEach((i) => {
    if (i.children && i.matchPaths?.some((p) => pathname.startsWith(p))) {
      initialOpen[i.title] = true;
    }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);
  const toggleGroup = (t: string) => setOpenGroups((s) => ({ ...s, [t]: !s[t] }));

  const renderParent = (item: NavItem) => {
    const isGroupActive = item.matchPaths?.some((p) => pathname.startsWith(p)) ?? false;
    const isLeafActive = !item.children && isPathActive(pathname, item.url);
    const active = isLeafActive;
    const open = openGroups[item.title] ?? isGroupActive;

    if (item.children) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            onClick={() => toggleGroup(item.title)}
            className={cn(
              "flex items-center gap-3 rounded-lg transition-all w-full h-10 px-3",
              isGroupActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm flex-1 text-left">{item.title}</span>
            <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", open && "rotate-180")} />
          </SidebarMenuButton>
          {open && (
            <SidebarMenu className="mt-1 ml-2 border-l border-sidebar-border pl-2 gap-0.5">
              {item.children.map((c) => {
                const childBase = c.url.split("?")[0];
                const childQuery = c.url.includes("?") ? c.url.split("?")[1] : "";
                const childActive =
                  pathname === childBase &&
                  (childQuery ? location.search.includes(childQuery) : !location.search.includes("nova"));
                return (
                  <SidebarMenuItem key={c.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={c.url}
                        className={cn(
                          "flex items-center gap-2 rounded-md transition-all h-9 pl-4 pr-3 text-sm",
                          childActive
                            ? "bg-primary text-primary-foreground font-medium shadow-elegant"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <c.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={active}>
          <NavLink
            to={item.url}
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg transition-all h-10 px-3",
                isActive
                  ? "bg-primary text-primary-foreground font-medium shadow-elegant"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm">{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {/* Sidebar para tablet/desktop */}
      <Sidebar collapsible="offcanvas" className="border-r hidden md:flex [&>div]:!w-[220px]">
        <SidebarContent className="bg-sidebar">
          <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-elegant shrink-0">
              <PawPrint className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-sm leading-tight truncate">
                {settings.nomePetshop || "Pet & Cia"}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gestão Completa</p>
            </div>
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2 py-2">
                {navItems.map(renderParent)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Bottom navigation para mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border shadow-[0_-4px_12px_-4px_hsl(262_30%_30%/0.08)]">
        <div className="grid grid-cols-4">
          {bottomNavItems.map((item) => {
            const active =
              item.url === "/"
                ? pathname === "/"
                : item.title === "Cadastros"
                  ? ["/plano-de-contas", "/bancos", "/metas", "/configuracoes"].some((p) => pathname.startsWith(p))
                  : pathname.startsWith(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 min-h-[60px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                <span className={cn("text-[10px] leading-none", active && "font-semibold")}>{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
