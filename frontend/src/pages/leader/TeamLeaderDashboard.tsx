import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { teamApi, taskApi } from '../../api/axios';
import type { Team } from '../../types';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    nameid?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
}

const TeamLeaderDashboard = () => {
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [taskCount, setTaskCount] = useState(0);

    useEffect(() => {
        const fetchLeaderData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const decoded: JwtPayload = jwtDecode(token);
                const userId = decoded.nameid || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

                const teamRes = await teamApi.get('/Team/my-teams');
                if (teamRes.data && teamRes.data.length > 0) {
                    setTeam(teamRes.data[0]);
                    
                    const taskRes = await taskApi.get(`/Task?leaderId=${userId}`);
                    setTaskCount(taskRes.data.length);
                }
            } catch (error) {
                console.error("Failed to load leader data");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">Team Leader Dashboard</h1>
                    
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm mt-2 hover:underline flex items-center"
                    >
                        View Personal Dashboard &rarr;
                    </button>
                </div>

                {team ? (
                    <p className="text-gray-600 mb-8">Leading Project: <span className="font-bold text-blue-600">{team.name}</span></p>
                ) : (
                    <p className="text-gray-500 mb-8 italic">You are not assigned to a team yet.</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    <div 
                        onClick={() => navigate('/team/manage')}
                        className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-l-4 border-indigo-500 group"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600">Manage Team</h2>
                        <p className="text-gray-600 mt-2">
                            Update team details. Add new members or remove existing ones.
                        </p>
                        <div className="mt-4 text-sm font-semibold text-gray-500">
                            {team ? `${team.members?.length || 0} Members` : "No Team"}
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/team/tasks-manage')} 
                        className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-l-4 border-emerald-500 group"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 group-hover:text-emerald-600">Manage Tasks</h2>
                        <p className="text-gray-600 mt-2">
                            Create new tasks, assign work to members, and track project progress.
                        </p>
                        <div className="mt-4 text-sm font-semibold text-gray-500">
                            {taskCount} Active Tasks
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamLeaderDashboard;