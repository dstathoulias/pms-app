import { useEffect, useState } from 'react';
import { userApi, teamApi } from '../../api/axios';
import type { User, Team } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 1. Fetch Users
    const fetchUsers = async () => {
        try {
            const response = await userApi.get('/User');
            setUsers(response.data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleStatusChange = async (userId: number, isActive: boolean) => {
        if (isActive) {
            if (!confirm("Deactivate this user? They will be removed from any teams.")) return;

            try {
                // Find if user is in a team
                // Since we don't have a direct 'getUserTeam' endpoint, we scan teams.
                const teamsRes = await teamApi.get('/Team');
                const allTeams: Team[] = teamsRes.data;
                
                let userTeamId = null;
                for (const team of allTeams) {
                    if (team.members?.some(m => m.userId === userId)) {
                        userTeamId = team.id;
                        break;
                    }
                }

                if (userTeamId) {
                    try {
                        await teamApi.delete(`/Team/${userTeamId}/members/${userId}`);
                        toast.info("User removed from their team.");
                    } catch (teamError) {
                        console.error("Failed to remove user from team:", teamError);
                        toast.warning("Could not automatically remove user from team.");
                    }
                }

                await userApi.put(`/User/${userId}/deactivate`);
                toast.success("User deactivated successfully");
                fetchUsers();

            } catch (error) {
                toast.error("Deactivation failed");
            }
        } else {
            try {
                await userApi.put(`/User/${userId}/activate`);
                toast.success("User activated successfully");
                fetchUsers();
            } catch (error) {
                toast.error("Activation failed");
            }
        }
    };

    const handleRoleChange = async (userId: number, currentRole: string) => {
        try {
            const endpoint = currentRole === 'Member' ? 'promote' : 'demote';
            await userApi.put(`/User/${userId}/${endpoint}`);
            toast.success(`User role updated to ${currentRole === 'Member' ? 'Team Leader' : 'Member'}`);
            fetchUsers();
        } catch (error) {
            toast.error("Role change failed");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Users...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:underline">Back to Admin</button>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                            <th className="px-5 py-3 text-left">ID</th>
                            <th className="px-5 py-3 text-left">Username</th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Email</th>
                            <th className="px-5 py-3 text-left">Role</th>
                            <th className="px-5 py-3 text-center">Status</th>
                            <th className="px-5 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="px-5 py-4 text-sm text-gray-500">{user.id}</td>
                                <td className="px-5 py-4 font-bold text-gray-700">{user.username}</td>
                                <td className="px-5 py-4 text-sm">{user.firstName} {user.lastName}</td>
                                <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>
                                <td className="px-5 py-4 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                                        user.role === 'Team Leader' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-center flex justify-center gap-2">
                                    {user.role !== 'Admin' && (
                                        <>
                                            <button 
                                                onClick={() => handleRoleChange(user.id, user.role)}
                                                className="text-xs px-3 py-1 border rounded hover:bg-gray-100 text-blue-600"
                                            >
                                                {user.role === 'Member' ? 'Promote' : 'Demote'}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleStatusChange(user.id, user.isActive)}
                                                className={`text-xs px-3 py-1 border rounded text-white ${user.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;