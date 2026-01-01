namespace task_service.Models;
using System.ComponentModel.DataAnnotations;

public class Task {
    [Key]
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int LeaderId { get; set; }
    public int AssignedToId { get; set; }
    public string Status { get; set; } = "To Do"; // Default status is To Do
    public DateOnly DueDate { get; set; }
    public string Priority { get; set; } = "Low"; // Default priority is low
    public DateOnly DateCreated { get; set; } = DateOnly.FromDateTime(DateTime.Now);
    public string Comments { get; set; } = string.Empty;
    
}