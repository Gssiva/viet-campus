import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Save,
} from "lucide-react";
import { DashboardLayout, teachingNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  section: string;
  status: "present" | "absent" | "late" | null;
}

const FacultyAttendance = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSubjects();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedSubject && selectedDate) {
      fetchStudentsAndAttendance();
    }
  }, [selectedSubject, selectedDate]);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("faculty_subjects")
        .select(`
          subject_id,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq("faculty_id", profile!.id)
        .eq("is_active", true);

      if (error) throw error;

      const subjectList = (data || []).map((fs: any) => ({
        id: fs.subjects.id,
        name: fs.subjects.name,
        code: fs.subjects.code,
      }));

      setSubjects(subjectList);
      if (subjectList.length > 0) {
        setSelectedSubject(subjectList[0].id);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      // Get the subject to find its course and semester
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("course_id, semester")
        .eq("id", selectedSubject)
        .single();

      if (!subjectData) return;

      // Get students in this course and semester
      const { data: studentProfiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, roll_number, section")
        .eq("user_type", "student")
        .eq("course_id", subjectData.course_id)
        .eq("current_semester", subjectData.semester)
        .eq("is_active", true)
        .order("roll_number");

      // Get existing attendance for this date
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("subject_id", selectedSubject)
        .eq("date", selectedDate);

      const attendanceMap = new Map(
        attendanceData?.map((a) => [a.student_id, a.status]) || []
      );

      const studentsWithAttendance = (studentProfiles || []).map((s) => ({
        ...s,
        status: attendanceMap.get(s.id) as any || null,
      }));

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const updateAttendance = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" as const })));
  };

  const markAllAbsent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "absent" as const })));
  };

  const saveAttendance = async () => {
    const studentsWithStatus = students.filter((s) => s.status);
    if (studentsWithStatus.length === 0) {
      toast({
        title: "Error",
        description: "Please mark attendance for at least one student.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Delete existing attendance for this date/subject
      await supabase
        .from("attendance")
        .delete()
        .eq("subject_id", selectedSubject)
        .eq("date", selectedDate)
        .eq("faculty_id", profile!.id);

      // Insert new attendance records
      const records = studentsWithStatus.map((s) => ({
        student_id: s.id,
        subject_id: selectedSubject,
        faculty_id: profile!.id,
        date: selectedDate,
        status: s.status,
      }));

      const { error } = await supabase.from("attendance").insert(records);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Attendance saved for ${studentsWithStatus.length} students.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;

  return (
    <DashboardLayout
      navItems={teachingNavItems}
      title="Mark Attendance"
      subtitle="Record student attendance for your classes"
    >
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1 block">
                Subject
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm text-muted-foreground mb-1 block">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-500">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </GlassCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 text-center">
            <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-destructive">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </GlassCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-500">{lateCount}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Student List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Students ({students.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                All Absent
              </Button>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {selectedSubject
                ? "No students found for this subject"
                : "Select a subject to view students"}
            </p>
          ) : (
            <>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.roll_number}
                        </TableCell>
                        <TableCell>
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.section || "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant={
                                student.status === "present"
                                  ? "default"
                                  : "outline"
                              }
                              className="w-8 h-8 p-0"
                              onClick={() =>
                                updateAttendance(student.id, "present")
                              }
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                student.status === "absent"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="w-8 h-8 p-0"
                              onClick={() =>
                                updateAttendance(student.id, "absent")
                              }
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                student.status === "late"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="w-8 h-8 p-0"
                              onClick={() =>
                                updateAttendance(student.id, "late")
                              }
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={saveAttendance} disabled={isSaving}>
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default FacultyAttendance;
