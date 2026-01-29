import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Award,
  FileText,
} from "lucide-react";
import { DashboardLayout, hodNavItems, adminNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const FacultyAnalytics = () => {
  const { profile, activeRole } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("semester");

  const getNavItems = () => {
    return activeRole === "administration" ? adminNavItems : hodNavItems;
  };

  // Fetch department statistics
  const { data: departmentStats } = useQuery({
    queryKey: ["department-stats", profile?.department_id],
    queryFn: async () => {
      const { data: students, error: studentsError } = await supabase
        .from("profiles")
        .select("id, current_semester, is_active")
        .eq("user_type", "student");

      const { data: faculty, error: facultyError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_type", "faculty");

      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id");

      const { data: subjects, error: subjectsError } = await supabase
        .from("subjects")
        .select("id");

      return {
        totalStudents: students?.length || 0,
        activeStudents: students?.filter(s => s.is_active).length || 0,
        totalFaculty: faculty?.length || 0,
        totalCourses: courses?.length || 0,
        totalSubjects: subjects?.length || 0,
        studentsBySemester: [1, 2, 3, 4, 5, 6, 7, 8].map(sem => ({
          semester: `Sem ${sem}`,
          count: students?.filter(s => s.current_semester === sem).length || 0,
        })),
      };
    },
  });

  // Fetch attendance analytics
  const { data: attendanceStats } = useQuery({
    queryKey: ["attendance-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status, date");

      if (error) throw error;

      const total = data?.length || 0;
      const present = data?.filter(a => a.status === "present").length || 0;
      const absent = data?.filter(a => a.status === "absent").length || 0;
      const late = data?.filter(a => a.status === "late").length || 0;

      return {
        total,
        present,
        absent,
        late,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        distribution: [
          { name: "Present", value: present, color: "#10b981" },
          { name: "Absent", value: absent, color: "#ef4444" },
          { name: "Late", value: late, color: "#f59e0b" },
        ],
      };
    },
  });

  // Fetch assignment analytics
  const { data: assignmentStats } = useQuery({
    queryKey: ["assignment-analytics"],
    queryFn: async () => {
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id, assignment_type, is_ai_evaluation_enabled");

      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("id, status");

      const { data: evaluations, error: evaluationsError } = await supabase
        .from("evaluations")
        .select("id, is_ai_evaluated, marks_obtained, ai_suggested_marks");

      const totalAssignments = assignments?.length || 0;
      const totalSubmissions = submissions?.length || 0;
      const evaluatedCount = evaluations?.length || 0;
      const aiEvaluated = evaluations?.filter(e => e.is_ai_evaluated).length || 0;

      return {
        totalAssignments,
        totalSubmissions,
        evaluatedCount,
        aiEvaluated,
        pendingEvaluation: totalSubmissions - evaluatedCount,
        byType: [
          { name: "Assignments", value: assignments?.filter(a => a.assignment_type === "assignment").length || 0 },
          { name: "Lab Work", value: assignments?.filter(a => a.assignment_type === "lab").length || 0 },
          { name: "Projects", value: assignments?.filter(a => a.assignment_type === "project").length || 0 },
          { name: "Quiz", value: assignments?.filter(a => a.assignment_type === "quiz").length || 0 },
        ],
      };
    },
  });

  // Fetch fee collection analytics
  const { data: feeStats } = useQuery({
    queryKey: ["fee-analytics"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("fee_payments")
        .select("amount_paid, status, payment_date");

      if (error) throw error;

      const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;
      const completedPayments = payments?.filter(p => p.status === "completed").length || 0;
      const pendingPayments = payments?.filter(p => p.status === "pending").length || 0;

      return {
        totalCollected,
        completedPayments,
        pendingPayments,
        totalPayments: payments?.length || 0,
      };
    },
  });

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Analytics Dashboard"
      subtitle="Comprehensive insights and statistics"
    >
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex justify-end">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departmentStats?.totalStudents || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{departmentStats?.totalCourses || 0}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats?.percentage || 0}%</p>
                  <p className="text-sm text-muted-foreground">Avg Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <FileText className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assignmentStats?.pendingEvaluation || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Evaluations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Semester */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students by Semester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStats?.studentsBySemester || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="semester" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStats?.distribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(attendanceStats?.distribution || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assignment Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assignments by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assignmentStats?.byType || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Active Students</span>
                  <span className="text-sm font-medium">
                    {departmentStats?.activeStudents || 0} / {departmentStats?.totalStudents || 0}
                  </span>
                </div>
                <Progress 
                  value={departmentStats?.totalStudents 
                    ? (departmentStats.activeStudents / departmentStats.totalStudents) * 100 
                    : 0
                  } 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Submission Rate</span>
                  <span className="text-sm font-medium">
                    {assignmentStats?.totalSubmissions || 0} submissions
                  </span>
                </div>
                <Progress 
                  value={assignmentStats?.totalAssignments 
                    ? Math.min((assignmentStats.totalSubmissions / (assignmentStats.totalAssignments * 10)) * 100, 100)
                    : 0
                  } 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">AI Evaluations</span>
                  <span className="text-sm font-medium">
                    {assignmentStats?.aiEvaluated || 0} / {assignmentStats?.evaluatedCount || 0}
                  </span>
                </div>
                <Progress 
                  value={assignmentStats?.evaluatedCount 
                    ? (assignmentStats.aiEvaluated / assignmentStats.evaluatedCount) * 100 
                    : 0
                  } 
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Fee Collection</span>
                  <span className="text-sm font-medium text-green-500">
                    ₹{(feeStats?.totalCollected || 0).toLocaleString()}
                  </span>
                </div>
                <Progress value={75} className="bg-green-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{departmentStats?.totalSubjects || 0}</p>
              <p className="text-xs text-muted-foreground">Total Subjects</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{assignmentStats?.evaluatedCount || 0}</p>
              <p className="text-xs text-muted-foreground">Evaluated</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{feeStats?.pendingPayments || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Fees</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{departmentStats?.totalFaculty || 0}</p>
              <p className="text-xs text-muted-foreground">Faculty Members</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyAnalytics;
