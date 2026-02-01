import { DashboardLayout, parentNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, AlertTriangle, Info, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ParentAnnouncements = () => {
  const { profile } = useAuth();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["parent-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles(first_name, last_name)")
        .eq("is_active", true)
        .or(`target_audience.eq.all,target_audience.eq.parents`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />High Priority</Badge>;
      case "normal":
        return <Badge variant="secondary"><Info className="w-3 h-3 mr-1" />Normal</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-6 h-6 text-destructive" />;
      default:
        return <Bell className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <DashboardLayout
      navItems={parentNavItems}
      title="Announcements"
      subtitle="Important updates from the college"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Card className="w-40">
            <CardContent className="p-4 text-center">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-xs text-muted-foreground">Announcements</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No announcements at this time.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any) => (
              <Card key={announcement.id} className={announcement.priority === "high" ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(announcement.priority)}
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          By {announcement.profiles?.first_name} {announcement.profiles?.last_name} • {format(new Date(announcement.created_at), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    {getPriorityBadge(announcement.priority)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  {announcement.expires_at && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Valid until: {format(new Date(announcement.expires_at), "dd MMM yyyy")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentAnnouncements;
