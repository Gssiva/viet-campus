import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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

  const fetchProfile = async (userId: string) => {
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

  const fetchFacultyRoles = async (userId: string) => {
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

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      
      if (profileData?.user_type === "faculty") {
        const roles = await fetchFacultyRoles(user.id);
        setFacultyRoles(roles);
      }
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
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        
        if (profileData?.user_type === "faculty") {
          const roles = await fetchFacultyRoles(session.user.id);
          setFacultyRoles(roles);
          
          // Set default active role if only one role
          if (roles.length === 1) {
            setActiveRole(roles[0].role);
          }
        }
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
          
          if (profileData?.user_type === "faculty") {
            const roles = await fetchFacultyRoles(session.user.id);
            setFacultyRoles(roles);
            
            if (roles.length === 1) {
              setActiveRole(roles[0].role);
            }
          }
        } else {
          setProfile(null);
          setFacultyRoles([]);
          setActiveRole(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
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
