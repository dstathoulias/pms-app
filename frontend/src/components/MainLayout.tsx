import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar stays fixed on the left */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default MainLayout;