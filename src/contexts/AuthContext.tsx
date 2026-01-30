import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserType = "student" | "faculty" | "parent";
type FacultyRole = "administration" | "accounts" | "hod" | "teaching" | "non_teaching";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: UserType;
  avatar_url: string | null;
  phone: string | null;
  department_id: string | null;
  course_id: string | null;
  current_semester: number | null;
  batch_year: number | null;
  roll_number: string | null;
  employee_id: string | null;
  section: string | null;
  linked_student_id: string | null;
  is_active: boolean;
  is_first_login: boolean;
}

interface FacultyRoleData {
  id: string;
  role: FacultyRole;
  department_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  facultyRoles: FacultyRoleData[];
  activeRole: FacultyRole | null;
  setActiveRole: (role: FacultyRole) => void;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [facultyRoles, setFacultyRoles] = useState<FacultyRoleData[]>([]);
  const [activeRole, setActiveRole] = useState<FacultyRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const fetchFacultyRoles = async (userId: string): Promise<FacultyRoleData[]> => {
    try {
      const { data, error } = await supabase
        .from("faculty_roles")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching faculty roles:", error);
        return [];
      }

      return data as FacultyRoleData[];
    } catch (error) {
      console.error("Error fetching faculty roles:", error);
      return [];
    }
  };

  const loadUserData = async (userId: string) => {
    const profileData = await fetchProfile(userId);
    setProfile(profileData);

    if (profileData?.user_type === "faculty") {
      const roles = await fetchFacultyRoles(userId);
      setFacultyRoles(roles);

      // Set default active role if only one role
      if (roles.length === 1) {
        setActiveRole(roles[0].role);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setFacultyRoles([]);
      setActiveRole(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // CRITICAL: Set up auth state listener FIRST (synchronous only!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            if (isMounted) {
              loadUserData(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setFacultyRoles([]);
          setActiveRole(null);
        }
      }
    );

    // THEN check for existing session (INITIAL load)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile BEFORE setting loading false
        if (session?.user) {
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        facultyRoles,
        activeRole,
        setActiveRole,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
