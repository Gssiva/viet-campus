import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle,
  Clock,
  MessageSquare,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import { DashboardLayout, teachingNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface Submission {
  id: string;
  student_name: string;
  roll_number: string;
  assignment_title: string;
  subject_code: string;
  submitted_at: string;
  submitted_text: string | null;
  status: string;
  evaluation?: {
    id: string;
    marks_obtained: number | null;
    feedback: string | null;
    ai_suggested_marks: number | null;
    ai_feedback: string | null;
    is_faculty_approved: boolean;
  };
  max_marks: number;
}

const FacultyEvaluations = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [evaluationData, setEvaluationData] = useState({
    marks: 0,
    feedback: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSubmissions();
    }
  }, [profile, filterStatus]);

  const fetchSubmissions = async () => {
    try {
      // Get faculty's assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, max_marks, subjects (code)")
        .eq("faculty_id", profile!.id);

      const assignmentIds = assignments?.map((a) => a.id) || [];
      const assignmentMap = new Map(
        assignments?.map((a: any) => [
          a.id,
          { title: a.title, code: a.subjects?.code, max_marks: a.max_marks },
        ]) || []
      );

      if (assignmentIds.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // Get submissions with evaluations
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select(`
          id,
          assignment_id,
          submitted_at,
          submitted_text,
          status,
          profiles (first_name, last_name, roll_number),
          evaluations (
            id,
            marks_obtained,
            feedback,
            ai_suggested_marks,
            ai_feedback,
            is_faculty_approved
          )
        `)
        .in("assignment_id", assignmentIds)
        .order("submitted_at", { ascending: false });

      const formattedSubmissions = (submissionsData || [])
        .map((s: any) => {
          const assignment = assignmentMap.get(s.assignment_id);
          const evaluation = s.evaluations?.[0];
          
          return {
            id: s.id,
            student_name: `${s.profiles?.first_name || ""} ${s.profiles?.last_name || ""}`.trim(),
            roll_number: s.profiles?.roll_number || "",
            assignment_title: assignment?.title || "Unknown",
            subject_code: assignment?.code || "",
            submitted_at: s.submitted_at,
            submitted_text: s.submitted_text,
            status: s.status,
            max_marks: assignment?.max_marks || 100,
            evaluation: evaluation
              ? {
                  id: evaluation.id,
                  marks_obtained: evaluation.marks_obtained,
                  feedback: evaluation.feedback,
                  ai_suggested_marks: evaluation.ai_suggested_marks,
                  ai_feedback: evaluation.ai_feedback,
                  is_faculty_approved: evaluation.is_faculty_approved,
                }
              : undefined,
          };
        })
        .filter((s) => {
          if (filterStatus === "pending") {
            return !s.evaluation?.is_faculty_approved;
          }
          if (filterStatus === "evaluated") {
            return s.evaluation?.is_faculty_approved;
          }
          return true;
        });

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEvaluation = (submission: Submission) => {
    setSelectedSubmission(submission);
    setEvaluationData({
      marks: submission.evaluation?.ai_suggested_marks || submission.evaluation?.marks_obtained || 0,
      feedback: submission.evaluation?.ai_feedback || submission.evaluation?.feedback || "",
    });
  };

  const saveEvaluation = async () => {
    if (!selectedSubmission) return;

    setIsSaving(true);

    try {
      if (selectedSubmission.evaluation) {
        // Update existing evaluation
        const { error } = await supabase
          .from("evaluations")
          .update({
            marks_obtained: evaluationData.marks,
            feedback: evaluationData.feedback,
            is_faculty_approved: true,
            faculty_id: profile!.id,
            evaluated_at: new Date().toISOString(),
          })
          .eq("id", selectedSubmission.evaluation.id);

        if (error) throw error;
      } else {
        // Create new evaluation
        const { error } = await supabase.from("evaluations").insert({
          submission_id: selectedSubmission.id,
          marks_obtained: evaluationData.marks,
          feedback: evaluationData.feedback,
          is_faculty_approved: true,
          faculty_id: profile!.id,
          evaluated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Evaluation saved successfully!",
      });

      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save evaluation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pendingCount = submissions.filter(
    (s) => !s.evaluation?.is_faculty_approved
  ).length;

  return (
    <DashboardLayout
      navItems={teachingNavItems}
      title="Evaluations"
      subtitle="Review and grade student submissions"
    >
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <GlassCard className="p-3 text-center">
                <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <p className="text-xl font-bold text-green-500">
                  {submissions.length - pendingCount}
                </p>
                <p className="text-xs text-muted-foreground">Evaluated</p>
              </GlassCard>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>
      </motion.div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {submissions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Submissions</p>
            <p className="text-muted-foreground">
              {filterStatus === "pending"
                ? "All submissions have been evaluated!"
                : "No submissions to display"}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, index) => (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{submission.subject_code}</Badge>
                        <Badge
                          variant={
                            submission.evaluation?.is_faculty_approved
                              ? "default"
                              : "secondary"
                          }
                        >
                          {submission.evaluation?.is_faculty_approved
                            ? "Evaluated"
                            : "Pending"}
                        </Badge>
                        {submission.evaluation?.ai_suggested_marks && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Suggested
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-semibold">{submission.assignment_title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {submission.student_name} ({submission.roll_number})
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(submission.submitted_at), "MMM d, h:mm a")}
                        </span>
                        {submission.evaluation?.marks_obtained !== null && (
                          <span className="font-medium text-foreground">
                            Score: {submission.evaluation.marks_obtained}/{submission.max_marks}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button onClick={() => openEvaluation(submission)}>
                      {submission.evaluation?.is_faculty_approved ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-1" />
                          Evaluate
                        </>
                      )}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Evaluation Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={() => setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluate Submission</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Student</p>
                <p className="font-medium">
                  {selectedSubmission.student_name} ({selectedSubmission.roll_number})
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Submission</p>
                <p className="whitespace-pre-wrap text-sm">
                  {selectedSubmission.submitted_text || "No text submitted"}
                </p>
              </div>

              {selectedSubmission.evaluation?.ai_feedback && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">AI Suggestion</span>
                  </div>
                  <p className="text-sm mb-2">
                    Suggested Marks: {selectedSubmission.evaluation.ai_suggested_marks}/{selectedSubmission.max_marks}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.evaluation.ai_feedback}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Marks (out of {selectedSubmission.max_marks})
                  </label>
                  <Input
                    type="number"
                    value={evaluationData.marks}
                    onChange={(e) =>
                      setEvaluationData({
                        ...evaluationData,
                        marks: parseInt(e.target.value) || 0,
                      })
                    }
                    max={selectedSubmission.max_marks}
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Feedback</label>
                <Textarea
                  value={evaluationData.feedback}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      feedback: e.target.value,
                    })
                  }
                  placeholder="Provide feedback for the student..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Cancel
                </Button>
                <Button onClick={saveEvaluation} disabled={isSaving}>
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Save & Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FacultyEvaluations;
