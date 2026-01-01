namespace task_service.Models;

public class TaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "To Do";
    public string Priority { get; set; } = "Low";
    public DateOnly DueDate { get; set; }
    public int AssignedToId { get; set; }
}