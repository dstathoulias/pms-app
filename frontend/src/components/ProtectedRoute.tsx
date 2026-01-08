import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

// Interface to handle both simple and long URL keys
interface CustomJwtPayload {
    exp: number;
    // Simple keys
    role?: string; 
    isActive?: string;
    // Long keys
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        const currentTime = Date.now() / 1000;

        // Check expiration
        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // Get role
        const userRole = 
            decoded.role || 
            decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        // Get active status
        const isActive = decoded.isActive;

        // Check if user is active
        if (isActive && isActive.toLowerCase() === "false") {
            console.warn("Access Denied: Account is deactivated.");
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // Check if role has access
        if (allowedRoles) {
            if (!userRole || !allowedRoles.includes(userRole)) {
                console.warn(`Access Denied: Role '${userRole}' is not allowed here.`);
                return <Navigate to="/dashboard" replace />;
            }
        }

        return <Outlet />;

    } catch (error) {
        console.error("Token decode failed:", error);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;