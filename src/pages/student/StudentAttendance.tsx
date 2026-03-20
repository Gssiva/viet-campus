import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { ExportCSVButton } from "@/components/ExportCSVButton";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  subject_name: string;
  subject_code: string;
  remarks: string | null;
}

interface SubjectAttendance {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total: number;
  present: number;
  percentage: number;
}

const StudentAttendance = () => {
  const { profile } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjectWise, setSubjectWise] = useState<SubjectAttendance[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchAttendance();
    }
  }, [profile]);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          date,
          status,
          remarks,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq("student_id", profile!.id)
        .order("date", { ascending: false });

      if (error) throw error;

      const records = (data || []).map((record: any) => ({
        id: record.id,
        date: record.date,
        status: record.status,
        subject_name: record.subjects?.name || "Unknown",
        subject_code: record.subjects?.code || "",
        remarks: record.remarks,
      }));

      setAttendanceRecords(records);

      // Calculate subject-wise attendance
      const subjectMap = new Map<string, SubjectAttendance>();
      
      data?.forEach((record: any) => {
        const subjectId = record.subjects?.id;
        if (!subjectId) return;

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subject_id: subjectId,
            subject_name: record.subjects.name,
            subject_code: record.subjects.code,
            total: 0,
            present: 0,
            percentage: 0,
          });
        }

        const stats = subjectMap.get(subjectId)!;
        stats.total++;
        if (record.status === "present") {
          stats.present++;
        }
        stats.percentage = Math.round((stats.present / stats.total) * 100);
      });

      setSubjectWise(Array.from(subjectMap.values()));
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const overallStats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r) => r.status === "present").length,
    absent: attendanceRecords.filter((r) => r.status === "absent").length,
    late: attendanceRecords.filter((r) => r.status === "late").length,
    percentage:
      attendanceRecords.length > 0
        ? Math.round(
            (attendanceRecords.filter((r) => r.status === "present").length /
              attendanceRecords.length) *
              100
          )
        : 0,
  };

  const filteredRecords =
    selectedSubject === "all"
      ? attendanceRecords
      : attendanceRecords.filter((r) => r.subject_code === selectedSubject);

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Attendance"
      subtitle="Track your class attendance"
    >
      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {overallStats.present}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {overallStats.absent}
                </p>
                <p className="text-xs text-muted-foreground">Absent</p>
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
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">
                  {overallStats.late}
                </p>
                <p className="text-xs text-muted-foreground">Late</p>
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
              <div
                className={`p-2 rounded-lg ${
                  overallStats.percentage >= 75
                    ? "bg-green-500/10"
                    : "bg-destructive/10"
                }`}
              >
                <Calendar
                  className={`w-5 h-5 ${
                    overallStats.percentage >= 75
                      ? "text-green-500"
                      : "text-destructive"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${
                    overallStats.percentage >= 75
                      ? "text-green-500"
                      : "text-destructive"
                  }`}
                >
                  {overallStats.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">Overall</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Warning Banner */}
      {overallStats.percentage < 75 && overallStats.total > 0 && (
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
                  Attendance Below 75%
                </p>
                <p className="text-sm text-muted-foreground">
                  You need {Math.ceil((0.75 * overallStats.total - overallStats.present) / 0.25)} more
                  present days to reach 75% attendance. Contact your advisor.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Subject-wise Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4">Subject-wise Attendance</h2>

            {subjectWise.length === 0 ? (
              <p className="text-muted-foreground text-sm">No attendance data</p>
            ) : (
              <div className="space-y-4">
                {subjectWise.map((subject) => (
                  <div key={subject.subject_id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate">
                        {subject.subject_name}
                      </span>
                      <span
                        className={
                          subject.percentage >= 75
                            ? "text-green-500"
                            : "text-destructive"
                        }
                      >
                        {subject.percentage}%
                      </span>
                    </div>
                    <Progress value={subject.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {subject.present} / {subject.total} classes
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Detailed Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Attendance Records</h2>
              <div className="flex items-center gap-2">
                <ExportCSVButton
                  data={filteredRecords.map((r) => ({
                    Date: r.date,
                    Subject: r.subject_name,
                    Code: r.subject_code,
                    Status: r.status,
                    Remarks: r.remarks || "",
                  }))}
                  filename="attendance-records"
                  columns={[
                    { key: "Date", label: "Date" },
                    { key: "Subject", label: "Subject" },
                    { key: "Code", label: "Code" },
                    { key: "Status", label: "Status" },
                    { key: "Remarks", label: "Remarks" },
                  ]}
                />

              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectWise.map((s) => (
                    <SelectItem key={s.subject_code} value={s.subject_code}>
                      {s.subject_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredRecords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No records found</p>
            ) : (
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.slice(0, 20).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.subject_code}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.subject_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "present"
                                ? "default"
                                : record.status === "late"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
