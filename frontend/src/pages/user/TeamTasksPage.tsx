import { useEffect, useState } from 'react';
import { teamApi, taskApi, userApi } from '../../api/axios';
import type { Team, TaskItem, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TeamTasksPage = () => {
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [userMap, setUserMap] = useState<Record<number, string>>({}); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeamData = async () => {
            try {
                const teamRes = await teamApi.get('/Team/my-teams');
                const myTeams = teamRes.data;

                if (!myTeams || myTeams.length === 0) {
                    setLoading(false);
                    return; 
                }

                const currentTeam = myTeams[0]; 
                setTeam(currentTeam);

                const [tasksRes, usersRes] = await Promise.all([
                    taskApi.get(`/Task?leaderId=${currentTeam.leaderId}`),
                    userApi.get('/User') 
                ]);

                setTasks(tasksRes.data);

                const lookup: Record<number, string> = {};
                usersRes.data.forEach((u: User) => {
                    lookup[u.id] = `${u.firstName} ${u.lastName} (${u.username})`;
                });
                setUserMap(lookup);

            } catch (error) {
                console.error(error);
                toast.error("Failed to load team tasks.");
            } finally {
                setLoading(false);
            }
        };

        loadTeamData();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Team Board...</div>;

    if (!team) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-700">No Team Found</h2>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-6">
                <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:underline">
                    &larr; Back to Dashboard
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-blue-600">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{team.name}</h1>
                        <p className="text-gray-600 mt-2">{team.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                        <p><strong>Team Leader:</strong> {userMap[team.leaderId] || `User #${team.leaderId}`}</p>
                        <p className="mt-1"><strong>Members:</strong> {team.members.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Team Tasks</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {tasks.length} Total
                    </span>
                </div>

                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No tasks active in this project yet.
                    </div>
                ) : (
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                                <th className="px-5 py-3 text-left">Title</th>
                                <th className="px-5 py-3 text-left">Assigned To</th>
                                <th className="px-5 py-3 text-center">Priority</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-left">Due Date</th>
                                <th className="px-5 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-5 py-4">
                                        <p className="text-gray-900 font-medium whitespace-no-wrap">{task.title}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center">
                                            <div className="ml-0">
                                                <p className="text-gray-900 whitespace-no-wrap text-sm">
                                                    {userMap[task.assignedToId] || "Unassigned"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-3 py-1 rounded border text-xs font-semibold ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500">
                                        {String(task.dueDate)}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button 
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-semibold hover:underline"
                                        >
                                            View Details &rarr;
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

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

export default TeamTasksPage;