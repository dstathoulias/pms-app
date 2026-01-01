import { useState, useEffect } from 'react';
import { userApi } from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

const Signup = () => {
    const navigate = useNavigate();

    // --- NEW: Check if already logged in ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
                    
                    if (role === 'Admin') navigate('/admin');
                    else if (role === 'Team Leader') navigate('/team/leader-dashboard');
                    else navigate('/dashboard');
                } else {
                    localStorage.removeItem('token');
                }
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Member'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                passwordHash: formData.password, 
                role: formData.role
            };

            await userApi.post('/User/register', payload);
            toast.success("Account created! Please log in.");
            navigate('/login');
            
        } catch (error: any) {
            const msg = error.response?.data || "Signup failed";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleSignup} className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center text-green-600">Create Account</h2>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <input name="firstName" placeholder="First Name" onChange={handleChange} className="p-2 border rounded" required />
                    <input name="lastName" placeholder="Last Name" onChange={handleChange} className="p-2 border rounded" required />
                </div>

                <div className="mb-4">
                    <input name="username" placeholder="Username" onChange={handleChange} className="w-full p-2 border rounded" required />
                </div>
                
                <div className="mb-4">
                    <input type="email" name="email" placeholder="Email Address" onChange={handleChange} className="w-full p-2 border rounded" required />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-500 mb-1">I am a...</label>
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange}
                        className="w-full p-2 border rounded bg-white"
                    >
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>

                <div className="mb-4">
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Password" 
                        onChange={handleChange} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                </div>
                <div className="mb-6">
                    <input 
                        type="password" 
                        name="confirmPassword" 
                        placeholder="Confirm Password" 
                        onChange={handleChange} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                </div>

                <button type="submit" className="w-full p-2 text-white bg-green-600 rounded hover:bg-green-700 transition">
                    Sign Up
                </button>

                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;