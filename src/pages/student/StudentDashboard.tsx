import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AttendanceStats {
  total: number;
  present: number;
  percentage: number;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  status: "pending" | "submitted" | "evaluated";
}

interface FeeStatus {
  total_due: number;
  total_paid: number;
  pending: number;
}

const StudentDashboard = () => {
  const { profile } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    percentage: 0,
  });
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [feeStatus, setFeeStatus] = useState<FeeStatus>({
    total_due: 0,
    total_paid: 0,
    pending: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance stats
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", profile!.id);

      if (attendanceData) {
        const total = attendanceData.length;
        const present = attendanceData.filter(
          (a) => a.status === "present"
        ).length;
        setAttendanceStats({
          total,
          present,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        });
      }

      // Fetch pending assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          subjects (name)
        `)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      if (assignmentsData) {
        // Check which ones are submitted
        const { data: submissions } = await supabase
          .from("submissions")
          .select("assignment_id, status")
          .eq("student_id", profile!.id);

        const submissionMap = new Map(
          submissions?.map((s) => [s.assignment_id, s.status]) || []
        );

        setPendingAssignments(
          assignmentsData.map((a: any) => ({
            id: a.id,
            title: a.title,
            subject: a.subjects?.name || "Unknown",
            due_date: a.due_date,
            status: submissionMap.has(a.id)
              ? submissionMap.get(a.id) === "evaluated"
                ? "evaluated"
                : "submitted"
              : "pending",
          }))
        );
      }

      // Fetch fee status
      if (profile!.course_id) {
        const { data: feeStructures } = await supabase
          .from("fee_structures")
          .select("id, amount")
          .eq("course_id", profile!.course_id)
          .eq("academic_year", "2025-26");

        const { data: payments } = await supabase
          .from("fee_payments")
          .select("amount_paid")
          .eq("student_id", profile!.id)
          .eq("status", "completed");

        const totalDue = feeStructures?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
        const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

        setFeeStatus({
          total_due: totalDue,
          total_paid: totalPaid,
          pending: totalDue - totalPaid,
        });
      }

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      setAnnouncements(announcementsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      label: "Attendance",
      value: `${attendanceStats.percentage}%`,
      icon: Calendar,
      color: attendanceStats.percentage >= 75 ? "text-green-500" : "text-destructive",
      bgColor: attendanceStats.percentage >= 75 ? "bg-green-500/10" : "bg-destructive/10",
    },
    {
      label: "Pending Tasks",
      value: pendingAssignments.filter((a) => a.status === "pending").length,
      icon: FileText,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Fee Due",
      value: `₹${feeStatus.pending.toLocaleString()}`,
      icon: CreditCard,
      color: feeStatus.pending > 0 ? "text-destructive" : "text-green-500",
      bgColor: feeStatus.pending > 0 ? "bg-destructive/10" : "bg-green-500/10",
    },
    {
      label: "Current Semester",
      value: profile?.current_semester || "-",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title={`Welcome, ${profile?.first_name || "Student"}`}
      subtitle={`Roll No: ${profile?.roll_number || "N/A"} • Semester ${profile?.current_semester || "-"}`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
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

      {/* Attendance Warning */}
      {attendanceStats.percentage < 75 && attendanceStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <GlassCard className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Low Attendance Warning
                </p>
                <p className="text-sm text-muted-foreground">
                  Your attendance is below 75%. You may face exam eligibility
                  issues. Contact your class teacher.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Upcoming Assignments
            </h2>

            {pendingAssignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No upcoming assignments
              </p>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          assignment.status === "pending"
                            ? "destructive"
                            : assignment.status === "submitted"
                            ? "secondary"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {assignment.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(assignment.due_date), "MMM d")}
                      </div>
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
          transition={{ delay: 0.5 }}
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
                  <span className="font-medium">{attendanceStats.percentage}%</span>
                </div>
                <Progress
                  value={attendanceStats.percentage}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {attendanceStats.present}
                  </p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {attendanceStats.total - attendanceStats.present}
                  </p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{attendanceStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Fee Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Fee Status
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Fee</span>
                <span className="font-medium">
                  ₹{feeStatus.total_due.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-500">
                  ₹{feeStatus.total_paid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Pending</span>
                <span
                  className={`font-bold ${
                    feeStatus.pending > 0 ? "text-destructive" : "text-green-500"
                  }`}
                >
                  ₹{feeStatus.pending.toLocaleString()}
                </span>
              </div>

              <Progress
                value={
                  feeStatus.total_due > 0
                    ? (feeStatus.total_paid / feeStatus.total_due) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Announcements
            </h2>

            {announcements.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No announcements
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant={
                          announcement.priority === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs shrink-0"
                      >
                        {announcement.priority}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
