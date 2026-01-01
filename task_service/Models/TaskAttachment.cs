namespace task_service.Models;

public class TaskAttachment
{
    public int Id { get; set; }
    public int TaskId { get; set; } 
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public int UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.Now;
}