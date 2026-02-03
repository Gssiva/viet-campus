import { forwardRef } from "react";
import { motion } from "framer-motion";
import vietLogo from "@/assets/viet-logo.jfif";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", showText = true }, ref) => {
    const sizeClasses = {
      sm: "w-10 h-10",
      md: "w-14 h-14",
      lg: "w-20 h-20",
    };

    const textSizeClasses = {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-3xl",
    };

    return (
      <motion.div 
        ref={ref}
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center relative bg-white shadow-lg`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <img 
            src={vietLogo} 
            alt="VIET Logo" 
            className="w-full h-full object-contain p-1"
          />
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
  }
);

Logo.displayName = "Logo";
