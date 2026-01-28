import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Receipt,
  Download,
} from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FeeStructure {
  id: string;
  fee_type: string;
  amount: number;
  due_date: string | null;
  description: string | null;
  academic_year: string;
}

interface Payment {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string | null;
  transaction_id: string | null;
  receipt_number: string | null;
  status: string;
  fee_type: string;
}

const StudentFees = () => {
  const { profile } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.course_id) {
      fetchFeeData();
    }
  }, [profile]);

  const fetchFeeData = async () => {
    try {
      // Fetch fee structures for student's course
      const { data: structures } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("course_id", profile!.course_id)
        .eq("academic_year", "2025-26")
        .order("fee_type");

      // Fetch payment history
      const { data: paymentData } = await supabase
        .from("fee_payments")
        .select(`
          id,
          amount_paid,
          payment_date,
          payment_method,
          transaction_id,
          receipt_number,
          status,
          fee_structures (
            fee_type
          )
        `)
        .eq("student_id", profile!.id)
        .order("payment_date", { ascending: false });

      setFeeStructures(structures || []);
      setPayments(
        (paymentData || []).map((p: any) => ({
          id: p.id,
          amount_paid: p.amount_paid,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
          transaction_id: p.transaction_id,
          receipt_number: p.receipt_number,
          status: p.status,
          fee_type: p.fee_structures?.fee_type || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching fee data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalFees = feeStructures.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const pendingAmount = totalFees - totalPaid;
  const paidPercentage = totalFees > 0 ? (totalPaid / totalFees) * 100 : 0;

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Fee Management"
      subtitle="View fee details and payment history"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">₹{totalFees.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Fees</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">
                  ₹{totalPaid.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  pendingAmount > 0 ? "bg-destructive/10" : "bg-green-500/10"
                }`}
              >
                {pendingAmount > 0 ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div>
                <p
                  className={`text-lg font-bold ${
                    pendingAmount > 0 ? "text-destructive" : "text-green-500"
                  }`}
                >
                  ₹{pendingAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <GlassCard className="p-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Payment Progress</span>
            <span className="text-sm text-muted-foreground">
              {paidPercentage.toFixed(0)}% Complete
            </span>
          </div>
          <Progress value={paidPercentage} className="h-3" />
        </GlassCard>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Fee Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Fee Structure (2025-26)
            </h2>

            {feeStructures.length === 0 ? (
              <p className="text-muted-foreground">No fee structure found</p>
            ) : (
              <div className="space-y-3">
                {feeStructures.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium capitalize">{fee.fee_type} Fee</p>
                      {fee.description && (
                        <p className="text-xs text-muted-foreground">
                          {fee.description}
                        </p>
                      )}
                      {fee.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Due: {format(new Date(fee.due_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <p className="font-bold">₹{Number(fee.amount).toLocaleString()}</p>
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 mt-4">
                  <p className="font-semibold">Total</p>
                  <p className="font-bold text-primary">
                    ₹{totalFees.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Payment History
            </h2>

            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">
                          {payment.fee_type} Fee
                        </p>
                        <Badge
                          variant={
                            payment.status === "completed"
                              ? "default"
                              : payment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                        {payment.payment_method && ` • ${payment.payment_method}`}
                      </p>
                      {payment.receipt_number && (
                        <p className="text-xs text-muted-foreground">
                          Receipt: {payment.receipt_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">
                        ₹{Number(payment.amount_paid).toLocaleString()}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-1">
                        <Download className="w-3 h-3 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentFees;
