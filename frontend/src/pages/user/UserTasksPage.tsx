import { useEffect, useState } from 'react';
import { taskApi } from '../../api/axios';
import type { TaskItem } from '../../types';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserTasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyTasks = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const decoded: any = jwtDecode(token);
                const userId = decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

                const response = await taskApi.get(`/Task?assignedToId=${userId}`);
                setTasks(response.data);
            } catch (error) {
                console.error("Failed to fetch personal tasks");
            } finally {
                setLoading(false);
            }
        };
        fetchMyTasks();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading My Tasks...</div>;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">My Personal Tasks</h1>
                <p className="text-gray-500 text-sm mt-1">A complete list of tasks assigned to you.</p>
            </div>

            {tasks.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                    You have no tasks assigned at the moment.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                                <th className="px-6 py-3 text-left">Title</th>
                                <th className="px-6 py-3 text-center">Priority</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Due Date</th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-800">{task.title}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs border ${
                                            task.status === 'Done' ? 'bg-green-50 border-green-200 text-green-700' :
                                            task.status === 'In Progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                                        {String(task.dueDate).split('T')[0]}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-bold hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserTasksPage;