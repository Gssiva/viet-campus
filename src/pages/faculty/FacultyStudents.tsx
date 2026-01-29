import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { DashboardLayout, teachingNavItems, hodNavItems, adminNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const FacultyStudents = () => {
  const { profile, activeRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Get nav items based on role
  const getNavItems = () => {
    switch (activeRole) {
      case "hod": return hodNavItems;
      case "administration": return adminNavItems;
      default: return teachingNavItems;
    }
  };

  // Fetch students based on role
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["faculty-students", profile?.id, selectedSemester, selectedSection, searchTerm],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      let query = supabase
        .from("profiles")
        .select(`
          *,
          course:courses(id, name, code),
          department:departments(id, name, code)
        `)
        .eq("user_type", "student")
        .eq("is_active", true)
        .order("roll_number", { ascending: true });
      
      if (selectedSemester !== "all") {
        query = query.eq("current_semester", parseInt(selectedSemester));
      }
      
      if (selectedSection !== "all") {
        query = query.eq("section", selectedSection);
      }
      
      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,roll_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch attendance stats for a student
  const { data: studentAttendance } = useQuery({
    queryKey: ["student-attendance-stats", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return null;
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", selectedStudent.id);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const present = data?.filter(a => a.status === "present").length || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return { total, present, percentage };
    },
    enabled: !!selectedStudent?.id,
  });

  // Fetch assignment stats for a student
  const { data: studentAssignments } = useQuery({
    queryKey: ["student-assignment-stats", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return null;
      const { data, error } = await supabase
        .from("submissions")
        .select("status")
        .eq("student_id", selectedStudent.id);
      
      if (error) throw error;
      
      const submitted = data?.length || 0;
      const evaluated = data?.filter(s => s.status === "evaluated").length || 0;
      
      return { submitted, evaluated };
    },
    enabled: !!selectedStudent?.id,
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Student Management"
      subtitle="View and manage student information"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {["A", "B", "C", "D"].map((section) => (
                <SelectItem key={section} value={section}>
                  Section {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total Students</p>
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
                  <p className="text-2xl font-bold">
                    {students.filter((s: any) => s.is_active).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-yellow-500/10">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Low Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(students.map((s: any) => s.course_id)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No students found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(student.first_name, student.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{student.roll_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.course?.code || "-"}</Badge>
                      </TableCell>
                      <TableCell>Sem {student.current_semester}</TableCell>
                      <TableCell>{student.section || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={student.is_active ? "default" : "secondary"}>
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedStudent.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(selectedStudent.first_name, selectedStudent.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <p className="text-muted-foreground">{selectedStudent.roll_number}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{selectedStudent.course?.code}</Badge>
                      <Badge variant="outline">Semester {selectedStudent.current_semester}</Badge>
                      {selectedStudent.section && (
                        <Badge variant="secondary">Section {selectedStudent.section}</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedStudent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedStudent.phone || "Not provided"}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">Attendance</h4>
                      {studentAttendance ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Percentage</span>
                            <span className={getAttendanceColor(studentAttendance.percentage)}>
                              {studentAttendance.percentage}%
                            </span>
                          </div>
                          <Progress value={studentAttendance.percentage} />
                          <p className="text-xs text-muted-foreground">
                            {studentAttendance.present} / {studentAttendance.total} classes
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">Assignments</h4>
                      {studentAssignments ? (
                        <div className="space-y-2">
                          <p className="text-2xl font-bold">{studentAssignments.submitted}</p>
                          <p className="text-sm text-muted-foreground">
                            {studentAssignments.evaluated} evaluated
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Batch Year:</span>
                    <span className="ml-2 font-medium">{selectedStudent.batch_year}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <span className="ml-2 font-medium">{selectedStudent.department?.name || "-"}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FacultyStudents;
