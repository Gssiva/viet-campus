import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  CreditCard,
  Users,
  TrendingUp,
  Award,
  Bell,
} from "lucide-react";
import { DashboardLayout, parentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface LinkedStudent {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  course_name: string;
  current_semester: number;
}

const ParentDashboard = () => {
  const { profile } = useAuth();
  const [student, setStudent] = useState<LinkedStudent | null>(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.linked_student_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch linked student info
      const { data: studentData } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          roll_number,
          current_semester,
          courses (name)
        `)
        .eq("id", profile!.linked_student_id)
        .single();

      if (studentData) {
        setStudent({
          id: studentData.id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          roll_number: studentData.roll_number || "",
          course_name: (studentData.courses as any)?.name || "",
          current_semester: studentData.current_semester || 0,
        });

        // Fetch attendance
        const { data: attendance } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", studentData.id);

        if (attendance && attendance.length > 0) {
          const present = attendance.filter((a) => a.status === "present").length;
          setAttendancePercentage(Math.round((present / attendance.length) * 100));
        }

        // Fetch recent results
        const { data: results } = await supabase
          .from("exam_results")
          .select(`
            id,
            marks_obtained,
            max_marks,
            grade,
            exam_type,
            subjects (name, code)
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentResults(results || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile?.linked_student_id) {
    return (
      <DashboardLayout
        navItems={parentNavItems}
        title="Parent Dashboard"
        subtitle="Monitor your ward's academic progress"
      >
        <GlassCard className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No Linked Student</p>
          <p className="text-muted-foreground">
            Your account is not linked to any student. Please contact the
            administration.
          </p>
        </GlassCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navItems={parentNavItems}
      title={`${student?.first_name}'s Dashboard`}
      subtitle={`Monitoring ${student?.roll_number} • Semester ${student?.current_semester}`}
    >
      {/* Student Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {student?.first_name} {student?.last_name}
              </h2>
              <p className="text-muted-foreground">
                {student?.roll_number} • {student?.course_name}
              </p>
              <Badge className="mt-2">Semester {student?.current_semester}</Badge>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  attendancePercentage >= 75 ? "bg-green-500/10" : "bg-destructive/10"
                }`}
              >
                <Calendar
                  className={`w-5 h-5 ${
                    attendancePercentage >= 75 ? "text-green-500" : "text-destructive"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-xl font-bold ${
                    attendancePercentage >= 75 ? "text-green-500" : "text-destructive"
                  }`}
                >
                  {attendancePercentage}%
                </p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">8.5</p>
                <p className="text-xs text-muted-foreground">CGPA</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  pendingFees > 0 ? "bg-destructive/10" : "bg-green-500/10"
                }`}
              >
                <CreditCard
                  className={`w-5 h-5 ${
                    pendingFees > 0 ? "text-destructive" : "text-green-500"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-xl font-bold ${
                    pendingFees > 0 ? "text-destructive" : "text-green-500"
                  }`}
                >
                  {pendingFees > 0 ? `₹${pendingFees.toLocaleString()}` : "Paid"}
                </p>
                <p className="text-xs text-muted-foreground">Fee Status</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Attendance Warning */}
      {attendancePercentage < 75 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Low Attendance Alert
                </p>
                <p className="text-sm text-muted-foreground">
                  Your ward's attendance is below 75%. This may affect exam
                  eligibility.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Recent Results
            </h2>

            {recentResults.length === 0 ? (
              <p className="text-muted-foreground text-sm">No results available</p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((result: any) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{result.subjects?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {result.exam_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {result.marks_obtained}/{result.max_marks}
                      </p>
                      <Badge variant="secondary">{result.grade}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Attendance Overview
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Attendance</span>
                  <span
                    className={`font-medium ${
                      attendancePercentage >= 75 ? "text-green-500" : "text-destructive"
                    }`}
                  >
                    {attendancePercentage}%
                  </span>
                </div>
                <Progress value={attendancePercentage} className="h-3" />
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Minimum Required: 75%
                </p>
                <p className="text-sm">
                  {attendancePercentage >= 75 ? (
                    <span className="text-green-500">
                      ✓ Eligible for exams
                    </span>
                  ) : (
                    <span className="text-destructive">
                      ✗ At risk - needs improvement
                    </span>
                  )}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
