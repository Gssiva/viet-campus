import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
} from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isPast, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  assignment_type: string;
  subject_name: string;
  subject_code: string;
  file_url: string | null;
  submission?: {
    id: string;
    status: string;
    submitted_at: string;
    file_url: string | null;
    submitted_text: string | null;
  };
  evaluation?: {
    marks_obtained: number | null;
    feedback: string | null;
    is_faculty_approved: boolean;
  };
}

const StudentAssignments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchAssignments();
    }
  }, [profile]);

  const fetchAssignments = async () => {
    try {
      // Get subjects for student's semester
      const { data: assignmentsData, error } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          due_date,
          max_marks,
          assignment_type,
          file_url,
          subjects (
            name,
            code
          )
        `)
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Get student's submissions
      const { data: submissions } = await supabase
        .from("submissions")
        .select(`
          id,
          assignment_id,
          status,
          submitted_at,
          file_url,
          submitted_text
        `)
        .eq("student_id", profile!.id);

      // Get evaluations
      const submissionIds = submissions?.map((s) => s.id) || [];
      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("*")
        .in("submission_id", submissionIds);

      const evaluationsMap = new Map(
        evaluations?.map((e) => [e.submission_id, e]) || []
      );
      const submissionsMap = new Map(
        submissions?.map((s) => [s.assignment_id, s]) || []
      );

      const formattedAssignments = (assignmentsData || []).map((a: any) => {
        const submission = submissionsMap.get(a.id);
        const evaluation = submission
          ? evaluationsMap.get(submission.id)
          : undefined;

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          due_date: a.due_date,
          max_marks: a.max_marks,
          assignment_type: a.assignment_type,
          file_url: a.file_url,
          subject_name: a.subjects?.name || "Unknown",
          subject_code: a.subjects?.code || "",
          submission: submission
            ? {
                id: submission.id,
                status: submission.status,
                submitted_at: submission.submitted_at,
                file_url: submission.file_url,
                submitted_text: submission.submitted_text,
              }
            : undefined,
          evaluation: evaluation
            ? {
                marks_obtained: evaluation.marks_obtained,
                feedback: evaluation.feedback || evaluation.ai_feedback,
                is_faculty_approved: evaluation.is_faculty_approved,
              }
            : undefined,
        };
      });

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !submissionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your submission text.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("submissions").insert({
        assignment_id: selectedAssignment.id,
        student_id: profile!.id,
        submitted_text: submissionText,
        status: "submitted",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment submitted successfully!",
      });

      setSelectedAssignment(null);
      setSubmissionText("");
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit assignment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatus = (assignment: Assignment) => {
    if (assignment.evaluation?.is_faculty_approved) {
      return "evaluated";
    }
    if (assignment.submission) {
      return "submitted";
    }
    if (assignment.due_date && isPast(new Date(assignment.due_date))) {
      return "overdue";
    }
    return "pending";
  };

  const pendingAssignments = assignments.filter(
    (a) => getStatus(a) === "pending" || getStatus(a) === "overdue"
  );
  const submittedAssignments = assignments.filter(
    (a) => getStatus(a) === "submitted"
  );
  const evaluatedAssignments = assignments.filter(
    (a) => getStatus(a) === "evaluated"
  );

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
    const status = getStatus(assignment);

    return (
      <GlassCard className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {assignment.subject_code}
              </Badge>
              <Badge
                variant={
                  status === "evaluated"
                    ? "default"
                    : status === "submitted"
                    ? "secondary"
                    : status === "overdue"
                    ? "destructive"
                    : "outline"
                }
                className="text-xs"
              >
                {status}
              </Badge>
            </div>
            <h3 className="font-semibold truncate">{assignment.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {assignment.description || "No description"}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {assignment.due_date
                  ? format(new Date(assignment.due_date), "MMM d, h:mm a")
                  : "No deadline"}
              </span>
              <span>Max: {assignment.max_marks} marks</span>
            </div>

            {assignment.evaluation?.is_faculty_approved && (
              <div className="mt-2 p-2 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Score: {assignment.evaluation.marks_obtained} /{" "}
                  {assignment.max_marks}
                </p>
                {assignment.evaluation.feedback && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {assignment.evaluation.feedback}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {!assignment.submission && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => setSelectedAssignment(assignment)}
                    disabled={status === "overdue"}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Submit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Submit Assignment</DialogTitle>
                    <DialogDescription>
                      {assignment.title} - {assignment.subject_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {assignment.description && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="font-medium mb-1">Instructions:</p>
                        <p className="text-muted-foreground">
                          {assignment.description}
                        </p>
                      </div>
                    )}
                    <Textarea
                      placeholder="Enter your answer here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={6}
                    />
                    <Button
                      className="w-full"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {assignment.submission && (
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Assignments"
      subtitle="View and submit your assignments"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-amber-500/10 w-fit mx-auto mb-2">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{pendingAssignments.length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-blue-500/10 w-fit mx-auto mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{submittedAssignments.length}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4 text-center">
            <div className="p-2 rounded-lg bg-green-500/10 w-fit mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{evaluatedAssignments.length}</p>
            <p className="text-xs text-muted-foreground">Evaluated</p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="evaluated">
            Evaluated ({evaluatedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-muted-foreground">
                You have no pending assignments.
              </p>
            </GlassCard>
          ) : (
            pendingAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedAssignments.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No submitted assignments awaiting evaluation.
              </p>
            </GlassCard>
          ) : (
            submittedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="evaluated" className="space-y-4">
          {evaluatedAssignments.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No evaluated assignments yet.
              </p>
            </GlassCard>
          ) : (
            evaluatedAssignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default StudentAssignments;
