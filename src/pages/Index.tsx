import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users, UserCheck } from "lucide-react";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";
import { RoleCard } from "@/components/landing/RoleCard";
import { Logo } from "@/components/landing/Logo";

const Index = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Faculty",
      description: "Access your dashboard to manage attendance, assignments, and student evaluations with AI-powered tools.",
      icon: Users,
      color: "#3b82f6",
      path: "/auth/faculty",
    },
    {
      title: "Students",
      description: "View your academic progress, attendance, assignments, and exam results all in one place.",
      icon: GraduationCap,
      color: "#22d3ee",
      path: "/auth/student",
    },
    {
      title: "Parents / Others",
      description: "Monitor your ward's academic journey with transparent access to attendance and performance data.",
      icon: UserCheck,
      color: "#a855f7",
      path: "/auth/parent",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="glass-card px-6 py-3 flex items-center justify-between">
            <Logo size="sm" />
            
            <motion.a
              href="https://www.viet.edu.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              Visit Official Website →
            </motion.a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 pt-32 pb-20">
        {/* Hero section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Visakha Institute of Engineering and Technology
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">Welcome to </span>
            <span className="gradient-text">VIET</span>
            <br />
            <span className="text-foreground">Digital Campus</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A unified platform for seamless academic management, intelligent evaluations, 
            and transparent communication between faculty, students, and parents.
          </p>
        </motion.div>

        {/* Role selection */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.h2
            className="text-center text-2xl font-semibold text-muted-foreground mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Select your role to continue
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roles.map((role, index) => (
              <RoleCard
                key={role.title}
                {...role}
                delay={0.6 + index * 0.1}
                onClick={() => navigate(role.path)}
              />
            ))}
          </div>
        </motion.div>

        {/* Features preview */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {[
              "AI-Powered Evaluation",
              "Real-time Attendance",
              "Fee Management",
              "Exam Analytics",
              "Study Materials",
            ].map((feature, index) => (
              <motion.div
                key={feature}
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2026 Visakha Institute of Engineering and Technology. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
