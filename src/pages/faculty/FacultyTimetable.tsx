import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Save,
  Loader2,
  BookOpen,
  User,
  MapPin,
  Coffee,
  Utensils,
} from "lucide-react";
import { DashboardLayout, adminNavItems, hodNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  { start: "09:00", end: "09:50", label: "9:00 - 9:50" },
  { start: "09:50", end: "10:40", label: "9:50 - 10:40" },
  { start: "10:50", end: "11:40", label: "10:50 - 11:40" },
  { start: "11:40", end: "12:30", label: "11:40 - 12:30" },
  { start: "12:30", end: "13:20", label: "12:30 - 1:20 (Lunch)", isBreak: true },
  { start: "13:20", end: "14:10", label: "1:20 - 2:10" },
  { start: "14:10", end: "15:00", label: "2:10 - 3:00" },
  { start: "15:10", end: "16:00", label: "3:10 - 4:00" },
  { start: "16:00", end: "16:50", label: "4:00 - 4:50" },
];

const FacultyTimetable = () => {
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; slot: number } | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    subjectId: "",
    facultyId: "",
    roomNumber: "",
    slotType: "lecture",
  });

  const getNavItems = () => {
    return activeRole === "administration" ? adminNavItems : hodNavItems;
  };

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, code, total_semesters");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subjects for selected course and semester
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", selectedCourse, selectedSemester],
    queryFn: async () => {
      if (!selectedCourse) return [];
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, is_lab")
        .eq("course_id", selectedCourse)
        .eq("semester", parseInt(selectedSemester));
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourse,
  });

  // Fetch faculty members
  const { data: faculty = [] } = useQuery({
    queryKey: ["faculty-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, employee_id")
        .eq("user_type", "faculty")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch existing timetable
  const { data: timetable } = useQuery({
    queryKey: ["timetable", selectedCourse, selectedSemester, selectedSection],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const { data, error } = await supabase
        .from("timetables")
        .select(`
          id,
          timetable_slots(
            id,
            day_of_week,
            start_time,
            end_time,
            room_number,
            slot_type,
            subject:subjects(id, name, code),
            faculty:profiles(id, first_name, last_name)
          )
        `)
        .eq("course_id", selectedCourse)
        .eq("semester", parseInt(selectedSemester))
        .eq("section", selectedSection)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourse,
  });

  // Generate AI timetable via edge function
  const generateTimetable = async () => {
    if (!selectedCourse || !profile?.id) {
      toast({ title: "Error", description: "Please select a course first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      // Deactivate any existing timetable for this course/semester/section
      await supabase
        .from("timetables")
        .update({ is_active: false })
        .eq("course_id", selectedCourse)
        .eq("semester", parseInt(selectedSemester))
        .eq("section", selectedSection)
        .eq("is_active", true);

      // Call the edge function
      const { data: aiResult, error: fnError } = await supabase.functions.invoke("generate-timetable", {
        body: {
          courseId: selectedCourse,
          semester: parseInt(selectedSemester),
          section: selectedSection,
          academicYear: "2025-26",
          subjects: subjects.map((s: any) => ({
            id: s.id,
            code: s.code,
            name: s.name,
            credits: 3,
            isLab: s.is_lab,
          })),
          faculty: faculty.map((f: any) => ({
            id: f.id,
            name: `${f.first_name} ${f.last_name}`,
            employeeId: f.employee_id || "",
          })),
        },
      });

      if (fnError) throw fnError;
      if (!aiResult?.success) throw new Error(aiResult?.error || "AI generation failed");

      console.log("AI timetable generated via:", aiResult.method);

      // Create timetable record
      const { data: newTimetable, error: timetableError } = await supabase
        .from("timetables")
        .insert({
          course_id: selectedCourse,
          semester: parseInt(selectedSemester),
          section: selectedSection,
          academic_year: "2025-26",
          generated_by: profile.id,
        })
        .select()
        .single();

      if (timetableError) throw timetableError;

      // Map AI slots to DB format
      const generatedSlots = aiResult.timetable?.slots || [];
      const dbSlots = generatedSlots.map((slot: any) => ({
        timetable_id: newTimetable.id,
        day_of_week: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
        slot_type: slot.type || "lecture",
        room_number: slot.room || null,
        subject_id: slot.subjectId || null,
        faculty_id: slot.facultyId || null,
      }));

      if (dbSlots.length > 0) {
        const { error: slotsError } = await supabase
          .from("timetable_slots")
          .insert(dbSlots);
        if (slotsError) throw slotsError;
      }

      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      toast({ title: "Success", description: `Timetable generated via ${aiResult.method} method!` });
    } catch (error: any) {
      console.error("Error generating timetable:", error);
      toast({ title: "Error", description: error.message || "Failed to generate timetable", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save slot update
  const updateSlot = useMutation({
    mutationFn: async (data: { slotId: string; updates: any }) => {
      const { error } = await supabase
        .from("timetable_slots")
        .update(data.updates)
        .eq("id", data.slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setIsSlotDialogOpen(false);
      toast({ title: "Success", description: "Slot updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update slot", variant: "destructive" });
    },
  });

  const getSlotData = (dayIndex: number, timeSlot: typeof TIME_SLOTS[0]) => {
    if (!timetable?.timetable_slots) return null;
    return timetable.timetable_slots.find(
      (s: any) => s.day_of_week === dayIndex && s.start_time?.substring(0, 5) === timeSlot.start
    );
  };

  const getSlotColor = (slotType: string) => {
    switch (slotType) {
      case "lecture": return "bg-primary/10 border-primary/20 hover:bg-primary/20";
      case "lab": return "bg-accent/10 border-accent/20 hover:bg-accent/20";
      case "lunch": return "bg-yellow-500/10 border-yellow-500/20";
      case "break": return "bg-muted border-border";
      default: return "bg-muted/50 border-dashed";
    }
  };

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Timetable Management"
      subtitle="Generate and manage class schedules with AI assistance"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A", "B", "C", "D"].map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1" />
              
              <Button
                onClick={generateTimetable}
                disabled={!selectedCourse || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Schedule
                {timetable && (
                  <Badge variant="outline" className="ml-2">
                    Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    <div className="p-2 text-center font-medium text-muted-foreground">Time</div>
                    {DAYS.map((day) => (
                      <div key={day} className="p-2 text-center font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Time slots */}
                  {TIME_SLOTS.map((timeSlot, slotIndex) => (
                    <div key={slotIndex} className="grid grid-cols-7 gap-2 mb-2">
                      <div className="p-2 text-center text-sm text-muted-foreground flex items-center justify-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {timeSlot.label}
                      </div>
                      {DAYS.map((day, dayIndex) => {
                        const slotData = getSlotData(dayIndex, timeSlot);
                        
                        if (timeSlot.isBreak) {
                          return (
                            <div
                              key={`${dayIndex}-${slotIndex}`}
                              className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center"
                            >
                              <Utensils className="w-4 h-4 text-yellow-600 mr-2" />
                              <span className="text-sm text-yellow-700">Lunch Break</span>
                            </div>
                          );
                        }
                        
                        return (
                          <motion.div
                            key={`${dayIndex}-${slotIndex}`}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${getSlotColor(slotData?.slot_type || "empty")}`}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => {
                              if (slotData && timetable) {
                                setSelectedSlot({ day: dayIndex, slot: slotIndex });
                                setSlotFormData({
                                  subjectId: slotData.subject?.id || "",
                                  facultyId: slotData.faculty?.id || "",
                                  roomNumber: slotData.room_number || "",
                                  slotType: slotData.slot_type || "lecture",
                                });
                                setIsSlotDialogOpen(true);
                              }
                            }}
                          >
                            {slotData?.subject ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span className="text-xs font-medium truncate">
                                    {slotData.subject.code}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {slotData.subject.name}
                                </p>
                                {slotData.faculty && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    {slotData.faculty.first_name}
                                  </div>
                                )}
                                {slotData.room_number && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {slotData.room_number}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border border-primary/40" />
                  <span className="text-sm">Lecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-accent/20 border border-accent/40" />
                  <span className="text-sm">Lab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/40" />
                  <span className="text-sm">Break</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedCourse && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Course</h3>
              <p className="text-muted-foreground">
                Choose a course, semester, and section to view or generate a timetable
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Slot Dialog */}
        <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Time Slot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={slotFormData.subjectId}
                  onValueChange={(v) => setSlotFormData({ ...slotFormData, subjectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select
                  value={slotFormData.facultyId}
                  onValueChange={(v) => setSlotFormData({ ...slotFormData, facultyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.first_name} {f.last_name} ({f.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input
                    value={slotFormData.roomNumber}
                    onChange={(e) => setSlotFormData({ ...slotFormData, roomNumber: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slot Type</Label>
                  <Select
                    value={slotFormData.slotType}
                    onValueChange={(v) => setSlotFormData({ ...slotFormData, slotType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSlotDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedSlot && timetable) {
                      const slot = getSlotData(selectedSlot.day, TIME_SLOTS[selectedSlot.slot]);
                      if (slot) {
                        updateSlot.mutate({
                          slotId: slot.id,
                          updates: {
                            subject_id: slotFormData.subjectId || null,
                            faculty_id: slotFormData.facultyId || null,
                            room_number: slotFormData.roomNumber || null,
                            slot_type: slotFormData.slotType,
                          },
                        });
                      }
                    }
                  }}
                  disabled={updateSlot.isPending}
                >
                  {updateSlot.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FacultyTimetable;
