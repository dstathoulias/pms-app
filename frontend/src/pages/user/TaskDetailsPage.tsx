import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi, userApi } from '../../api/axios';
import type { TaskItem, User } from '../../types';
import { toast } from 'react-toastify';

// Local interface for Attachment structure
interface Attachment {
    id: number;
    fileName: string;
    uploadedByUserId: number;
    uploadedAt: string;
}

const TaskDetailsPage = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    
    const [task, setTask] = useState<TaskItem | null>(null);
    const [assigneeName, setAssigneeName] = useState('Unassigned');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Action States
    const [commentInput, setCommentInput] = useState('');
    const [fileInput, setFileInput] = useState<File | null>(null);

    // --- 1. Fetch Data ---
    const loadTaskData = async () => {
        try {
            if (!taskId) return;

            // A. Get Task Details
            const taskRes = await taskApi.get(`/Task/${taskId}`);
            const taskData: TaskItem = taskRes.data;
            setTask(taskData);

            // B. Resolve Assignee Name (if exists)
            if (taskData.assignedToId) {
                try {
                    // Optimization: In a real app, you'd have an endpoint like GET /User/{id}
                    // For now, we fetch the list and find the user (matching your current API)
                    const usersRes = await userApi.get('/User'); 
                    const user = usersRes.data.find((u: User) => u.id === taskData.assignedToId);
                    if (user) setAssigneeName(user.username);
                } catch (err) {
                    console.warn("Could not resolve assignee name");
                }
            }

            // C. Get Attachments
            const attachRes = await taskApi.get(`/Task/${taskId}/attachments`);
            setAttachments(attachRes.data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load task details.");
            navigate(-1); // Go back if task not found
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTaskData(); }, [taskId]);

    // --- 2. Action Handlers ---

    const handleStatusChange = async (newStatus: string) => {
        if (!task) return;
        try {
            // Send as raw string with JSON content type
            await taskApi.put(`/Task/${task.id}/status`, `"${newStatus}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            setTask({ ...task, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleAddComment = async () => {
        if (!task || !commentInput.trim()) return;
        try {
            // Send raw string with JSON content type
            await taskApi.put(`/Task/${task.id}/comment`, `"${commentInput}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            toast.success("Comment added");
            setCommentInput('');
            loadTaskData(); // Refresh to show new comment
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const handleUpload = async () => {
        if (!task || !fileInput) return;
        
        const formData = new FormData();
        formData.append('file', fileInput);

        try {
            await taskApi.post(`/Task/${task.id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("File uploaded");
            setFileInput(null);
            loadTaskData(); // Refresh list
        } catch (error) {
            toast.error("Upload failed");
        }
    };

    const handleDownload = async (attachmentId: number, fileName: string) => {
        try {
            const response = await taskApi.get(`/Task/attachments/${attachmentId}`, {
                responseType: 'blob' // Important: Expect a binary file, not JSON
            });
            
            // Create a virtual link to trigger browser download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Download failed");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Task...</div>;
    if (!task) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:underline mb-4">
                &larr; Back
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Main Info & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Header Card (Title & Desc) */}
                    <div className="bg-white p-6 rounded shadow border-l-4 border-blue-600">
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded text-sm font-bold ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                                <span className={`px-3 py-1 rounded text-sm border ${getStatusColor(task.status)}`}>
                                    {task.status}
                                </span>
                            </div>
                        </div>
                        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{task.description}</p>
                    </div>

                    {/* 2. Status Changer */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold text-gray-800 mb-4">Update Status</h3>
                        <div className="flex gap-3">
                            {['To Do', 'In Progress', 'Done'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={task.status === status}
                                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                                        task.status === status 
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Comments Section */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold text-gray-800 mb-4">Comments</h3>
                        
                        {/* Comments Display Area */}
                        <div className="bg-gray-50 p-4 rounded mb-4 h-64 overflow-y-auto border">
                            {task.comments ? (
                                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                                    {task.comments}
                                </pre>
                            ) : (
                                <p className="text-gray-400 italic text-sm">No comments yet. Start the discussion!</p>
                            )}
                        </div>

                        {/* Add Comment Input */}
                        <div className="flex gap-2">
                            <input 
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button 
                                onClick={handleAddComment}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Meta Data & Files */}
                <div className="space-y-6">
                    
                    {/* 4. Task Details Meta */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Details</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs uppercase font-semibold">Assigned To</span>
                                <span className="font-medium text-gray-800 text-lg">{assigneeName}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase font-semibold">Due Date</span>
                                <span className="font-medium text-gray-800">{task.dueDate ? String(task.dueDate).split('T')[0] : 'No Date'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs uppercase font-semibold">Created On</span>
                                <span className="font-medium text-gray-800">{task.dateCreated ? String(task.dateCreated).split('T')[0] : 'Unknown'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. Attachments */}
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Attachments</h3>
                        
                        {/* File List */}
                        <ul className="mb-4 space-y-2">
                            {attachments.length === 0 && <li className="text-gray-400 text-xs italic">No files attached</li>}
                            {attachments.map(file => (
                                <li key={file.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border hover:bg-gray-100">
                                    <span className="truncate w-32 font-medium text-gray-700" title={file.fileName}>{file.fileName}</span>
                                    <button 
                                        onClick={() => handleDownload(file.id, file.fileName)}
                                        className="text-blue-600 hover:underline text-xs font-bold"
                                    >
                                        Download
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* File Upload */}
                        <div className="border-t pt-4">
                            <label className="block text-xs font-bold text-gray-500 mb-2">Upload New File</label>
                            <input 
                                type="file" 
                                onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
                                className="text-xs text-gray-500 mb-3 w-full"
                            />
                            <button 
                                onClick={handleUpload}
                                disabled={!fileInput}
                                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
                            >
                                Upload
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Helper Functions for Badges ---

const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-green-100 text-green-700';
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Done': return 'bg-green-100 text-green-700 border-green-200';
        case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

export default TaskDetailsPage;