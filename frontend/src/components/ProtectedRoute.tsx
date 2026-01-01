import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

// Interface to handle both simple and long URL keys
interface CustomJwtPayload {
    exp: number;
    // Simple keys (what we want)
    role?: string; 
    isActive?: string;
    // Long keys (what .NET often forces)
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

        // 1. Debugging: Uncomment this to see exactly what your token has!
        // console.log("Decoded Token:", decoded);

        // 2. Check Expiration
        if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // 3. Extract Role (Check BOTH standard key and Microsoft URL)
        const userRole = 
            decoded.role || 
            decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        // 4. Extract Active Status (Check lowercase first)
        const isActive = decoded.isActive;

        // 5. Security Check: Is user active?
        // Note: We compare string "false" because it comes from a claim
        if (isActive && isActive.toLowerCase() === "false") {
            console.warn("Access Denied: Account is deactivated.");
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // 6. Security Check: Role Access
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