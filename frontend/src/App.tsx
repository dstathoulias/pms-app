import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Auth ---
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';

// --- User/Member ---
import Dashboard from './pages/user/Dashboard';
import UserTasksPage from './pages/user/UserTasksPage';
import TaskDetailsPage from './pages/user/TaskDetailsPage'; 
import TaskSearchPage from './pages/user/TaskSearchPage'; 

// --- Leader ---
import TeamLeaderDashboard from './pages/leader/TeamLeaderDashboard'; 
import TeamManagementPage from './pages/leader/TeamManagementPage'; 
import LeaderTaskManagementPage from './pages/leader/LeaderTaskManagementPage';

// --- Admin ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminTeamsPage from './pages/admin/AdminTeamsPage';

// --- Components ---
import ProtectedRoute from './components/ProtectedRoute';
import TeamRouteHandler from './components/TeamRouteHandler';
import MainLayout from './components/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        {/* PUBLIC ROUTES*/}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        

        {/* PROTECTED ROUTES*/}
  
        
        <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
                
                {/* --- Common / Member Routes --- */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-tasks" element={<UserTasksPage />} />
                <Route path="/teams" element={<TeamRouteHandler />} />
                <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
                <Route path="/tasks/search" element={<TaskSearchPage />} />

                {/* --- Leader Routes --- */}
                <Route element={<ProtectedRoute allowedRoles={['Team Leader', 'Admin']} />}>
                    <Route path="/team/leader-dashboard" element={<TeamLeaderDashboard />} />
                    <Route path="/team/manage" element={<TeamManagementPage />} />
                    <Route path="/team/tasks-manage" element={<LeaderTaskManagementPage />} />
                </Route>

                {/* --- Admin Routes --- */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/teams" element={<AdminTeamsPage />} />
                </Route>

            </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;