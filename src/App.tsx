import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/ui/PageLoader";

// Public pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));
const StudentAuth = lazy(() => import("./pages/auth/StudentAuth"));
const FacultyAuth = lazy(() => import("./pages/auth/FacultyAuth"));
const ParentAuth = lazy(() => import("./pages/auth/ParentAuth"));

// Student pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentAttendance = lazy(() => import("./pages/student/StudentAttendance"));
const StudentAssignments = lazy(() => import("./pages/student/StudentAssignments"));
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentFees = lazy(() => import("./pages/student/StudentFees"));
const StudentMaterials = lazy(() => import("./pages/student/StudentMaterials"));
const StudentTransport = lazy(() => import("./pages/student/StudentTransport"));

// Faculty pages
const FacultySelectRole = lazy(() => import("./pages/faculty/FacultySelectRole"));
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard"));
const FacultyAttendance = lazy(() => import("./pages/faculty/FacultyAttendance"));
const FacultyAssignments = lazy(() => import("./pages/faculty/FacultyAssignments"));
const FacultyEvaluations = lazy(() => import("./pages/faculty/FacultyEvaluations"));
const FacultyMaterials = lazy(() => import("./pages/faculty/FacultyMaterials"));
const FacultyStudents = lazy(() => import("./pages/faculty/FacultyStudents"));
const FacultyManageFaculty = lazy(() => import("./pages/faculty/FacultyManageFaculty"));
const FacultyAnalytics = lazy(() => import("./pages/faculty/FacultyAnalytics"));
const FacultyTimetable = lazy(() => import("./pages/faculty/FacultyTimetable"));
const FacultyNotifications = lazy(() => import("./pages/faculty/FacultyNotifications"));
const FacultyAnnouncements = lazy(() => import("./pages/faculty/FacultyAnnouncements"));
const FacultyDepartments = lazy(() => import("./pages/faculty/FacultyDepartments"));
const FacultyCourses = lazy(() => import("./pages/faculty/FacultyCourses"));
const FacultyFeeStructure = lazy(() => import("./pages/faculty/FacultyFeeStructure"));
const FacultyPayments = lazy(() => import("./pages/faculty/FacultyPayments"));
const FacultyFeeReports = lazy(() => import("./pages/faculty/FacultyFeeReports"));
const FacultyTransport = lazy(() => import("./pages/faculty/FacultyTransport"));
const FacultyDepartmentView = lazy(() => import("./pages/faculty/FacultyDepartmentView"));

// Parent pages
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));
const ParentAttendance = lazy(() => import("./pages/parent/ParentAttendance"));
const ParentResults = lazy(() => import("./pages/parent/ParentResults"));
const ParentFees = lazy(() => import("./pages/parent/ParentFees"));
const ParentAnnouncements = lazy(() => import("./pages/parent/ParentAnnouncements"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth routes */}
              <Route path="/auth/student" element={<StudentAuth />} />
              <Route path="/auth/faculty" element={<FacultyAuth />} />
              <Route path="/auth/parent" element={<ParentAuth />} />
              
              {/* Settings */}
              <Route path="/settings" element={
                <ProtectedRoute allowedUserTypes={["student", "faculty", "parent"]}>
                  <Settings />
                </ProtectedRoute>
              } />
              
              {/* Student routes */}
              <Route path="/student/dashboard" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/attendance" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentAttendance /></ProtectedRoute>} />
              <Route path="/student/assignments" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentAssignments /></ProtectedRoute>} />
              <Route path="/student/results" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentResults /></ProtectedRoute>} />
              <Route path="/student/fees" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentFees /></ProtectedRoute>} />
              <Route path="/student/materials" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentMaterials /></ProtectedRoute>} />
              <Route path="/student/transport" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentTransport /></ProtectedRoute>} />

              {/* Faculty routes */}
              <Route path="/faculty/select-role" element={<ProtectedRoute allowedUserTypes={["faculty"]}><FacultySelectRole /></ProtectedRoute>} />
              <Route path="/faculty/dashboard" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyDashboard /></ProtectedRoute>} />
              <Route path="/faculty/attendance" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyAttendance /></ProtectedRoute>} />
              <Route path="/faculty/assignments" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyAssignments /></ProtectedRoute>} />
              <Route path="/faculty/evaluations" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyEvaluations /></ProtectedRoute>} />
              <Route path="/faculty/materials" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyMaterials /></ProtectedRoute>} />
              <Route path="/faculty/students" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyStudents /></ProtectedRoute>} />
              <Route path="/faculty/manage-students" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyStudents /></ProtectedRoute>} />
              <Route path="/faculty/manage-faculty" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyManageFaculty /></ProtectedRoute>} />
              <Route path="/faculty/analytics" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyAnalytics /></ProtectedRoute>} />
              <Route path="/faculty/timetable" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyTimetable /></ProtectedRoute>} />
              <Route path="/faculty/notifications" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyNotifications /></ProtectedRoute>} />
              <Route path="/faculty/announcements" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyAnnouncements /></ProtectedRoute>} />
              <Route path="/faculty/departments" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyDepartments /></ProtectedRoute>} />
              <Route path="/faculty/department" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyDepartmentView /></ProtectedRoute>} />
              <Route path="/faculty/courses" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyCourses /></ProtectedRoute>} />
              <Route path="/faculty/fee-structure" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyFeeStructure /></ProtectedRoute>} />
              <Route path="/faculty/payments" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyPayments /></ProtectedRoute>} />
              <Route path="/faculty/fee-reports" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyFeeReports /></ProtectedRoute>} />
              <Route path="/faculty/transport" element={<ProtectedRoute allowedUserTypes={["faculty"]} requireRole><FacultyTransport /></ProtectedRoute>} />

              {/* Parent routes */}
              <Route path="/parent/dashboard" element={<ProtectedRoute allowedUserTypes={["parent"]}><ParentDashboard /></ProtectedRoute>} />
              <Route path="/parent/attendance" element={<ProtectedRoute allowedUserTypes={["parent"]}><ParentAttendance /></ProtectedRoute>} />
              <Route path="/parent/results" element={<ProtectedRoute allowedUserTypes={["parent"]}><ParentResults /></ProtectedRoute>} />
              <Route path="/parent/fees" element={<ProtectedRoute allowedUserTypes={["parent"]}><ParentFees /></ProtectedRoute>} />
              <Route path="/parent/announcements" element={<ProtectedRoute allowedUserTypes={["parent"]}><ParentAnnouncements /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
