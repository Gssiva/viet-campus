import { DashboardLayout, parentNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ParentAttendance = () => {
  const { profile } = useAuth();

  const { data: student } = useQuery({
    queryKey: ["linked-student", profile?.linked_student_id],
    queryFn: async () => {
      if (!profile?.linked_student_id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.linked_student_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.linked_student_id,
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["student-attendance", profile?.linked_student_id],
    queryFn: async () => {
      if (!profile?.linked_student_id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*, subjects(name, code)")
        .eq("student_id", profile.linked_student_id)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.linked_student_id,
  });

  const stats = {
    present: attendance.filter((a: any) => a.status === "present").length,
    absent: attendance.filter((a: any) => a.status === "absent").length,
    late: attendance.filter((a: any) => a.status === "late").length,
  };

  const percentage = attendance.length > 0 
    ? ((stats.present + stats.late) / attendance.length * 100).toFixed(1)
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Present</Badge>;
      case "absent":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Absent</Badge>;
      case "late":
        return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" />Late</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      navItems={parentNavItems}
      title="Attendance"
      subtitle={student ? `${student.first_name} ${student.last_name}'s attendance record` : "View attendance"}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Calendar className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{percentage}%</p>
                  <p className="text-sm text-muted-foreground">Overall</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <XCircle className="w-10 h-10 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Clock className="w-10 h-10 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.late}</p>
                  <p className="text-sm text-muted-foreground">Late</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : attendance.length === 0 ? (
              <p className="text-muted-foreground">No attendance records found.</p>
            ) : (
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
                  {attendance.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        {record.subjects?.name}
                        <br />
                        <span className="text-xs text-muted-foreground">{record.subjects?.code}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{record.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentAttendance;
