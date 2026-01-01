import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [role, setRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            const userRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            setRole(userRole || 'Member');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Helper: Navigation Item
    // REMOVED: 'icon' prop
    const NavItem = ({ label, path }: { label: string, path: string }) => {
        const isActive = location.pathname === path;
        
        return (
            <li 
                onClick={() => navigate(path)}
                className={`
                    flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all mb-2 font-medium
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' // Active: Blue bg, White text
                        : 'text-gray-600 hover:bg-blue-200 hover:text-blue-900' // Inactive: Gray text, Light Blue hover
                    }
                `}
                title={collapsed ? label : ''}
            >
                {/* LOGIC: Since icons are gone, when collapsed (w-20), 
                   we show the first letter of the label so the bar isn't empty. 
                */}
                {collapsed ? (
                    <span className="font-bold text-lg w-full text-center">{label.charAt(0)}</span>
                ) : (
                    <span className="whitespace-nowrap">{label}</span>
                )}
            </li>
        );
    };

    return (
        <div className={`
            h-screen flex flex-col transition-all duration-300 border-r border-blue-200
            ${collapsed ? 'w-20' : 'w-64'}
            bg-blue-50  /* Light Blue Background */
            text-gray-700 /* Dark Text */
        `}>
            {/* Header / Toggle */}
            <div className="p-4 flex items-center justify-between border-b border-blue-200 h-16">
                {!collapsed && <span className="font-bold text-lg tracking-wide text-blue-800">PMS APP</span>}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded hover:bg-blue-200 text-blue-600"
                >
                    {collapsed ? '☰' : '«'}
                </button>
            </div>

            {/* Menu Items */}
            <ul className="flex-1 p-4 overflow-y-auto">
                
                {/* --- ADMIN LINKS --- */}
                {role === 'Admin' && (
                    <>
                        <div className={`text-xs font-bold text-blue-400 uppercase mb-2 ${collapsed && 'hidden'}`}>Admin</div>
                        <NavItem label="Admin Dashboard" path="/admin" />
                        <NavItem label="Manage Users" path="/admin/users" />
                        <NavItem label="Manage Teams" path="/admin/teams" />
                        <NavItem label="Global Tasks" path="/tasks/search" />
                    </>
                )}

                {/* --- TEAM LEADER LINKS --- */}
                {role === 'Team Leader' && (
                    <>
                        <div className={`text-xs font-bold text-blue-400 uppercase mb-2 ${collapsed && 'hidden'}`}>Leadership</div>
                        <NavItem label="Leader Dashboard" path="/team/leader-dashboard" />
                        <NavItem label="Manage My Team" path="/team/manage" />
                        <NavItem label="Manage Tasks" path="/team/tasks-manage" />
                        
                        <div className={`text-xs font-bold text-blue-400 uppercase mt-4 mb-2 ${collapsed && 'hidden'}`}>Personal</div>
                        <NavItem label="My Dashboard" path="/dashboard" />
                        <NavItem label="My Personal Tasks" path="/my-tasks" />
                        <NavItem label="Search Tasks" path="/tasks/search" />
                    </>
                )}

                {/* --- MEMBER LINKS --- */}
                {role === 'Member' && (
                    <>
                         <div className={`text-xs font-bold text-blue-400 uppercase mb-2 ${collapsed && 'hidden'}`}>Menu</div>
                        <NavItem label="Dashboard" path="/dashboard" />
                        <NavItem label="My Team Board" path="/teams" />
                        <NavItem label="My Personal Tasks" path="/my-tasks" />
                        <NavItem label="Search Tasks" path="/tasks/search" />
                    </>
                )}
            </ul>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-blue-200">
                <li 
                    onClick={handleLogout}
                    className={`
                        flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all
                        text-red-600 hover:bg-red-50
                    `}
                    title={collapsed ? "Logout" : ""}
                >
                     {collapsed ? (
                        <span className="font-bold text-lg w-full text-center">"Logout"</span>
                    ) : (
                        <span className="font-bold">Logout</span>
                    )}
                </li>
            </div>
        </div>
    );
};

export default Sidebar;