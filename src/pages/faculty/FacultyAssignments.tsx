import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  Users,
  CheckCircle,
  Sparkles,
  Upload,
  Bot,
  Loader2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  assignment_type: string;
  subject_name: string;
  subject_code: string;
  submissions_count: number;
  evaluated_count: number;
  is_ai_evaluation_enabled: boolean;
  model_answer_url: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

const FacultyAssignments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [modelAnswerDialogOpen, setModelAnswerDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [modelAnswer, setModelAnswer] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subject_id: "",
    assignment_type: "assignment",
    max_marks: 100,
    due_date: "",
    is_ai_evaluation_enabled: true,
    model_answer: "",
  });

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch subjects
      const { data: facultySubjects } = await supabase
        .from("faculty_subjects")
        .select(`
          subject_id,
          subjects (id, name, code)
        `)
        .eq("faculty_id", profile!.id)
        .eq("is_active", true);

      const subjectList = (facultySubjects || []).map((fs: any) => ({
        id: fs.subjects.id,
        name: fs.subjects.name,
        code: fs.subjects.code,
      }));
      setSubjects(subjectList);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          description,
          due_date,
          max_marks,
          assignment_type,
          is_ai_evaluation_enabled,
          model_answer_url,
          subjects (name, code)
        `)
        .eq("faculty_id", profile!.id)
        .order("created_at", { ascending: false });

      // Get submission counts
      const assignmentIds = assignmentsData?.map((a) => a.id) || [];
      const { data: submissions } = await supabase
        .from("submissions")
        .select(`
          id,
          assignment_id,
          evaluations (is_faculty_approved)
        `)
        .in("assignment_id", assignmentIds);

      const submissionCounts = new Map<string, { total: number; evaluated: number }>();
      submissions?.forEach((s: any) => {
        const current = submissionCounts.get(s.assignment_id) || { total: 0, evaluated: 0 };
        current.total++;
        if (s.evaluations?.is_faculty_approved) {
          current.evaluated++;
        }
        submissionCounts.set(s.assignment_id, current);
      });

      const formattedAssignments = (assignmentsData || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        max_marks: a.max_marks,
        assignment_type: a.assignment_type,
        subject_name: a.subjects?.name || "Unknown",
        subject_code: a.subjects?.code || "",
        submissions_count: submissionCounts.get(a.id)?.total || 0,
        evaluated_count: submissionCounts.get(a.id)?.evaluated || 0,
        is_ai_evaluation_enabled: a.is_ai_evaluation_enabled,
        model_answer_url: a.model_answer_url,
      }));

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.subject_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (newAssignment.is_ai_evaluation_enabled && !newAssignment.model_answer) {
      toast({
        title: "Error",
        description: "Please provide a model answer for AI evaluation.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("assignments").insert({
        title: newAssignment.title,
        description: newAssignment.description || null,
        subject_id: newAssignment.subject_id,
        faculty_id: profile!.id,
        assignment_type: newAssignment.assignment_type,
        max_marks: newAssignment.max_marks,
        due_date: newAssignment.due_date || null,
        is_ai_evaluation_enabled: newAssignment.is_ai_evaluation_enabled,
        model_answer_url: newAssignment.model_answer || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment created successfully!",
      });

      setIsDialogOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        subject_id: "",
        assignment_type: "assignment",
        max_marks: 100,
        due_date: "",
        is_ai_evaluation_enabled: true,
        model_answer: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment.",
        variant: "destructive",
      });
    }
  };

  const openModelAnswerDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setModelAnswer(assignment.model_answer_url || "");
    setModelAnswerDialogOpen(true);
  };

  const saveModelAnswer = async () => {
    if (!selectedAssignment) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .update({ 
          model_answer_url: modelAnswer,
          is_ai_evaluation_enabled: !!modelAnswer
        })
        .eq("id", selectedAssignment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Model answer saved successfully!",
      });
      setModelAnswerDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save model answer.",
        variant: "destructive",
      });
    }
  };

  const runAIEvaluation = async (assignmentId: string) => {
    setIsEvaluating(assignmentId);
    
    try {
      const response = await supabase.functions.invoke("batch-evaluate", {
        body: { assignment_id: assignmentId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "AI Evaluation Complete",
        description: `Evaluated ${data.evaluated_count} submissions. ${data.failed_count > 0 ? `${data.failed_count} failed.` : ""}`,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Evaluation Error",
        description: error.message || "Failed to run AI evaluation.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(null);
    }
  };

  return (
    <DashboardLayout
      navItems={teachingNavItems}
      title="Assignments"
      subtitle="Create and manage assignments with AI evaluation"
    >
      {/* Header Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {assignments.length}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">
                {assignments.reduce((sum, a) => sum + a.submissions_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Submissions</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {assignments.filter(a => a.is_ai_evaluation_enabled).length}
              </p>
              <p className="text-xs text-muted-foreground">AI Enabled</p>
            </GlassCard>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create an assignment with AI-powered automatic evaluation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject *</Label>
                  <Select
                    value={newAssignment.subject_id}
                    onValueChange={(v) =>
                      setNewAssignment({ ...newAssignment, subject_id: v })
                    }
                  >
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

                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, title: e.target.value })
                    }
                    placeholder="Assignment title / Question"
                  />
                </div>

                <div>
                  <Label>Instructions / Question Details</Label>
                  <Textarea
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Detailed question or assignment instructions..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={newAssignment.assignment_type}
                      onValueChange={(v) =>
                        setNewAssignment({ ...newAssignment, assignment_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="lab">Lab Work</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Marks</Label>
                    <Input
                      type="number"
                      value={newAssignment.max_marks}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          max_marks: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, due_date: e.target.value })
                    }
                  />
                </div>

                {/* AI Evaluation Section */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <Label className="font-medium">AI-Powered Evaluation</Label>
                    </div>
                    <Switch
                      checked={newAssignment.is_ai_evaluation_enabled}
                      onCheckedChange={(checked) =>
                        setNewAssignment({ ...newAssignment, is_ai_evaluation_enabled: checked })
                      }
                    />
                  </div>
                  
                  {newAssignment.is_ai_evaluation_enabled && (
                    <div>
                      <Label>Model Answer *</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Provide the ideal answer. AI will compare student submissions against this.
                      </p>
                      <Textarea
                        value={newAssignment.model_answer}
                        onChange={(e) =>
                          setNewAssignment({
                            ...newAssignment,
                            model_answer: e.target.value,
                          })
                        }
                        placeholder="Enter the complete model answer here. The more detailed, the better the AI evaluation accuracy..."
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateAssignment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Assignment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Assignments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {assignments.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Assignments</p>
            <p className="text-muted-foreground">
              Create your first assignment to get started
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline">{assignment.subject_code}</Badge>
                        <Badge variant="secondary" className="capitalize">
                          {assignment.assignment_type}
                        </Badge>
                        {assignment.is_ai_evaluation_enabled && (
                          <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                            <Sparkles className="w-3 h-3" />
                            AI Evaluation
                          </Badge>
                        )}
                        {!assignment.model_answer_url && assignment.is_ai_evaluation_enabled && (
                          <Badge variant="destructive" className="gap-1">
                            No Model Answer
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {assignment.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {format(new Date(assignment.due_date), "MMM d, h:mm a")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {assignment.submissions_count} submissions
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {assignment.evaluated_count} evaluated
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      {assignment.is_ai_evaluation_enabled && assignment.model_answer_url && 
                       assignment.submissions_count > assignment.evaluated_count && (
                        <Button 
                          size="sm" 
                          className="gap-1"
                          onClick={() => runAIEvaluation(assignment.id)}
                          disabled={isEvaluating === assignment.id}
                        >
                          {isEvaluating === assignment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Bot className="w-4 h-4" />
                              Run AI Eval
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openModelAnswerDialog(assignment)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Model Answer
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAssignment(assignment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Model Answer Dialog */}
      <Dialog open={modelAnswerDialogOpen} onOpenChange={setModelAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Configure Model Answer
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium mb-2">How AI Evaluation Works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI compares student answers against your model answer</li>
                <li>• Evaluates semantic similarity, factual accuracy, completeness</li>
                <li>• Generates suggested marks and detailed feedback</li>
                <li>• You can review and approve/modify AI suggestions</li>
              </ul>
            </div>

            <div>
              <Label>Model Answer / Expected Response</Label>
              <Textarea
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                placeholder="Enter the complete model answer here. Include all key concepts, important points, and expected content. The more comprehensive, the better the AI can evaluate..."
                rows={10}
                className="font-mono text-sm mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tip: Include key concepts, formulas, examples, and all expected points for accurate evaluation.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModelAnswerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveModelAnswer}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Save Model Answer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FacultyAssignments;
