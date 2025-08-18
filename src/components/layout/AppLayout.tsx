import { ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Activity, BarChart3, Settings, Target, UserPlus, Users } from "lucide-react"

type AppLayoutProps = {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { pathname } = useLocation()

  const mainNavItems: Array<{
    label: string
    to: string
    icon: any
  }> = [
    { label: "Dashboard", to: "/", icon: BarChart3 },
    { label: "Rosa", to: "/squad", icon: Users },
    { label: "Provini", to: "/trials", icon: UserPlus },
    { label: "Allenamenti", to: "/training", icon: Activity },
    { label: "Partite", to: "/matches", icon: Target },
  ]

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/" || pathname === "/dashboard"
    if (to === "/matches") return pathname.startsWith("/matches") || pathname.startsWith("/match/")
    return pathname === to
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-3">
          <div className="flex items-center gap-3 px-1">
            <img src="/assets/IMG_0055.png" alt="Logo" className="h-9 w-9 rounded-md" />
            <div className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
              App
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs">Navigazione</SidebarGroupLabel>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)}>
                      <NavLink to={item.to} end={item.to === "/"}>
                        <Icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-2">
          <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden px-1">
            © {new Date().getFullYear()}
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-1">
            <NavLink to="/admin" title="Amministrazione">
              <Button variant="ghost" size="icon" className="btn-ghost-brand">
                <Settings className="h-5 w-5" />
              </Button>
            </NavLink>
          </div>
        </div>
        <div className="p-3 md:p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppLayout

