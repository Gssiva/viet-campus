import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  Send,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import { DashboardLayout, teachingNavItems, hodNavItems, adminNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const FacultyNotifications = () => {
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendingAttendance, setIsSendingAttendance] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement",
    targetType: "all_students",
  });

  const getNavItems = () => {
    switch (activeRole) {
      case "administration": return adminNavItems;
      case "hod": return hodNavItems;
      default: return teachingNavItems;
    }
  };

  // Fetch notification logs
  const { data: notificationLogs = [], isLoading } = useQuery({
    queryKey: ["notification-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_notification_logs")
        .select(`
          *,
          student:profiles!attendance_notification_logs_student_id_fkey(first_name, last_name, roll_number)
        `)
        .order("notification_sent_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch today's attendance for notification
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          student:profiles!attendance_student_id_fkey(
            id,
            first_name,
            last_name,
            roll_number,
            linked_student_id
          ),
          subject:subjects(name, code)
        `)
        .eq("date", today);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch students with parents
  const { data: studentsWithParents = [] } = useQuery({
    queryKey: ["students-with-parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, roll_number")
        .eq("user_type", "student")
        .eq("is_active", true);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Send daily attendance notifications
  const sendAttendanceNotifications = async () => {
    setIsSendingAttendance(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const notificationsSent: any[] = [];

      // Group attendance by student
      const studentAttendance = new Map<string, { present: number; absent: number; total: number }>();
      
      todayAttendance.forEach((record: any) => {
        const studentId = record.student?.id;
        if (studentId) {
          const current = studentAttendance.get(studentId) || { present: 0, absent: 0, total: 0 };
          current.total++;
          if (record.status === "present") current.present++;
          else if (record.status === "absent") current.absent++;
          studentAttendance.set(studentId, current);
        }
      });

      // Create notifications for each student
      for (const [studentId, stats] of studentAttendance.entries()) {
        const student = studentsWithParents.find((s: any) => s.id === studentId);
        if (!student) continue;

        // Find parent profile
        const { data: parentProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("linked_student_id", studentId)
          .eq("user_type", "parent")
          .maybeSingle();

        const status = stats.absent > 0 ? "absent" : "present";
        const message = stats.absent > 0
          ? `Your ward ${student.first_name} ${student.last_name} was absent in ${stats.absent} class(es) today.`
          : `Your ward ${student.first_name} ${student.last_name} was present in all ${stats.total} class(es) today.`;

        // Create notification for student
        await supabase.from("notifications").insert({
          user_id: studentId,
          title: "Daily Attendance Summary",
          message: `You were ${status} in ${stats.absent > 0 ? stats.absent + " class(es)" : "all classes"} today.`,
          notification_type: "attendance",
          is_sent: true,
          sent_at: new Date().toISOString(),
        });

        // Create notification for parent if exists
        if (parentProfile) {
          await supabase.from("notifications").insert({
            user_id: parentProfile.id,
            title: "Ward's Attendance Update",
            message,
            notification_type: "attendance",
            is_sent: true,
            sent_at: new Date().toISOString(),
          });
        }

        // Log the notification
        await supabase.from("attendance_notification_logs").insert({
          student_id: studentId,
          parent_id: parentProfile?.id || null,
          attendance_date: today,
          status,
        });

        notificationsSent.push({ studentId, status });
      }

      queryClient.invalidateQueries({ queryKey: ["notification-logs"] });
      toast({
        title: "Notifications Sent",
        description: `Sent ${notificationsSent.length} attendance notifications to students and parents.`,
      });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setIsSendingAttendance(false);
    }
  };

  // Send custom notification
  const sendNotification = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Get target users based on type
      let targetUsers: any[] = [];
      
      if (data.targetType === "all_students") {
        const { data: students } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_type", "student")
          .eq("is_active", true);
        targetUsers = students || [];
      } else if (data.targetType === "all_parents") {
        const { data: parents } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_type", "parent")
          .eq("is_active", true);
        targetUsers = parents || [];
      } else if (data.targetType === "all") {
        const { data: all } = await supabase
          .from("profiles")
          .select("id")
          .eq("is_active", true);
        targetUsers = all || [];
      }

      // Create notifications for all target users
      const notifications = targetUsers.map((user: any) => ({
        user_id: user.id,
        title: data.title,
        message: data.message,
        notification_type: data.type,
        is_sent: true,
        sent_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      return { count: notifications.length };
    },
    onSuccess: (data) => {
      setIsDialogOpen(false);
      setFormData({ title: "", message: "", type: "announcement", targetType: "all_students" });
      toast({
        title: "Notification Sent",
        description: `Successfully sent to ${data.count} users.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    sendNotification.mutate(formData);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "attendance": return <Calendar className="w-4 h-4" />;
      case "assignment": return <MessageSquare className="w-4 h-4" />;
      case "fee": return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Notifications Center"
      subtitle="Send and manage notifications to students and parents"
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={sendAttendanceNotifications}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Send Attendance Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Notify students & parents about today's attendance
                  </p>
                </div>
                {isSendingAttendance && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10">
                      <Plus className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Custom Notification</h3>
                      <p className="text-sm text-muted-foreground">
                        Send a custom message to users
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Custom Notification</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Enter your message..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="fee">Fee Related</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Send To</Label>
                    <Select value={formData.targetType} onValueChange={(v) => setFormData({ ...formData, targetType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_students">All Students</SelectItem>
                        <SelectItem value="all_parents">All Parents</SelectItem>
                        <SelectItem value="all">Everyone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendNotification.isPending}>
                    {sendNotification.isPending ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">{notificationLogs.length}</h3>
                  <p className="text-sm text-muted-foreground">
                    Notifications sent today
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Attendance Summary
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">
                  {todayAttendance.filter((a: any) => a.status === "present").length}
                </p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">
                  {todayAttendance.filter((a: any) => a.status === "absent").length}
                </p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-600">
                  {todayAttendance.filter((a: any) => a.status === "late").length}
                </p>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notification Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Notification Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notificationLogs.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notificationLogs.map((log: any) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`p-2 rounded-full ${
                      log.status === "present" ? "bg-green-500/10" : "bg-destructive/10"
                    }`}>
                      {log.status === "present" ? (
                        <CheckCircle className={`w-4 h-4 text-green-500`} />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {log.student?.first_name} {log.student?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.student?.roll_number} • {log.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === "present" ? "default" : "destructive"}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.notification_sent_at), "h:mm a")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyNotifications;
