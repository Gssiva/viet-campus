import { DashboardLayout, parentNavItems } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const ParentFees = () => {
  const { profile } = useAuth();

  const { data: student } = useQuery({
    queryKey: ["linked-student", profile?.linked_student_id],
    queryFn: async () => {
      if (!profile?.linked_student_id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*, courses(name)")
        .eq("id", profile.linked_student_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.linked_student_id,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["student-payments", profile?.linked_student_id],
    queryFn: async () => {
      if (!profile?.linked_student_id) return [];
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*, fee_structures(fee_type, amount)")
        .eq("student_id", profile.linked_student_id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.linked_student_id,
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["student-fee-structures", student?.course_id],
    queryFn: async () => {
      if (!student?.course_id) return [];
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("course_id", student.course_id);
      if (error) throw error;
      return data;
    },
    enabled: !!student?.course_id,
  });

  const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0);
  const totalDue = feeStructures.reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0);
  const balance = totalDue - totalPaid;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-500"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      navItems={parentNavItems}
      title="Fee Details"
      subtitle={student ? `${student.first_name} ${student.last_name}'s fee information` : "View fees"}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <CreditCard className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">₹{totalDue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-10 h-10 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">₹{Math.max(0, balance).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-muted-foreground">No payment records found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.receipt_number}</TableCell>
                      <TableCell>{payment.fee_structures?.fee_type}</TableCell>
                      <TableCell>₹{parseFloat(payment.amount_paid).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures.map((fee: any) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.fee_type}</TableCell>
                    <TableCell>₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                    <TableCell>{fee.academic_year}</TableCell>
                    <TableCell>{fee.due_date || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentFees;
