import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const GlassCard = ({
  children,
  className,
  hover = true,
  glow = false,
  ...props
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "glass-card",
        hover && "transition-all duration-500 hover:border-primary/50",
        glow && "pulse-glow",
        className
      )}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
