import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  Clock,
  Users,
  Building2,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout, hodNavItems, adminNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const FacultyAnnouncements = () => {
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    targetAudience: "all",
    targetDepartmentId: "",
    expiresAt: "",
    isActive: true,
  });

  const getNavItems = () => {
    return activeRole === "administration" ? adminNavItems : hodNavItems;
  };

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          author:profiles!announcements_author_id_fkey(first_name, last_name),
          department:departments(name, code)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update announcement
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (!profile?.id) throw new Error("Not authenticated");
      
      const payload = {
        title: data.title,
        content: data.content,
        priority: data.priority,
        target_audience: data.targetAudience,
        target_department_id: data.targetDepartmentId || null,
        expires_at: data.expiresAt || null,
        is_active: data.isActive,
        author_id: profile.id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      resetForm();
      toast({ title: "Success", description: editingAnnouncement ? "Announcement updated" : "Announcement created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete announcement
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Success", description: "Announcement deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      targetAudience: "all",
      targetDepartmentId: "",
      expiresAt: "",
      isActive: true,
    });
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: announcement.target_audience,
      targetDepartmentId: announcement.target_department_id || "",
      expiresAt: announcement.expires_at ? format(new Date(announcement.expires_at), "yyyy-MM-dd'T'HH:mm") : "",
      isActive: announcement.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...formData, id: editingAnnouncement?.id });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "urgent": return "destructive";
      case "normal": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case "all": return <Globe className="w-4 h-4" />;
      case "faculty": return <Users className="w-4 h-4" />;
      case "students": return <Users className="w-4 h-4" />;
      case "department": return <Building2 className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Announcements"
      subtitle="Create and manage announcements for the institution"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Badge variant="outline">{announcements.length} Total</Badge>
            <Badge variant="default">{announcements.filter((a: any) => a.is_active).length} Active</Badge>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAnnouncement(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Announcement content..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={formData.targetAudience} onValueChange={(v) => setFormData({ ...formData, targetAudience: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="faculty">Faculty Only</SelectItem>
                        <SelectItem value="parents">Parents Only</SelectItem>
                        <SelectItem value="department">Specific Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {formData.targetAudience === "department" && (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={formData.targetDepartmentId} onValueChange={(v) => setFormData({ ...formData, targetDepartmentId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.code} - {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : editingAnnouncement ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
              <p className="text-muted-foreground mb-4">Create your first announcement to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={!announcement.is_active ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-xl h-fit ${
                        announcement.priority === "urgent" || announcement.priority === "high"
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                      }`}>
                        {announcement.priority === "urgent" ? (
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        ) : (
                          <Megaphone className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{announcement.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(announcement.created_at), "MMM d, yyyy 'at' h:mm a")}
                              <span>•</span>
                              <span>By {announcement.author?.first_name} {announcement.author?.last_name}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(announcement.priority)}>
                              {announcement.priority}
                            </Badge>
                            {!announcement.is_active && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getAudienceIcon(announcement.target_audience)}
                            <span className="text-sm text-muted-foreground capitalize">
                              {announcement.target_audience === "department"
                                ? announcement.department?.name
                                : announcement.target_audience}
                            </span>
                            {announcement.expires_at && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">
                                  Expires {format(new Date(announcement.expires_at), "MMM d, yyyy")}
                                </span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this announcement?")) {
                                  deleteMutation.mutate(announcement.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyAnnouncements;
