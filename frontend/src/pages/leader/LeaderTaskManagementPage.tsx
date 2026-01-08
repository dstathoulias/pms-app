import { useEffect, useState } from 'react';
import { teamApi, taskApi, userApi } from '../../api/axios';
import type { Team, TaskItem, User } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    nameid?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

const LeaderTaskManagementPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        assignedToId: ''
    });

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const decoded: JwtPayload = jwtDecode(token);
            const leaderId = decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

            const teamRes = await teamApi.get('/Team/my-teams');
            if (!teamRes.data || teamRes.data.length === 0) {
                toast.error("No team found.");
                navigate('/team/leader-dashboard');
                return;
            }
            const myTeam: Team = teamRes.data[0];

            const userRes = await userApi.get('/User');
            const allUsers: User[] = userRes.data;
            const teamMemberIds = myTeam.members.map(m => m.userId);
            
            const teamMembers = allUsers.filter(u => 
                teamMemberIds.includes(u.id) && 
                u.isActive
            );
            setMembers(teamMembers);

            const taskRes = await taskApi.get(`/Task?leaderId=${leaderId}`);
            setTasks(taskRes.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const decoded: any = jwtDecode(token!);
            const leaderId = decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

            const payload = {
                ...formData,
                leaderId: parseInt(leaderId),
                assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null,
                status: 'To Do'
            };

            await taskApi.post('/Task', payload);
            toast.success("Task created!");
            setShowCreateModal(false);
            setFormData({ title: '', description: '', priority: 'Medium', dueDate: '', assignedToId: '' });
            loadData();
        } catch (error) {
            toast.error("Failed to create task");
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if(!confirm("Are you sure you want to delete this task?")) return;
        try {
            await taskApi.delete(`/Task/${taskId}`);
            toast.success("Task deleted");
            loadData();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Tasks...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={() => navigate('/team/leader-dashboard')} className="text-gray-500 hover:underline text-sm mb-1">
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Team Tasks</h1>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                >
                    + New Task
                </button>
            </div>

            {/* Task List */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                            <th className="px-5 py-3 text-left">Task Title</th>
                            <th className="px-5 py-3 text-left">Assigned To</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Priority</th>
                            <th className="px-5 py-3 text-center">Due Date</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length === 0 ? (
                            <tr><td colSpan={6} className="p-5 text-center text-gray-500">No tasks created yet.</td></tr>
                        ) : (
                            tasks.map((task) => {
                                const assignee = members.find(m => m.id === task.assignedToId);
                                return (
                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                        <td className="px-5 py-4 font-medium">{task.title}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {assignee ? assignee.username : <span className="text-red-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs border ${
                                                task.status === 'Done' ? 'bg-green-50 border-green-200 text-green-700' : 
                                                'bg-blue-50 border-blue-200 text-blue-700'
                                            }`}>{task.status}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>{task.priority}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center text-sm">{String(task.dueDate)}</td>
                                        <td className="px-5 py-4 text-center">
                                            <button 
                                                onClick={() => navigate(`/tasks/${task.id}`)}
                                                className="text-blue-600 hover:underline text-xs mr-3"
                                            >
                                                View
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-red-600 hover:underline text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Task Modal Overlay */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Create New Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div className="mb-3">
                                <label className="block text-sm font-bold mb-1">Title</label>
                                <input 
                                    className="w-full p-2 border rounded" 
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-bold mb-1">Description</label>
                                <textarea 
                                    className="w-full p-2 border rounded h-20" 
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Priority</label>
                                    <select 
                                        className="w-full p-2 border rounded bg-white"
                                        value={formData.priority}
                                        onChange={e => setFormData({...formData, priority: e.target.value})}
                                    >
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Due Date</label>
                                    <input 
                                        type="date"
                                        className="w-full p-2 border rounded" 
                                        required
                                        value={formData.dueDate}
                                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold mb-1">Assign To</label>
                                <select 
                                    className="w-full p-2 border rounded bg-white"
                                    value={formData.assignedToId}
                                    onChange={e => setFormData({...formData, assignedToId: e.target.value})}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.username} ({m.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderTaskManagementPage;