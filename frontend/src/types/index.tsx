export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // "Admin", "Team Leader", "Member"
    isActive: boolean;
}

export interface TeamMember {
    id: number;
    userId: number;
    teamId: number;
}

export interface Team {
    id: number;
    name: string;
    description: string;
    leaderId: number;
    dateOfCreation: string; // C# DateOnly comes as string "2025-01-01"
    members: TeamMember[];
}

export interface TaskItem {
    id: number;
    title: string;
    description: string;
    leaderId: number;
    assignedToId: number;
    status: string; // "To Do", "In Progress", "Done"
    priority: string; // "Low", "Medium", "High"
    dueDate: string;
    dateCreated: string;
    comments: string;
}