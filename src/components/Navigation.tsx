
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  UserPlus, 
  Trophy, 
  Activity, 
  BarChart3, 
  Menu, 
  X,
  Shield,
  LogOut,
  ChevronDown,
  Settings,
  Layout,
  Image,
  Shirt,
  UserCog,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const navigationItems = [
    { name: "Dashboard", path: "/", icon: BarChart3 },
    { name: "Provini", path: "/trials", icon: UserPlus },
    { name: "Allenamenti", path: "/training", icon: Activity },
    { name: "Partite", path: "/matches", icon: Target },
  ];

  const adminItems = [
    { name: "Dashboard", path: "/admin", icon: Shield },
    { name: "Utenti", path: "/admin/users", icon: Users },
    { name: "Formazioni", path: "/admin/formations", icon: Layout },
    { name: "Maglie", path: "/admin/jerseys", icon: Shirt },
    { name: "Gestione Avatar", path: "/admin/avatar-backgrounds", icon: Image },
    { name: "Impostazioni PNG", path: "/admin/png-settings", icon: Settings },
    { name: "Avversari", path: "/admin/opponents", icon: Users },
    { name: "Opzioni Giocatori", path: "/field-options", icon: UserCog },
  ];

  const squadItems = [
    { name: "Rosa", path: "/squad", icon: Users },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const isMatchesActive = pathname.startsWith('/matches') || pathname.startsWith('/match/');

  return (
    <nav className="bg-card border-b border-border shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <NavLink to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src="/assets/logo_elevenBase.png" 
                alt="Ca De Rissi SG Esport" 
                className="h-10 w-10 rounded-lg group-hover:shadow-accent-glow transition-smooth"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 rounded-lg transition-smooth" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
                ElevenBase
              </h1>
              <p className="text-xs text-muted-foreground">E-Sport Management</p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden nav:flex items-center space-x-1">
            {/* Dashboard first */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-xl transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </NavLink>
            
            {/* Squad - direct link (no dropdown) */}
            <NavLink
              to="/squad"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-xl transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Rosa</span>
            </NavLink>

            {/* Rest of navigation items */}
            {navigationItems.slice(1).map((item) => {
              const Icon = item.icon;
              if (item.path === '/matches') {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={
                      `flex items-center space-x-2 px-4 py-2 rounded-xl transition-smooth ${
                        isMatchesActive
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </NavLink>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-xl transition-smooth ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-smooth text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Admin</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <NavLink
                        to={item.path}
                        className="flex items-center space-x-2 w-full"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <div className="hidden nav:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              onClick={handleSignOut}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold shadow-glow">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground hidden xl:block">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="nav:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="nav:hidden py-4 border-t border-border animate-slide-in">
            <div className="space-y-2">
              {/* Dashboard first */}
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </NavLink>
              
              {/* Squad items - second position */}
              {squadItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}
              
              {/* Rest of navigation items */}
              {navigationItems.slice(1).map((item) => {
                const Icon = item.icon;
                if (item.path === '/matches') {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={
                        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth ${
                          isMatchesActive
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  );
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}

              {/* Admin items */}
              <div className="pt-2 border-t border-border mt-2">
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amministrazione
                </div>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-smooth ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`
                      }
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold shadow-glow">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-muted-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
