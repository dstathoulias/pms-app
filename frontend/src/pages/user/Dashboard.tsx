import { useEffect, useState } from 'react';
import { teamApi, taskApi } from '../../api/axios';
import { jwtDecode } from 'jwt-decode';
import type { Team, TaskItem } from '../../types';
import { useNavigate } from 'react-router-dom';

interface JwtPayload {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
    nameid?: string;
    unique_name?: string;
    role?: string;
    sub?: string;
}

const Dashboard = () => {
    const [team, setTeam] = useState<Team | null>(null);
    const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
    const [stats, setStats] = useState({ todo: 0, inProgress: 0, done: 0 });
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const decoded: JwtPayload = jwtDecode(token);
                const userRole = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

                // --- FIX: Only redirect Admin. Leaders are allowed here. ---
                if (userRole === "Admin") {
                    navigate('/admin', { replace: true });
                    return;
                }

                const userId = 
                    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 
                    decoded.nameid || 
                    decoded.sub;

                const userMapName = 
                    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 
                    decoded.unique_name;

                if (!userId) return;

                setUsername(userMapName || "User");

                const [teamsRes, tasksRes] = await Promise.all([
                    teamApi.get('/Team/my-teams'), 
                    taskApi.get(`/Task?assignedToId=${userId}`)
                ]);

                if (teamsRes.data && teamsRes.data.length > 0) {
                    setTeam(teamsRes.data[0]);
                }

                const fetchedTasks = tasksRes.data;
                setMyTasks(fetchedTasks);

                setStats({
                    todo: fetchedTasks.filter((t: TaskItem) => t.status === "To Do").length,
                    inProgress: fetchedTasks.filter((t: TaskItem) => t.status === "In Progress").length,
                    done: fetchedTasks.filter((t: TaskItem) => t.status === "Done").length,
                });

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Hello, {username}!</h1>
                    <p className="text-gray-600">Here is your project overview.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold opacity-90">My Team</h3>
                    <p className="text-xl font-bold mt-2 truncate">
                        {team ? team.name : "Not Assigned"}
                    </p>
                </div>
                
                <StatCard title="To Do" count={stats.todo} color="bg-yellow-500" />
                <StatCard title="In Progress" count={stats.inProgress} color="bg-orange-500" />
                <StatCard title="Completed" count={stats.done} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: My Tasks */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">My Upcoming Tasks</h2>
                        {/* FIX: Point to the search page instead of non-existent /tasks */}
                        <button 
                            onClick={() => navigate('/tasks/search')} 
                            className="text-blue-600 text-sm hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    
                    {myTasks.length === 0 ? (
                        <p className="text-gray-500">No tasks assigned to you yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="py-2">Task</th>
                                        <th className="py-2">Due Date</th>
                                        <th className="py-2">Priority</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myTasks.slice(0, 5).map(task => (
                                        <tr key={task.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 font-medium text-gray-700">{task.title}</td>
                                            <td className="py-3 text-sm text-gray-600">{String(task.dueDate).split('T')[0]}</td>
                                            <td className="py-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <button 
                                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                                    className="text-blue-600 text-xs font-bold hover:underline"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Column: Single Team Details */}
                <div className="bg-white rounded-lg shadow p-6 h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Team Details</h2>
                    </div>

                    {team ? (
                        <div>
                            <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase font-bold">Project Name</label>
                                <p className="text-lg font-semibold text-blue-700">{team.name}</p>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs text-gray-500 uppercase font-bold">About</label>
                                <p className="text-gray-600 text-sm mt-1">{team.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Created</label>
                                    <p className="text-sm">{String(team.dateOfCreation).split('T')[0]}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Members</label>
                                    <p className="text-sm font-bold">{team.members?.length || 0}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t">
                                <button onClick={() => navigate('/teams')} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition text-sm font-medium">
                                    View Team Board
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-2 font-medium">No Team Assigned</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helpers ---
const StatCard = ({ title, count, color }: { title: string, count: number, color: string }) => (
    <div className={`${color} text-white p-6 rounded-lg shadow-md`}>
        <h3 className="text-lg font-semibold opacity-90">{title}</h3>
        <p className="text-4xl font-bold mt-2">{count}</p>
    </div>
);

const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-green-100 text-green-700';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Done': return 'bg-green-50 text-green-700 border-green-200';
        case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
        default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
};

export default Dashboard;