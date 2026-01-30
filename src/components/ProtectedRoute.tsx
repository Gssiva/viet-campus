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

  // Show loading while auth is being determined
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

  // Not authenticated - redirect to home
  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to home");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User exists but profile not loaded yet - show loading
  // This handles the case where user is set but profile fetch is still in progress
  if (!profile) {
    console.log("ProtectedRoute: User exists but no profile, showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check user type
  if (allowedUserTypes && !allowedUserTypes.includes(profile.user_type)) {
    // Redirect to appropriate dashboard based on user type
    const redirectPath = getRedirectPath(profile.user_type);
    console.log("ProtectedRoute: Wrong user type, redirecting to", redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Check faculty role if required
  if (profile.user_type === "faculty" && requireRole && !activeRole) {
    console.log("ProtectedRoute: Faculty needs to select role");
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
