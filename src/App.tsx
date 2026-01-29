import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentAuth from "./pages/auth/StudentAuth";
import FacultyAuth from "./pages/auth/FacultyAuth";
import ParentAuth from "./pages/auth/ParentAuth";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentResults from "./pages/student/StudentResults";
import StudentFees from "./pages/student/StudentFees";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentTransport from "./pages/student/StudentTransport";

// Faculty pages
import FacultySelectRole from "./pages/faculty/FacultySelectRole";
import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultyAttendance from "./pages/faculty/FacultyAttendance";
import FacultyAssignments from "./pages/faculty/FacultyAssignments";
import FacultyEvaluations from "./pages/faculty/FacultyEvaluations";
import FacultyMaterials from "./pages/faculty/FacultyMaterials";
import FacultyStudents from "./pages/faculty/FacultyStudents";
import FacultyAnalytics from "./pages/faculty/FacultyAnalytics";
import FacultyTimetable from "./pages/faculty/FacultyTimetable";
import FacultyNotifications from "./pages/faculty/FacultyNotifications";
import FacultyAnnouncements from "./pages/faculty/FacultyAnnouncements";

// Parent pages
import ParentDashboard from "./pages/parent/ParentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Auth routes */}
            <Route path="/auth/student" element={<StudentAuth />} />
            <Route path="/auth/faculty" element={<FacultyAuth />} />
            <Route path="/auth/parent" element={<ParentAuth />} />
            
            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/attendance" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            } />
            <Route path="/student/assignments" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentAssignments />
              </ProtectedRoute>
            } />
            <Route path="/student/results" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentResults />
              </ProtectedRoute>
            } />
            <Route path="/student/fees" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentFees />
              </ProtectedRoute>
            } />
            <Route path="/student/materials" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentMaterials />
              </ProtectedRoute>
            } />
            <Route path="/student/transport" element={
              <ProtectedRoute allowedUserTypes={["student"]}>
                <StudentTransport />
              </ProtectedRoute>
            } />

            {/* Faculty routes */}
            <Route path="/faculty/select-role" element={
              <ProtectedRoute allowedUserTypes={["faculty"]}>
                <FacultySelectRole />
              </ProtectedRoute>
            } />
            <Route path="/faculty/dashboard" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/faculty/attendance" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyAttendance />
              </ProtectedRoute>
            } />
            <Route path="/faculty/assignments" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyAssignments />
              </ProtectedRoute>
            } />
            <Route path="/faculty/evaluations" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyEvaluations />
              </ProtectedRoute>
            } />
            <Route path="/faculty/materials" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyMaterials />
              </ProtectedRoute>
            } />
            <Route path="/faculty/students" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyStudents />
              </ProtectedRoute>
            } />
            <Route path="/faculty/manage-students" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyStudents />
              </ProtectedRoute>
            } />
            <Route path="/faculty/manage-faculty" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyStudents />
              </ProtectedRoute>
            } />
            <Route path="/faculty/analytics" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/faculty/timetable" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyTimetable />
              </ProtectedRoute>
            } />
            <Route path="/faculty/notifications" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyNotifications />
              </ProtectedRoute>
            } />
            <Route path="/faculty/announcements" element={
              <ProtectedRoute allowedUserTypes={["faculty"]} requireRole>
                <FacultyAnnouncements />
              </ProtectedRoute>
            } />

            {/* Parent routes */}
            <Route path="/parent/dashboard" element={
              <ProtectedRoute allowedUserTypes={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
