import { DashboardLayout, parentNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Award, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ParentResults = () => {
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

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["student-results", profile?.linked_student_id],
    queryFn: async () => {
      if (!profile?.linked_student_id) return [];
      const { data, error } = await supabase
        .from("exam_results")
        .select("*, subjects(name, code, credits)")
        .eq("student_id", profile.linked_student_id)
        .order("semester", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.linked_student_id,
  });

  // Group by semester
  const bySemester = results.reduce((acc: any, r: any) => {
    const sem = r.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(r);
    return acc;
  }, {});

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return <Badge variant="secondary">-</Badge>;
    const colors: Record<string, string> = {
      "A+": "bg-green-500",
      "A": "bg-green-500",
      "B+": "bg-blue-500",
      "B": "bg-blue-500",
      "C": "bg-amber-500",
      "D": "bg-orange-500",
      "F": "bg-red-500",
    };
    return <Badge className={colors[grade] || ""}>{grade}</Badge>;
  };

  const calculateSGPA = (semResults: any[]) => {
    let totalCredits = 0;
    let totalPoints = 0;
    const gradePoints: Record<string, number> = {
      "A+": 10, "A": 9, "B+": 8, "B": 7, "C": 6, "D": 5, "F": 0
    };
    
    semResults.forEach((r: any) => {
      const credits = r.subjects?.credits || 3;
      const points = gradePoints[r.grade] || 0;
      totalCredits += credits;
      totalPoints += credits * points;
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "-";
  };

  return (
    <DashboardLayout
      navItems={parentNavItems}
      title="Exam Results"
      subtitle={student ? `${student.first_name} ${student.last_name}'s academic performance` : "View results"}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Award className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{results.length}</p>
                  <p className="text-sm text-muted-foreground">Subjects Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.keys(bySemester).length > 0 
                      ? calculateSGPA(results) 
                      : "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">CGPA (Cumulative)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No exam results available yet.
            </CardContent>
          </Card>
        ) : (
          Object.entries(bySemester)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([semester, semResults]: [string, any]) => (
              <Card key={semester}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Semester {semester}</span>
                    <Badge variant="outline">SGPA: {calculateSGPA(semResults)}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Exam Type</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semResults.map((result: any) => (
                        <TableRow key={result.id}>
                          <TableCell>{result.subjects?.name}</TableCell>
                          <TableCell>{result.subjects?.code}</TableCell>
                          <TableCell className="capitalize">{result.exam_type}</TableCell>
                          <TableCell>
                            {result.marks_obtained !== null 
                              ? `${result.marks_obtained}/${result.max_marks}` 
                              : "-"}
                          </TableCell>
                          <TableCell>{getGradeBadge(result.grade)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentResults;
