import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  onClick: () => void;
}

export const RoleCard = ({
  title,
  description,
  icon: Icon,
  color,
  delay = 0,
  onClick,
}: RoleCardProps) => {
  return (
    <motion.div
      className="role-card group relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      onClick={onClick}
      whileHover={{ y: -12 }}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: `linear-gradient(135deg, ${color}20 0%, transparent 100%)`,
        }}
      />

      {/* Icon container */}
      <motion.div
        className={cn(
          "mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl",
          "transition-all duration-500 group-hover:scale-110"
        )}
        style={{
          background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
          boxShadow: `0 8px 32px ${color}20`,
        }}
      >
        <Icon 
          className="w-8 h-8 transition-all duration-500 group-hover:scale-110" 
          style={{ color }}
        />
      </motion.div>

      {/* Content */}
      <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Arrow indicator */}
      <motion.div 
        className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        <span className="text-sm font-medium">Continue</span>
        <svg 
          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>

      {/* Decorative corner */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full transition-opacity duration-500 group-hover:opacity-20"
        style={{ background: color }}
      />
    </motion.div>
  );
};
