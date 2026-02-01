import { DashboardLayout, accountsNavItems } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, CreditCard, IndianRupee } from "lucide-react";

const FacultyFeeReports = () => {
  const { data: payments = [] } = useQuery({
    queryKey: ["fee-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*, fee_structures(fee_type, amount, courses(name))")
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_type", "student");
      if (error) throw error;
      return data;
    },
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_structures").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalCollected = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount_paid), 0);
  const totalExpected = students.length * feeStructures.reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0);
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected * 100).toFixed(1) : 0;

  // Group by fee type
  const byFeeType = payments.reduce((acc: any, p: any) => {
    const type = p.fee_structures?.fee_type || "Other";
    acc[type] = (acc[type] || 0) + parseFloat(p.amount_paid);
    return acc;
  }, {});

  const feeTypeData = Object.entries(byFeeType).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  // Group by payment method
  const byMethod = payments.reduce((acc: any, p: any) => {
    const method = p.payment_method || "Other";
    acc[method] = (acc[method] || 0) + parseFloat(p.amount_paid);
    return acc;
  }, {});

  const methodData = Object.entries(byMethod).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number,
  }));

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <DashboardLayout
      navItems={accountsNavItems}
      title="Fee Reports"
      subtitle="Analytics and reports for fee collection"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <IndianRupee className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <CreditCard className="w-10 h-10 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">₹{totalExpected.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Expected Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-10 h-10 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{collectionRate}%</p>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Users className="w-10 h-10 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{payments.length}</p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Collection by Fee Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feeTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {methodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyFeeReports;
