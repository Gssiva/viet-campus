import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";
import { Logo } from "@/components/landing/Logo";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ParentAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    studentRollNumber: "",
    password: "",
  });

  // Redirect if already logged in as parent
  useEffect(() => {
    if (!authLoading && user && profile?.user_type === "parent") {
      navigate("/parent/dashboard", { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Construct email from student roll number for parent
      const email = `${formData.studentRollNumber.toLowerCase()}.parent@viet.edu.in`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login Failed",
            description: "Invalid credentials. Please check the Roll Number and Password.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome!",
          description: "Login successful. Redirecting to dashboard...",
        });
        setTimeout(() => {
          navigate("/parent/dashboard", { replace: true });
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <BackgroundEffects />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <Logo size="sm" />
            
            <motion.button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </motion.button>
          </nav>
        </div>
      </header>

      {/* Login form */}
      <main className="container mx-auto px-6 py-20">
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-8" hover={false}>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{
                  background: "linear-gradient(135deg, hsl(270, 91%, 60%, 0.3) 0%, hsl(270, 91%, 60%, 0.1) 100%)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <UserCheck className="w-8 h-8 text-purple-400" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-foreground mb-2">Parent / Guardian Login</h1>
              <p className="text-muted-foreground">
                Enter your ward's Roll Number to access their academic information
              </p>
            </div>

            {/* Info banner */}
            <motion.div
              className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm text-accent">
                <strong>Note:</strong> Parent accounts have read-only access to monitor your ward's academic progress, attendance, and fee status.
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="studentRollNumber" className="text-foreground">
                  Student Roll Number
                </Label>
                <Input
                  id="studentRollNumber"
                  type="text"
                  placeholder="e.g., 21A51A0501"
                  value={formData.studentRollNumber}
                  onChange={(e) => setFormData({ ...formData, studentRollNumber: e.target.value.toUpperCase() })}
                  className="bg-secondary/50 border-border/50 focus:border-primary input-glow"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-secondary/50 border-border/50 focus:border-primary input-glow pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <GradientButton
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                Sign In
              </GradientButton>
            </form>

            {/* Help text */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Don't have an account?{" "}
                <button 
                  className="text-primary hover:underline"
                  onClick={() => toast({ title: "Account Creation", description: "Parent accounts are automatically created and linked to student records. Please contact the administration office." })}
                >
                  Contact Administration
                </button>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
};

export default ParentAuth;
