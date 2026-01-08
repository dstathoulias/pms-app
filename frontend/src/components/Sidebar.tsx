import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [role, setRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const userRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                setRole(userRole || 'Member');
            } catch (error) {
                console.error("Invalid token", error);
                setRole('Member');
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const NavItem = ({ label, path }: { label: string, path: string }) => {
        const isActive = location.pathname === path;
        return (
            <li 
                onClick={() => {
                    navigate(path);
                    setIsOpen(false);
                }}
                className={`
                    flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all mb-2 font-medium
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-blue-100 hover:text-blue-900' 
                    }
                `}
            >
                <span className="whitespace-nowrap">{label}</span>
            </li>
        );
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105"
                title="Open Menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`
                fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 
                transform transition-transform duration-300 ease-in-out overflow-y-auto
                ${isOpen ? 'translate-x-0' : 'translate-x-full'} /* Slide in from right */
            `}>
                
                <div className="p-5 flex items-center justify-between border-b border-gray-200">
                    <span className="font-bold text-xl text-blue-800 tracking-wide">PMS APP</span>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <ul className="p-5 space-y-1">
                    
                    {role === 'Admin' && (
                        <>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Admin Controls</div>
                            <NavItem label="Admin Dashboard" path="/admin" />
                            <NavItem label="Manage Users" path="/admin/users" />
                            <NavItem label="Manage Teams" path="/admin/teams" />
                            <NavItem label="Global Tasks" path="/tasks/search" />
                            <hr className="my-4 border-gray-100" />
                        </>
                    )}

                    {role === 'Team Leader' && (
                        <>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Team Management</div>
                            <NavItem label="Leader Dashboard" path="/team/leader-dashboard" />
                            <NavItem label="Manage My Team" path="/team/manage" />
                            <NavItem label="Manage Tasks" path="/team/tasks-manage" />
                            
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Personal</div>
                            <NavItem label="My Dashboard" path="/dashboard" />
                            <NavItem label="My Personal Tasks" path="/my-tasks" />
                            <NavItem label="Search Tasks" path="/tasks/search" />
                            <hr className="my-4 border-gray-100" />
                        </>
                    )}

                    {role === 'Member' && (
                        <>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Menu</div>
                            <NavItem label="Dashboard" path="/dashboard" />
                            <NavItem label="My Team Board" path="/teams" />
                            <NavItem label="My Personal Tasks" path="/my-tasks" />
                            <NavItem label="Search Tasks" path="/tasks/search" />
                            <hr className="my-4 border-gray-100" />
                        </>
                    )}
                </ul>

                <div className="p-5 border-t border-gray-200 bg-gray-50 absolute bottom-0 w-full">
                    <li 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </li>
                </div>
            </div>
        </>
    );
};

export default Sidebar;