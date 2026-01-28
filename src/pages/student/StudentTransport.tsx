import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bus, MapPin, Clock, CreditCard, CheckCircle } from "lucide-react";
import { DashboardLayout, studentNavItems } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface TransportEnrollment {
  id: string;
  route_id: string;
  stop_name: string;
  academic_year: string;
  is_active: boolean;
  route: {
    route_number: string;
    route_name: string;
    fee_per_semester: number;
    stops: any[];
  };
}

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  fee_per_semester: number;
  stops: unknown;
  is_active: boolean;
}

const StudentTransport = () => {
  const { profile } = useAuth();
  const [enrollment, setEnrollment] = useState<TransportEnrollment | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchTransportData();
    }
  }, [profile]);

  const fetchTransportData = async () => {
    try {
      // Fetch student's transport enrollment
      const { data: enrollmentData } = await supabase
        .from("transport_enrollments")
        .select(`
          id,
          route_id,
          stop_name,
          academic_year,
          is_active,
          transport_routes (
            route_number,
            route_name,
            fee_per_semester,
            stops
          )
        `)
        .eq("student_id", profile!.id)
        .eq("is_active", true)
        .single();

      if (enrollmentData) {
        setEnrollment({
          id: enrollmentData.id,
          route_id: enrollmentData.route_id,
          stop_name: enrollmentData.stop_name,
          academic_year: enrollmentData.academic_year,
          is_active: enrollmentData.is_active,
          route: {
            route_number: (enrollmentData.transport_routes as any)?.route_number,
            route_name: (enrollmentData.transport_routes as any)?.route_name,
            fee_per_semester: (enrollmentData.transport_routes as any)?.fee_per_semester,
            stops: (enrollmentData.transport_routes as any)?.stops || [],
          },
        });
      }

      // Fetch all available routes
      const { data: routesData } = await supabase
        .from("transport_routes")
        .select("*")
        .eq("is_active", true)
        .order("route_number");

      setRoutes(routesData || []);
    } catch (error) {
      console.error("Error fetching transport data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      navItems={studentNavItems}
      title="Transport"
      subtitle="Manage your transport enrollment"
    >
      {/* Current Enrollment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Your Transport Details
          </h2>

          {enrollment ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Bus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="text-xl font-bold">
                      {enrollment.route.route_number}
                    </p>
                    <p className="text-sm">{enrollment.route.route_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your Stop</p>
                    <p className="font-medium">{enrollment.stop_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fee per Semester
                    </p>
                    <p className="font-medium">
                      ₹{Number(enrollment.route.fee_per_semester).toLocaleString()}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="default"
                  className="w-fit flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Active for {enrollment.academic_year}
                </Badge>
              </div>

              {/* Route Stops */}
              <div>
                <h3 className="font-medium mb-3">Route Stops</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.isArray(enrollment.route.stops) &&
                    enrollment.route.stops.map((stop: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          (typeof stop === 'string' ? stop : stop.name) === enrollment.stop_name
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/30"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            (typeof stop === 'string' ? stop : stop.name) === enrollment.stop_name
                              ? "bg-primary"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span className="text-sm">
                          {typeof stop === 'string' ? stop : stop.name}
                        </span>
                        {typeof stop === 'object' && stop.time && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {stop.time}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Not Enrolled</p>
              <p className="text-muted-foreground">
                You are not currently enrolled in transport services. Contact the
                accounts office to enroll.
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Available Routes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold mb-4">Available Routes</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route, index) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <GlassCard className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Route {route.route_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {route.route_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Array.isArray(route.stops) ? route.stops.length : 0} stops
                  </span>
                  <span className="font-medium">
                    ₹{Number(route.fee_per_semester).toLocaleString()}/sem
                  </span>
                </div>

                {enrollment?.route_id === route.id && (
                  <Badge className="mt-3" variant="secondary">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Your Route
                  </Badge>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentTransport;
