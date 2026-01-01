import { useState, useEffect } from 'react';
import { userApi } from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // --- NEW: Check if already logged in ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                // Check if expired
                if (decoded.exp * 1000 > Date.now()) {
                    const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                    
                    // Redirect based on role
                    if (role === 'Admin') navigate('/admin');
                    else if (role === 'Team Leader') navigate('/team/leader-dashboard');
                    else navigate('/dashboard');
                } else {
                    localStorage.removeItem('token'); // Clear expired token
                }
            } catch (error) {
                localStorage.removeItem('token'); // Clear invalid token
            }
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEmail = loginInput.includes('@');

        try {
            const payload = {
                email: isEmail ? loginInput : null,
                username: !isEmail ? loginInput : null,
                password: password
            };

            const response = await userApi.post('/User/login', payload);
            const token = response.data.token;
            localStorage.setItem('token', token);

            const decoded: any = jwtDecode(token);
            const userRole = decoded.role || 
                             decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

            toast.success("Login Successful!");

            // Traffic Control
            if (userRole === "Admin") {
                navigate('/admin');
            } else if (userRole === "Team Leader") {
                navigate('/team/leader-dashboard');
            } else {
                navigate('/dashboard');
            }
            
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data || "Login failed. Check your credentials.";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center text-blue-600">PMS Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block mb-1 text-sm font-bold">Email or Username</label>
                        <input 
                            type="text" 
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="username or email"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-1 text-sm font-bold">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="********"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full p-2 mb-4 text-white bg-blue-600 rounded hover:bg-blue-700 transition font-semibold">
                        Sign In
                    </button>
                </form>
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <button 
                    onClick={() => navigate('/signup')}
                    className="w-full p-2 text-green-600 border border-green-600 rounded hover:bg-green-50 transition font-semibold"
                >
                    Create New Account
                </button>
            </div>
        </div>
    );
};

export default LoginPage;