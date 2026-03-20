import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  CreditCard,
  ClipboardCheck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  GraduationCap,
  Building2,
  BarChart3,
  Upload,
  Award,
  Bus,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
}

export const DashboardLayout = ({
  children,
  navItems,
  title,
  subtitle,
}: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, activeRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    if (!profile) return "U";
    return `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col",
          "border-r border-border/40 backdrop-blur-glass bg-card/80",
          "transform lg:transform-none transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {activeRole?.replace("_", " ") || profile?.user_type}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/70 backdrop-blur-glass border-b border-border/40 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// Export navigation configs for different user types
export const studentNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/student/dashboard" },
  { label: "Attendance", icon: Calendar, path: "/student/attendance" },
  { label: "Assignments", icon: FileText, path: "/student/assignments" },
  { label: "Results", icon: Award, path: "/student/results" },
  { label: "Study Materials", icon: BookOpen, path: "/student/materials" },
  { label: "Fees", icon: CreditCard, path: "/student/fees" },
  { label: "Transport", icon: Bus, path: "/student/transport" },
];

export const teachingNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/faculty/dashboard" },
  { label: "Attendance", icon: ClipboardCheck, path: "/faculty/attendance" },
  { label: "Assignments", icon: FileText, path: "/faculty/assignments" },
  { label: "Evaluations", icon: Award, path: "/faculty/evaluations" },
  { label: "Study Materials", icon: Upload, path: "/faculty/materials" },
  { label: "My Students", icon: Users, path: "/faculty/students" },
  { label: "Notifications", icon: Bell, path: "/faculty/notifications" },
];

export const hodNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/faculty/dashboard" },
  { label: "Department", icon: Building2, path: "/faculty/department" },
  { label: "Faculty", icon: Users, path: "/faculty/manage-faculty" },
  { label: "Students", icon: GraduationCap, path: "/faculty/manage-students" },
  { label: "Timetable", icon: Calendar, path: "/faculty/timetable" },
  { label: "Analytics", icon: BarChart3, path: "/faculty/analytics" },
  { label: "Announcements", icon: Megaphone, path: "/faculty/announcements" },
  { label: "Notifications", icon: Bell, path: "/faculty/notifications" },
];

export const adminNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/faculty/dashboard" },
  { label: "Departments", icon: Building2, path: "/faculty/departments" },
  { label: "Courses", icon: BookOpen, path: "/faculty/courses" },
  { label: "Faculty", icon: Users, path: "/faculty/manage-faculty" },
  { label: "Students", icon: GraduationCap, path: "/faculty/manage-students" },
  { label: "Timetable", icon: Calendar, path: "/faculty/timetable" },
  { label: "Analytics", icon: BarChart3, path: "/faculty/analytics" },
  { label: "Announcements", icon: Megaphone, path: "/faculty/announcements" },
  { label: "Notifications", icon: Bell, path: "/faculty/notifications" },
];

export const accountsNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/faculty/dashboard" },
  { label: "Fee Structure", icon: CreditCard, path: "/faculty/fee-structure" },
  { label: "Payments", icon: CreditCard, path: "/faculty/payments" },
  { label: "Transport", icon: Bus, path: "/faculty/transport" },
  { label: "Reports", icon: BarChart3, path: "/faculty/fee-reports" },
  { label: "Notifications", icon: Bell, path: "/faculty/notifications" },
];

export const parentNavItems: NavItem[] = [
  { label: "Dashboard", icon: Home, path: "/parent/dashboard" },
  { label: "Attendance", icon: Calendar, path: "/parent/attendance" },
  { label: "Results", icon: Award, path: "/parent/results" },
  { label: "Fees", icon: CreditCard, path: "/parent/fees" },
  { label: "Announcements", icon: Megaphone, path: "/parent/announcements" },
];
