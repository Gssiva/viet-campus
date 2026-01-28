import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  GraduationCap,
  Building2,
  Calculator,
  Wrench,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";
import { Logo } from "@/components/landing/Logo";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";

type FacultyRole = "administration" | "accounts" | "hod" | "teaching" | "non_teaching";

interface RoleOption {
  role: FacultyRole;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    role: "administration",
    title: "Administration",
    description: "Manage institution-wide settings, users, and policies",
    icon: Shield,
    color: "#ef4444",
  },
  {
    role: "hod",
    title: "Head of Department",
    description: "Manage department faculty, courses, and analytics",
    icon: Building2,
    color: "#8b5cf6",
  },
  {
    role: "teaching",
    title: "Teaching Faculty",
    description: "Manage classes, attendance, assignments, and evaluations",
    icon: GraduationCap,
    color: "#3b82f6",
  },
  {
    role: "accounts",
    title: "Accounts",
    description: "Manage fee structures, payments, and financial reports",
    icon: Calculator,
    color: "#10b981",
  },
  {
    role: "non_teaching",
    title: "Non-Teaching Staff",
    description: "Support operations and administrative tasks",
    icon: Wrench,
    color: "#f59e0b",
  },
];

const FacultySelectRole = () => {
  const navigate = useNavigate();
  const { profile, facultyRoles, setActiveRole, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<FacultyRole | null>(null);

  useEffect(() => {
    // If user only has one role, auto-select and redirect
    if (facultyRoles.length === 1) {
      setActiveRole(facultyRoles[0].role);
      navigate("/faculty/dashboard");
    }
  }, [facultyRoles]);

  const handleRoleSelect = (role: FacultyRole) => {
    setSelectedRole(role);
    setActiveRole(role);
    navigate("/faculty/dashboard");
  };

  const availableRoles = roleOptions.filter((option) =>
    facultyRoles.some((r) => r.role === option.role)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <BackgroundEffects />

      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="sm" />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome, {profile?.first_name}!
            </h1>
            <p className="text-muted-foreground">
              Select the role you'd like to access
            </p>
          </div>

          <div className="grid gap-4">
            {availableRoles.map((option, index) => (
              <motion.div
                key={option.role}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className="p-6 cursor-pointer"
                  onClick={() => handleRoleSelect(option.role)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${option.color}20` }}
                    >
                      <option.icon
                        className="w-6 h-6"
                        style={{ color: option.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {availableRoles.length === 0 && (
            <GlassCard className="p-8 text-center">
              <p className="text-muted-foreground">
                No roles assigned. Please contact the administration.
              </p>
            </GlassCard>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FacultySelectRole;
