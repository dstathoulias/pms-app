import { useEffect, useState } from 'react';
import { teamApi, userApi } from '../../api/axios';
import type { Team, User, TeamMember } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminTeamsPage = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [availableLeaders, setAvailableLeaders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [createForm, setCreateForm] = useState({ name: '', description: '', leaderId: '' });
    const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '' });
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');

    const loadData = async () => {
        try {
            const [teamRes, userRes] = await Promise.all([
                teamApi.get('/Team'), 
                userApi.get('/User')
            ]);
            
            const fetchedTeams: Team[] = teamRes.data;
            const fetchedUsers: User[] = userRes.data;
            
            setTeams(fetchedTeams);
            setAllUsers(fetchedUsers);

            const busyUserIds = new Set<number>();
            fetchedTeams.forEach(team => {
                if (team.members) team.members.forEach((m: TeamMember) => busyUserIds.add(m.userId));
            });

            const freeUsers = fetchedUsers.filter(u => 
                u.role === 'Member' && 
                !busyUserIds.has(u.id) && 
                u.isActive
            );
            setAvailableLeaders(freeUsers);

        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const leaderId = parseInt(createForm.leaderId);
        try {
            await teamApi.post('/Team', { ...createForm, leaderId });
            await userApi.put(`/User/${leaderId}/promote`); 
            toast.success("Team created!");
            setCreateForm({ name: '', description: '', leaderId: '' });
            loadData();
        } catch (error) {
            toast.error("Creation failed");
        }
    };

    const handleDeleteTeam = async (team: Team) => {
        if(!confirm(`Are you sure you want to delete "${team.name}"? This will demote the leader.`)) return;
        try {
            await teamApi.delete(`/Team/${team.id}`);
            if (team.leaderId) {
                try {
                    await userApi.put(`/User/${team.leaderId}/demote`);
                } catch (e) { console.error("Demotion failed", e); }
            }
            toast.success("Team deleted successfully");
            loadData();
        } catch (error) {
            toast.error("Failed to delete team");
        }
    };

    const toggleManage = (team: Team) => {
        if (expandedTeamId === team.id) {
            setExpandedTeamId(null);
        } else {
            setExpandedTeamId(team.id);
            setEditForm({ name: team.name, description: team.description });
            setSelectedMemberToAdd('');
        }
    };

    const handleUpdateTeam = async (teamId: number) => {
        try {
            await teamApi.put(`/Team/${teamId}`, editForm);
            toast.success("Updated successfully");
            loadData();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleAddMember = async (teamId: number) => {
        if (!selectedMemberToAdd) return;
        try {
            await teamApi.post(
                `/Team/${teamId}/members`, 
                parseInt(selectedMemberToAdd), 
                { headers: { 'Content-Type': 'application/json' } }
            );
            toast.success("Member added");
            setSelectedMemberToAdd('');
            loadData();
        } catch (error) {
            toast.error("Add member failed");
        }
    };

    const handleRemoveMember = async (teamId: number, userId: number) => {
        if(!confirm("Remove user?")) return;
        try {
            await teamApi.delete(`/Team/${teamId}/members/${userId}`);
            toast.success("Member removed");
            loadData();
        } catch (error) {
            toast.error("Remove failed");
        }
    };

    const getAvailableForTeam = () => {
        const busyUserIds = new Set<number>();
        teams.forEach(t => t.members?.forEach(m => busyUserIds.add(m.userId)));
        return allUsers.filter(u => 
            u.role === 'Member' && 
            !busyUserIds.has(u.id) &&
            u.isActive
        );
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Team Management (Admin)</h1>
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:underline">Back to Admin</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded shadow h-fit">
                    <h2 className="text-xl font-bold mb-4 text-blue-600">Create Team</h2>
                    <form onSubmit={handleCreateTeam}>
                        <input 
                            placeholder="Team Name"
                            value={createForm.name}
                            onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                            className="w-full p-2 border rounded mb-3"
                            required
                        />
                        <textarea 
                            placeholder="Description"
                            value={createForm.description}
                            onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                            className="w-full p-2 border rounded mb-3"
                            required
                        />
                        <select 
                            value={createForm.leaderId}
                            onChange={(e) => setCreateForm({...createForm, leaderId: e.target.value})}
                            className="w-full p-2 border rounded mb-4"
                            required
                        >
                            <option value="">-- Select New Leader --</option>
                            {availableLeaders.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            Create Team
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {teams.map(team => (
                        <div key={team.id} className="bg-white rounded shadow border-l-4 border-green-500 overflow-hidden">
                            <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold">{team.name}</h3>
                                    <p className="text-sm text-gray-600">{team.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleManage(team)} className="text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 text-sm">
                                        {expandedTeamId === team.id ? "Close" : "Manage"}
                                    </button>
                                    <button onClick={() => handleDeleteTeam(team)} className="text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50 text-sm">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {expandedTeamId === team.id && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Edit Info</h4>
                                            <input 
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className="w-full p-2 border rounded mb-2 text-sm"
                                            />
                                            <textarea 
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                                className="w-full p-2 border rounded mb-2 text-sm"
                                            />
                                            <button onClick={() => handleUpdateTeam(team.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Update Info</button>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 text-sm uppercase">Members</h4>
                                            
                                            <div className="flex gap-2 mb-3">
                                                <select 
                                                    className="w-full p-1 border rounded text-sm"
                                                    value={selectedMemberToAdd}
                                                    onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                                                >
                                                    <option value="">+ Add Member</option>
                                                    {getAvailableForTeam().map(u => (
                                                        <option key={u.id} value={u.id}>{u.username}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => handleAddMember(team.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm" disabled={!selectedMemberToAdd}>Add</button>
                                            </div>

                                            <ul className="space-y-1">
                                                {team.members.map(m => {
                                                    const user = allUsers.find(u => u.id === m.userId);
                                                    return (
                                                        <li key={m.userId} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <span>{user ? user.username : `User ${m.userId}`}</span>
                                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                                    m.userId === team.leaderId 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {m.userId === team.leaderId ? 'Leader' : 'Member'}
                                                                </span>
                                                            </div>
                                                            
                                                            {team.leaderId !== m.userId && (
                                                                <button 
                                                                    onClick={() => handleRemoveMember(team.id, m.userId)}
                                                                    className="text-red-500 hover:text-red-700 font-bold px-2"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminTeamsPage;