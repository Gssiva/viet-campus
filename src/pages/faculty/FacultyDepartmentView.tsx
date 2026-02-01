import { DashboardLayout, hodNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, GraduationCap, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const FacultyDepartmentView = () => {
  const { profile } = useAuth();

  const { data: department } = useQuery({
    queryKey: ["my-department", profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return null;
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", profile.department_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department_id,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["department-courses", profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("department_id", profile.department_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department_id,
  });

  const { data: faculty = [] } = useQuery({
    queryKey: ["department-faculty", profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*, faculty_roles(role)")
        .eq("department_id", profile.department_id)
        .eq("user_type", "faculty");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department_id,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["department-students", profile?.department_id],
    queryFn: async () => {
      if (!profile?.department_id) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("department_id", profile.department_id)
        .eq("user_type", "student");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department_id,
  });

  return (
    <DashboardLayout
      navItems={hodNavItems}
      title={department?.name || "Department"}
      subtitle="View department overview"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <BookOpen className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Users className="w-10 h-10 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{faculty.length}</p>
                  <p className="text-sm text-muted-foreground">Faculty Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GraduationCap className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Award className="w-10 h-10 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{department?.code || "-"}</p>
                  <p className="text-sm text-muted-foreground">Dept. Code</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Faculty Members</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.slice(0, 10).map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.first_name} {f.last_name}</TableCell>
                      <TableCell>{f.employee_id}</TableCell>
                      <TableCell>
                        {f.faculty_roles?.map((r: any) => (
                          <Badge key={r.role} variant="secondary" className="mr-1 capitalize">
                            {r.role.replace("_", " ")}
                          </Badge>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.code}</TableCell>
                      <TableCell>{c.duration_years} years</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDepartmentView;
