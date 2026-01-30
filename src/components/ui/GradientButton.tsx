import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
      primary: "gradient-button text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="relative z-10">{children}</span>
          </>
        )}
      </motion.button>
    );
  }
);

GradientButton.displayName = "GradientButton";
