import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import AddCourse from "./pages/AddCourse";
import Enrollments from "./pages/Enrollments";
import AdminPanel from "./pages/AdminPanel";
import EditCourse from "./pages/EditCourse";
import CourseReviews from "./pages/CourseReviews";
import Reports from "./pages/Reports";
import AddTest from "./pages/AddTest";
import TeacherCourses from "./pages/TeacherCourses";
import Announcements from "./pages/Announcements";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={["admin", "teacher", "student"]}>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-course"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AddCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-course/:id"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <EditCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enrollments"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Enrollments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-test"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AddTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course-reviews"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <CourseReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-courses"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherCourses />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;