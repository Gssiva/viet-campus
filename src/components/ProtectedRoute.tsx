import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type UserType = "student" | "faculty" | "parent";
type FacultyRole = "administration" | "accounts" | "hod" | "teaching" | "non_teaching";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: UserType[];
  allowedRoles?: FacultyRole[];
  requireRole?: boolean;
}

export const ProtectedRoute = ({
  children,
  allowedUserTypes,
  allowedRoles,
  requireRole = false,
}: ProtectedRouteProps) => {
  const { user, profile, facultyRoles, activeRole, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !profile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check user type
  if (allowedUserTypes && !allowedUserTypes.includes(profile.user_type)) {
    // Redirect to appropriate dashboard based on user type
    const redirectPath = getRedirectPath(profile.user_type);
    return <Navigate to={redirectPath} replace />;
  }

  // Check faculty role if required
  if (profile.user_type === "faculty" && requireRole && !activeRole) {
    return <Navigate to="/faculty/select-role" replace />;
  }

  // Check specific role access
  if (allowedRoles && profile.user_type === "faculty") {
    const hasAllowedRole = facultyRoles.some((r) =>
      allowedRoles.includes(r.role)
    );
    if (!hasAllowedRole) {
      return <Navigate to="/faculty/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

function getRedirectPath(userType: UserType): string {
  switch (userType) {
    case "student":
      return "/student/dashboard";
    case "faculty":
      return "/faculty/select-role";
    case "parent":
      return "/parent/dashboard";
    default:
      return "/";
  }
}
