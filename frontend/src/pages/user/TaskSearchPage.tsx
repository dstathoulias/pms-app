import { useState, useEffect } from 'react';
import { taskApi, teamApi, userApi } from '../../api/axios';
import type { TaskItem, User, Team } from '../../types';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const TaskSearchPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Dropdown Data
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

    // Search Params
    const [searchType, setSearchType] = useState<'User' | 'Team'>('User');
    const [searchId, setSearchId] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // 1. Fetch Users and Teams for the Dropdowns
    useEffect(() => {
        const fetchDropdownOptions = async () => {
            try {
                const [usersRes, teamsRes] = await Promise.all([
                    userApi.get('/User'),
                    teamApi.get('/Team') 
                ]);
                setAvailableUsers(usersRes.data);
                setAvailableTeams(teamsRes.data);
            } catch (error) {
                console.error("Failed to load search options", error);
            }
        };
        fetchDropdownOptions();
    }, []);

    const getBackLink = () => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded: any = jwtDecode(token);
            const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            if (role === 'Admin') return '/admin';
            if (role === 'Team Leader') return '/team/leader-dashboard';
        }
        return '/dashboard';
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchId) {
            toast.warning(`Please select a ${searchType}`);
            return;
        }

        setLoading(true);
        setSearched(true);
        setTasks([]);

        try {
            let endpoint = '';

            if (searchType === 'User') {
                endpoint = `/Task?assignedToId=${searchId}`;
            } 
            else if (searchType === 'Team') {
                // Find leader ID from the selected team
                const selectedTeam = availableTeams.find(t => t.id === parseInt(searchId));
                if (selectedTeam) {
                    endpoint = `/Task?leaderId=${selectedTeam.leaderId}`;
                } else {
                    const teamRes = await teamApi.get(`/Team/${searchId}`);
                    endpoint = `/Task?leaderId=${teamRes.data.leaderId}`;
                }
            }

            const response = await taskApi.get(endpoint);
            setTasks(response.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch tasks");
        } finally {
            setLoading(false);
        }
    };

    // Client-side Filtering
    const filteredTasks = tasks.filter(task => {
        if (statusFilter && task.status !== statusFilter) return false;
        if (dateFilter) {
            const taskDate = String(task.dueDate).split('T')[0];
            if (taskDate !== dateFilter) return false;
        }
        return true;
    });

    const clearFilters = () => {
        setStatusFilter('');
        setDateFilter('');
        setSearchId('');
        setSearched(false);
        setTasks([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Task Search</h1>
                <button onClick={() => navigate(getBackLink())} className="text-gray-600 hover:underline">
                    &larr; Back to Dashboard
                </button>
            </div>

            {/* SEARCH & FILTER CARD */}
            <div className="bg-white p-6 rounded shadow mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    
                    {/* Search Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Search By</label>
                        <select 
                            value={searchType}
                            onChange={(e) => {
                                setSearchType(e.target.value as 'User' | 'Team');
                                setSearchId('');
                            }}
                            className="w-full p-2 border rounded"
                        >
                            <option value="User">Specific User</option>
                            <option value="Team">Specific Team</option>
                        </select>
                    </div>

                    {/* Dynamic Dropdown Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Select {searchType}
                        </label>
                        <select
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            className="w-full p-2 border rounded bg-white"
                        >
                            <option value="">-- Select {searchType} --</option>
                            
                            {searchType === 'User' && availableUsers
                            .filter(u => u.isActive)
                            .map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.username} ({u.firstName} {u.lastName})
                                </option>
                            ))}

                            {searchType === 'Team' && availableTeams.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button 
                            type="submit" 
                            disabled={!searchId}
                            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
                        >
                            Search
                        </button>
                    </div>
                    
                    {/* Clear Button */}
                    <div>
                        <button 
                            type="button" 
                            onClick={clearFilters}
                            className="w-full bg-gray-200 text-gray-700 p-2 rounded hover:bg-gray-300"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {/* FILTERS ROW */}
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 uppercase">Filter Results:</span>
                    </div>
                    
                    <div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                        >
                            <option value="">-- All Statuses --</option>
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                        </select>
                    </div>

                    <div>
                        <input 
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* RESULTS TABLE */}
            <div className="bg-white rounded shadow overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-700">Search Results</h2>
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {filteredTasks.length} Found
                    </span>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Searching...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                        {searched ? "No tasks found matching criteria." : "Select a User or Team above to view tasks."}
                    </div>
                ) : (
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                                <th className="px-5 py-3 text-left">Title</th>
                                <th className="px-5 py-3 text-left">Assigned To</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-center">Due Date</th>
                                <th className="px-5 py-3 text-center">Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="border-b hover:bg-gray-50">
                                    <td className="px-5 py-4 font-medium">{task.title}</td>
                                    <td className="px-5 py-4 text-sm text-gray-600">
                                        {availableUsers.find(u => u.id === task.assignedToId)?.username || `User #${task.assignedToId}`}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs border ${
                                            task.status === 'Done' ? 'bg-green-50 border-green-200 text-green-700' : 
                                            task.status === 'In Progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            'bg-yellow-50 border-yellow-200 text-yellow-700'
                                        }`}>{task.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center text-sm">{String(task.dueDate).split('T')[0]}</td>
                                    <td className="px-5 py-4 text-center">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {task.priority}
                                        </span>
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

export default TaskSearchPage;