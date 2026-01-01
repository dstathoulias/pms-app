import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import TeamTasksPage from '../pages/user/TeamTasksPage';

// Helper interface for token claims
interface JwtPayload {
    role?: string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
}

const TeamRouteHandler = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        
        const userRole = decoded.role || 
                         decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        // TRAFFIC LOGIC:
        
        // 1. Team Leaders -> REDIRECT to their specific Dashboard
        if (userRole === "Team Leader") {
            return <Navigate to="/team/leader-dashboard" replace />;
        }

        // 2. Admins -> REDIRECT to Admin Dashboard
        if (userRole === "Admin") {
             return <Navigate to="/admin" replace />;
        }

        // 3. Regular Members -> Show the Team Board
        return <TeamTasksPage />;

    } catch (error) {
        return <Navigate to="/login" replace />;
    }
};

export default TeamRouteHandler;