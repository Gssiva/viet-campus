import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { ExportCSVButton } from "@/components/ExportCSVButton";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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

interface ExamResult {
  id: string;
  subject_name: string;
  subject_code: string;
  exam_type: string;
  semester: number;
  marks_obtained: number | null;
  max_marks: number;
  grade: string | null;
  academic_year: string;
}

const StudentResults = () => {
  const { profile } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchResults();
    }
  }, [profile]);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from("exam_results")
        .select(`
          id,
          exam_type,
          semester,
          marks_obtained,
          max_marks,
          grade,
          academic_year,
          subjects (
            name,
            code
          )
        `)
        .eq("student_id", profile!.id)
        .order("semester", { ascending: false });

      if (error) throw error;

      const formattedResults = (data || []).map((r: any) => ({
        id: r.id,
        subject_name: r.subjects?.name || "Unknown",
        subject_code: r.subjects?.code || "",
        exam_type: r.exam_type,
        semester: r.semester,
        marks_obtained: r.marks_obtained,
        max_marks: r.max_marks,
        grade: r.grade,
        academic_year: r.academic_year,
      }));

      setResults(formattedResults);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const semesters = [...new Set(results.map((r) => r.semester))].sort(
    (a, b) => b - a
  );

  const filteredResults =
    selectedSemester === "all"
      ? results
      : results.filter((r) => r.semester.toString() === selectedSemester);

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-muted-foreground";
    if (["A+", "A", "O"].includes(grade)) return "text-green-500";
    if (["B+", "B"].includes(grade)) return "text-blue-500";
    if (["C+", "C"].includes(grade)) return "text-amber-500";
    return "text-destructive";
  };

  const calculateSGPA = (semesterResults: ExamResult[]) => {
    if (semesterResults.length === 0) return 0;
    
    const gradePoints: Record<string, number> = {
      "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C+": 5, "C": 4, "D": 3, "F": 0
    };

    const totalCredits = semesterResults.length * 3; // Assuming 3 credits per subject
    const totalPoints = semesterResults.reduce((sum, r) => {
      return sum + (gradePoints[r.grade || "F"] || 0) * 3;
    }, 0);

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  const calculateCGPA = () => {
    const semesterSGPAs = semesters.map((sem) => {
      const semResults = results.filter((r) => r.semester === sem && r.grade);
      return parseFloat(calculateSGPA(semResults) as string);
    }).filter((sgpa) => sgpa > 0);

    if (semesterSGPAs.length === 0) return "0.00";
    const avg = semesterSGPAs.reduce((a, b) => a + b, 0) / semesterSGPAs.length;
    return avg.toFixed(2);
  };

  const totalMarks = filteredResults.reduce(
    (sum, r) => sum + (r.marks_obtained || 0),
    0
  );
  const totalMaxMarks = filteredResults.reduce((sum, r) => sum + r.max_marks, 0);
  const percentage =
    totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : "0";

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Exam Results"
      subtitle="View your academic performance"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{calculateCGPA()}</p>
                <p className="text-xs text-muted-foreground">CGPA</p>
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
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{percentage}%</p>
                <p className="text-xs text-muted-foreground">Percentage</p>
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
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{semesters.length}</p>
                <p className="text-xs text-muted-foreground">Semesters</p>
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
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Semester Filter and Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="flex items-center gap-2">
              <ExportCSVButton
                data={filteredResults.map((r) => ({
                  Subject: r.subject_name,
                  Code: r.subject_code,
                  ExamType: r.exam_type,
                  Semester: r.semester,
                  Marks: r.marks_obtained ?? "",
                  MaxMarks: r.max_marks,
                  Grade: r.grade || "",
                  Year: r.academic_year,
                }))}
                filename="exam-results"
                columns={[
                  { key: "Subject", label: "Subject" },
                  { key: "Code", label: "Code" },
                  { key: "ExamType", label: "Exam Type" },
                  { key: "Semester", label: "Semester" },
                  { key: "Marks", label: "Marks" },
                  { key: "MaxMarks", label: "Max Marks" },
                  { key: "Grade", label: "Grade" },
                  { key: "Year", label: "Academic Year" },
                ]}
              />

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No results available</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Type</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.subject_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.subject_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {result.exam_type}
                        </Badge>
                      </TableCell>
                      <TableCell>Sem {result.semester}</TableCell>
                      <TableCell className="text-right">
                        {result.marks_obtained !== null ? (
                          <span>
                            {result.marks_obtained}{" "}
                            <span className="text-muted-foreground">
                              / {result.max_marks}
                            </span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={getGradeColor(result.grade)}
                        >
                          {result.grade || "-"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Semester Summary */}
          {selectedSemester !== "all" && filteredResults.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Semester {selectedSemester} SGPA
                  </p>
                  <p className="text-2xl font-bold">
                    {calculateSGPA(filteredResults)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Total Marks
                  </p>
                  <p className="text-lg font-semibold">
                    {totalMarks} / {totalMaxMarks}
                  </p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentResults;
