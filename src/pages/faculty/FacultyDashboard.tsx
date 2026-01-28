import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ClipboardCheck,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  BookOpen,
} from "lucide-react";
import {
  DashboardLayout,
  teachingNavItems,
  hodNavItems,
  adminNavItems,
  accountsNavItems,
} from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const FacultyDashboard = () => {
  const { profile, activeRole } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingEvaluations: 0,
    classesToday: 0,
    attendanceMarked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile, activeRole]);

  const fetchStats = async () => {
    try {
      // Fetch based on role
      if (activeRole === "teaching") {
        // Get subjects assigned to this faculty
        const { data: facultySubjects } = await supabase
          .from("faculty_subjects")
          .select("subject_id")
          .eq("faculty_id", profile!.id)
          .eq("is_active", true);

        const subjectIds = facultySubjects?.map((s) => s.subject_id) || [];

        // Get assignments needing evaluation
        const { data: assignments } = await supabase
          .from("assignments")
          .select("id")
          .eq("faculty_id", profile!.id);

        const assignmentIds = assignments?.map((a) => a.id) || [];

        const { data: submissions } = await supabase
          .from("submissions")
          .select(`
            id,
            evaluations (id, is_faculty_approved)
          `)
          .in("assignment_id", assignmentIds);

        const pendingEvals = submissions?.filter(
          (s: any) => !s.evaluations || !s.evaluations.is_faculty_approved
        ).length || 0;

        setStats({
          totalStudents: 0, // Would need to join with students
          pendingEvaluations: pendingEvals,
          classesToday: subjectIds.length,
          attendanceMarked: 0,
        });
      } else if (activeRole === "hod" || activeRole === "administration") {
        // Get department/institution stats
        const { count: studentCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("user_type", "student")
          .eq("is_active", true);

        const { count: facultyCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("user_type", "faculty")
          .eq("is_active", true);

        setStats({
          totalStudents: studentCount || 0,
          pendingEvaluations: facultyCount || 0,
          classesToday: 0,
          attendanceMarked: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNavItems = () => {
    switch (activeRole) {
      case "hod":
        return hodNavItems;
      case "administration":
        return adminNavItems;
      case "accounts":
        return accountsNavItems;
      default:
        return teachingNavItems;
    }
  };

  const getRoleTitle = () => {
    switch (activeRole) {
      case "hod":
        return "Head of Department";
      case "administration":
        return "Administration";
      case "accounts":
        return "Accounts";
      case "non_teaching":
        return "Staff";
      default:
        return "Faculty";
    }
  };

  const getStatsCards = () => {
    if (activeRole === "accounts") {
      return [
        {
          label: "Fee Collections",
          value: "₹2.5L",
          icon: TrendingUp,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          label: "Pending Dues",
          value: "₹45K",
          icon: FileText,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        },
        {
          label: "Transport Enrollments",
          value: "120",
          icon: Users,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          label: "Transactions Today",
          value: "8",
          icon: ClipboardCheck,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
      ];
    }

    if (activeRole === "hod" || activeRole === "administration") {
      return [
        {
          label: "Total Students",
          value: stats.totalStudents,
          icon: Users,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          label: "Total Faculty",
          value: stats.pendingEvaluations,
          icon: BookOpen,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          label: "Departments",
          value: "5",
          icon: ClipboardCheck,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        },
        {
          label: "Courses",
          value: "5",
          icon: Award,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
      ];
    }

    return [
      {
        label: "My Subjects",
        value: stats.classesToday,
        icon: BookOpen,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        label: "Pending Evaluations",
        value: stats.pendingEvaluations,
        icon: FileText,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      },
      {
        label: "Classes Today",
        value: stats.classesToday,
        icon: Calendar,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      },
      {
        label: "Attendance Marked",
        value: `${stats.attendanceMarked}%`,
        icon: ClipboardCheck,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      },
    ];
  };

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title={`${getRoleTitle()} Dashboard`}
      subtitle={`Welcome back, ${profile?.first_name}!`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {getStatsCards().map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-4 lg:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className={`text-xl lg:text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 lg:p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${stat.color}`} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {activeRole === "teaching" && (
                <>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <ClipboardCheck className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Mark Attendance</p>
                  </GlassCard>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Create Assignment</p>
                  </GlassCard>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Evaluate Submissions</p>
                  </GlassCard>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Upload Materials</p>
                  </GlassCard>
                </>
              )}
              {(activeRole === "hod" || activeRole === "administration") && (
                <>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Manage Faculty</p>
                  </GlassCard>
                  <GlassCard
                    className="p-4 cursor-pointer text-center"
                    hover
                  >
                    <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">View Analytics</p>
                  </GlassCard>
                </>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ClipboardCheck className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Attendance marked for CSE-A</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New assignment created</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">5 submissions evaluated</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
