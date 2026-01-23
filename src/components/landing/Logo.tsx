import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center relative`}
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 4px 20px hsl(217, 91%, 60%, 0.3)",
        }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <GraduationCap className="w-1/2 h-1/2 text-primary-foreground" />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.div>
      </motion.div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold gradient-text`}>
            VIET
          </span>
          <span className="text-xs text-muted-foreground tracking-wider uppercase">
            Digital Campus
          </span>
        </div>
      )}
    </motion.div>
  );
};
