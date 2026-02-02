import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  GraduationCap,
  Building2,
  Calculator,
  Wrench,
  Eye,
} from "lucide-react";
import { DashboardLayout, hodNavItems, adminNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type FacultyRole = "administration" | "accounts" | "hod" | "teaching" | "non_teaching";

const roleConfig: Record<FacultyRole, { label: string; icon: React.ElementType; color: string }> = {
  administration: { label: "Administration", icon: Shield, color: "bg-red-500/10 text-red-500" },
  hod: { label: "HOD", icon: Building2, color: "bg-purple-500/10 text-purple-500" },
  teaching: { label: "Teaching", icon: GraduationCap, color: "bg-blue-500/10 text-blue-500" },
  accounts: { label: "Accounts", icon: Calculator, color: "bg-green-500/10 text-green-500" },
  non_teaching: { label: "Non-Teaching", icon: Wrench, color: "bg-amber-500/10 text-amber-500" },
};

const FacultyManageFaculty = () => {
  const { profile, activeRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [selectedRoles, setSelectedRoles] = useState<FacultyRole[]>([]);

  const getNavItems = () => {
    return activeRole === "administration" ? adminNavItems : hodNavItems;
  };

  // Fetch all faculty members
  const { data: facultyMembers = [], isLoading } = useQuery({
    queryKey: ["faculty-members", searchTerm, selectedDepartment],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          department:departments(id, name, code)
        `)
        .eq("user_type", "faculty")
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (selectedDepartment !== "all") {
        query = query.eq("department_id", selectedDepartment);
      }

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch faculty roles
  const { data: allFacultyRoles = [] } = useQuery({
    queryKey: ["all-faculty-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty_roles")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, code")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Get roles for a specific faculty member
  const getFacultyRoles = (userId: string): FacultyRole[] => {
    return allFacultyRoles
      .filter((r: any) => r.user_id === userId)
      .map((r: any) => r.role as FacultyRole);
  };

  // Update faculty roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: FacultyRole[] }) => {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from("faculty_roles")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Insert new roles
      if (roles.length > 0) {
        const rolesToInsert = roles.map(role => ({
          user_id: userId,
          role,
          department_id: editingFaculty?.department_id || null,
        }));

        const { error: insertError } = await supabase
          .from("faculty_roles")
          .insert(rolesToInsert);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-faculty-roles"] });
      setIsRoleDialogOpen(false);
      setEditingFaculty(null);
      setSelectedRoles([]);
      toast({ title: "Roles updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openRoleDialog = (faculty: any) => {
    setEditingFaculty(faculty);
    setSelectedRoles(getFacultyRoles(faculty.user_id));
    setIsRoleDialogOpen(true);
  };

  const handleRoleToggle = (role: FacultyRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveRoles = () => {
    if (editingFaculty) {
      updateRolesMutation.mutate({
        userId: editingFaculty.user_id,
        roles: selectedRoles,
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  // Stats
  const totalFaculty = facultyMembers.length;
  const facultyWithRoles = new Set(allFacultyRoles.map((r: any) => r.user_id)).size;
  const hodCount = allFacultyRoles.filter((r: any) => r.role === "hod").length;
  const teachingCount = allFacultyRoles.filter((r: any) => r.role === "teaching").length;

  return (
    <DashboardLayout
      navItems={getNavItems()}
      title="Faculty Management"
      subtitle="Manage faculty members and role assignments"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalFaculty}</p>
                  <p className="text-sm text-muted-foreground">Total Faculty</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <Building2 className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hodCount}</p>
                  <p className="text-sm text-muted-foreground">HODs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <GraduationCap className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teachingCount}</p>
                  <p className="text-sm text-muted-foreground">Teaching Faculty</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{facultyWithRoles}</p>
                  <p className="text-sm text-muted-foreground">With Roles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Faculty Table */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty Members</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : facultyMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No faculty found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faculty Member</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyMembers.map((faculty: any) => {
                    const roles = getFacultyRoles(faculty.user_id);
                    return (
                      <TableRow key={faculty.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={faculty.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(faculty.first_name, faculty.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{faculty.first_name} {faculty.last_name}</p>
                              <p className="text-sm text-muted-foreground">{faculty.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{faculty.employee_id || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{faculty.department?.code || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {roles.length > 0 ? (
                              roles.map(role => {
                                const config = roleConfig[role];
                                return (
                                  <Badge key={role} variant="secondary" className={config.color}>
                                    {config.label}
                                  </Badge>
                                );
                              })
                            ) : (
                              <span className="text-sm text-muted-foreground">No roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRoleDialog(faculty)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Manage Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Role Assignment Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={(open) => {
          setIsRoleDialogOpen(open);
          if (!open) {
            setEditingFaculty(null);
            setSelectedRoles([]);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Faculty Roles</DialogTitle>
            </DialogHeader>
            {editingFaculty && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={editingFaculty.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(editingFaculty.first_name, editingFaculty.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{editingFaculty.first_name} {editingFaculty.last_name}</p>
                    <p className="text-sm text-muted-foreground">{editingFaculty.employee_id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Assign Roles</Label>
                  {(Object.entries(roleConfig) as [FacultyRole, typeof roleConfig[FacultyRole]][]).map(([role, config]) => {
                    const Icon = config.icon;
                    return (
                      <div
                        key={role}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRoleToggle(role)}
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </div>
                    );
                  })}
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveRoles}
                  disabled={updateRolesMutation.isPending}
                >
                  {updateRolesMutation.isPending ? "Saving..." : "Save Roles"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Faculty Detail Dialog */}
        <Dialog open={!!selectedFaculty} onOpenChange={() => setSelectedFaculty(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Faculty Details</DialogTitle>
            </DialogHeader>
            {selectedFaculty && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedFaculty.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(selectedFaculty.first_name, selectedFaculty.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedFaculty.first_name} {selectedFaculty.last_name}
                    </h3>
                    <p className="text-muted-foreground">{selectedFaculty.employee_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedFaculty.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedFaculty.phone || "Not provided"}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FacultyManageFaculty;
