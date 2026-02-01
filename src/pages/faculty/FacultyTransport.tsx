import { DashboardLayout, accountsNavItems } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Bus, MapPin } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const FacultyTransport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [formData, setFormData] = useState({
    route_name: "",
    route_number: "",
    fee_per_semester: 0,
    stops: "",
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["transport-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_routes")
        .select("*")
        .order("route_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["transport-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_enrollments")
        .select("route_id");
      if (error) throw error;
      return data;
    },
  });

  const enrollmentCounts = enrollments.reduce((acc: Record<string, number>, e: any) => {
    acc[e.route_id] = (acc[e.route_id] || 0) + 1;
    return acc;
  }, {});

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const stopsArray = data.stops.split(",").map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from("transport_routes").insert({
        route_name: data.route_name,
        route_number: data.route_number,
        fee_per_semester: data.fee_per_semester,
        stops: stopsArray,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Route created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof formData) => {
      const { id, stops, ...rest } = data;
      const stopsArray = stops.split(",").map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from("transport_routes").update({
        ...rest,
        stops: stopsArray,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
      setIsOpen(false);
      setEditingRoute(null);
      resetForm();
      toast({ title: "Route updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transport_routes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transport-routes"] });
      toast({ title: "Route deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      route_name: "",
      route_number: "",
      fee_per_semester: 0,
      stops: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoute) {
      updateMutation.mutate({ id: editingRoute.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (route: any) => {
    setEditingRoute(route);
    const stopsString = Array.isArray(route.stops) ? route.stops.join(", ") : "";
    setFormData({
      route_name: route.route_name,
      route_number: route.route_number,
      fee_per_semester: route.fee_per_semester,
      stops: stopsString,
    });
    setIsOpen(true);
  };

  return (
    <DashboardLayout
      navItems={accountsNavItems}
      title="Transport Management"
      subtitle="Manage bus routes and transport fees"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Card className="w-40">
              <CardContent className="p-4 text-center">
                <Bus className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{routes.length}</p>
                <p className="text-xs text-muted-foreground">Routes</p>
              </CardContent>
            </Card>
            <Card className="w-40">
              <CardContent className="p-4 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-xs text-muted-foreground">Enrollments</p>
              </CardContent>
            </Card>
          </div>
          
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingRoute(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoute ? "Edit" : "Add"} Route</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="route_number">Route Number</Label>
                  <Input
                    id="route_number"
                    value={formData.route_number}
                    onChange={(e) => setFormData({ ...formData, route_number: e.target.value })}
                    placeholder="e.g., R1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="route_name">Route Name</Label>
                  <Input
                    id="route_name"
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                    placeholder="e.g., City Center Route"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fee">Fee per Semester (₹)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={formData.fee_per_semester}
                    onChange={(e) => setFormData({ ...formData, fee_per_semester: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stops">Stops (comma-separated)</Label>
                  <Input
                    id="stops"
                    value={formData.stops}
                    onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                    placeholder="Stop 1, Stop 2, Stop 3"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingRoute ? "Update" : "Create"} Route
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Routes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Stops</TableHead>
                    <TableHead>Fee/Semester</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route: any) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.route_number}</TableCell>
                      <TableCell>{route.route_name}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(route.stops) && route.stops.slice(0, 3).map((stop: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{stop}</Badge>
                          ))}
                          {Array.isArray(route.stops) && route.stops.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{route.stops.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>₹{parseFloat(route.fee_per_semester).toLocaleString()}</TableCell>
                      <TableCell>{enrollmentCounts[route.id] || 0}</TableCell>
                      <TableCell>
                        <Badge className={route.is_active ? "bg-green-500" : "bg-gray-500"}>
                          {route.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(route)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(route.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FacultyTransport;
