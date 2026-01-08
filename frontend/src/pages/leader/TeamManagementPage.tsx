import { useEffect, useState } from 'react';
import { teamApi, userApi } from '../../api/axios';
import type { Team, User } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const TeamManagementPage = () => {
    const navigate = useNavigate();
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<User[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [selectedNewMember, setSelectedNewMember] = useState('');

    const loadData = async () => {
        try {
            const teamRes = await teamApi.get('/Team/my-teams');
            if (!teamRes.data || teamRes.data.length === 0) {
                toast.error("You are not leading any team.");
                navigate('/team/leader-dashboard');
                return;
            }
            const myTeam: Team = teamRes.data[0];
            setTeam(myTeam);
            setEditForm({ name: myTeam.name, description: myTeam.description });

            const userRes = await userApi.get('/User');
            const allUsers: User[] = userRes.data;

            const memberIds = myTeam.members.map(m => m.userId);
            const currentMembers = allUsers.filter(u => memberIds.includes(u.id));
            setMembers(currentMembers);

            const allTeamsRes = await teamApi.get('/Team');
            const busyUserIds = new Set<number>();
            allTeamsRes.data.forEach((t: Team) => {
                t.members?.forEach(m => busyUserIds.add(m.userId));
            });

            const freeUsers = allUsers.filter(u => 
                u.role === 'Member' && 
                u.isActive &&
                !busyUserIds.has(u.id) && 
                u.id !== myTeam.leaderId
            );
            setAvailableUsers(freeUsers);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load management data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team) return;
        try {
            await teamApi.put(`/Team/${team.id}`, editForm);
            toast.success("Team details updated!");
            loadData();
        } catch (error) {
            toast.error("Failed to update team.");
        }
    };

    const handleAddMember = async () => {
        if (!team || !selectedNewMember) return;
        try {
            await teamApi.post(
                `/Team/${team.id}/members`, 
                parseInt(selectedNewMember), 
                { headers: { 'Content-Type': 'application/json' } }
            );
            toast.success("Member added!");
            setSelectedNewMember('');
            loadData();
        } catch (error) {
            toast.error("Failed to add member.");
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!team) return;
        if (!confirm("Remove this user from the team?")) return;
        try {
            await teamApi.delete(`/Team/${team.id}/members/${userId}`);
            toast.success("Member removed.");
            loadData();
        } catch (error) {
            toast.error("Failed to remove member.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!team) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mb-6">
                <button onClick={() => navigate('/team/leader-dashboard')} className="text-gray-500 hover:underline">
                    &larr; Back to Dashboard
                </button>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Team: {team.name}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 text-blue-600">Edit Details</h2>
                    <form onSubmit={handleUpdateTeam}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">Team Name</label>
                            <input 
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">Description</label>
                            <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                className="w-full p-2 border rounded h-24"
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Save Changes
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 text-blue-600">Manage Members</h2>

                    <div className="flex gap-2 mb-6">
                        <select 
                            value={selectedNewMember}
                            onChange={(e) => setSelectedNewMember(e.target.value)}
                            className="flex-grow p-2 border rounded"
                        >
                            <option value="">-- Select New Member --</option>
                            {availableUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleAddMember}
                            disabled={!selectedNewMember}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>

                    <h3 className="font-bold text-gray-700 mb-2">Current Members ({members.length})</h3>
                    {members.length === 0 ? (
                        <p className="text-gray-500 text-sm">No members yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {members.map(m => (
                                <li key={m.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{m.username}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                                m.id === team.leaderId 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {m.id === team.leaderId ? 'Leader' : 'Member'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{m.email}</p>
                                    </div>
                                    
                                    {m.id !== team.leaderId && (
                                        <button 
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="text-red-600 text-sm hover:underline border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamManagementPage;