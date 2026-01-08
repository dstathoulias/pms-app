import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-transparent">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
                <p className="text-gray-600">Manage system access, users, and teams.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                <div 
                    onClick={() => navigate('/admin/users')}
                    className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-l-4 border-blue-500 group"
                >
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">Manage Users</h2>
                    <p className="text-gray-600 mt-2">
                        View all users (IDs, Roles, Status). Manage account access.
                    </p>
                </div>

                <div 
                    onClick={() => navigate('/admin/teams')}
                    className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-l-4 border-purple-500 group"
                >
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600">Manage Teams</h2>
                    <p className="text-gray-600 mt-2">
                        Create new teams and assign free members as leaders.
                    </p>
                </div>

                <div 
                    onClick={() => navigate('/tasks/search')}
                    className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition cursor-pointer border-l-4 border-orange-500 group"
                >
                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-orange-600">Global Tasks</h2>
                    <p className="text-gray-600 mt-2">
                        Search the entire task database. Filter by ID or Status.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;