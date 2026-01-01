using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using task_service.Data;
using task_service.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Google.Cloud.Storage.V1;

namespace task_service.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaskController(TasksDbContext context, IConfiguration configuration) : ControllerBase {
    private readonly TasksDbContext _context = context;
    private readonly IConfiguration _configuration = configuration;

    [HttpPost]
    [Authorize(Roles = "Team Leader")]
    public async Task<IActionResult> CreateTask([FromBody] TaskRequest request)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int leaderId = int.Parse(userIdString!);

        var newTask = new Models.Task
        {
            Title = request.Title,
            Description = request.Description,
            LeaderId = leaderId,
            AssignedToId = request.AssignedToId,
            Status = request.Status,
            Priority = request.Priority,
            DateCreated = DateOnly.FromDateTime(DateTime.Now),
            DueDate = request.DueDate
        };

        _context.Tasks.Add(newTask);
        await _context.SaveChangesAsync();

        return Ok(newTask);
    }

    [HttpPut("{taskId}")]
    [Authorize(Roles = "Team Leader")]
    public async Task<IActionResult> EditTask([FromBody] TaskRequest request, int taskId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);

        if (task.LeaderId != currentUserId)
            return Forbid();

        if (!string.IsNullOrEmpty(request.Title)) task.Title = request.Title;
        if (!string.IsNullOrEmpty(request.Description)) task.Description = request.Description;
        if (!string.IsNullOrEmpty(request.Status)) task.Status = request.Status;
        if (!string.IsNullOrEmpty(request.Priority)) task.Priority = request.Priority;
        if (request.DueDate != default) task.DueDate = request.DueDate;
        if (request.AssignedToId >= 0) task.AssignedToId = request.AssignedToId;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Task updated successfully" });
    }

    [HttpDelete("{taskId}")]
    [Authorize(Roles = "Team Leader")]
    public async Task<IActionResult> RemoveTask(int taskId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);

        if (task.LeaderId != currentUserId)
            return Forbid();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Task deleted successfully" });
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetTasks(
        [FromQuery] int? leaderId,
        [FromQuery] int? assignedToId)
    {
        var query = _context.Tasks.AsQueryable();

        if (leaderId.HasValue)
        {
            query = query.Where(t => t.LeaderId == leaderId.Value);
        }

        if (assignedToId.HasValue)
        {
            query = query.Where(t => t.AssignedToId == assignedToId.Value);
        }

        if (!leaderId.HasValue && !assignedToId.HasValue && !User.IsInRole("Admin"))
        {
            return BadRequest("You must specify a Team or User.");
        }

        var tasks = await query
            .OrderBy(t => t.DueDate)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpPut("{taskId}/status")]
    [Authorize(Roles = "Team Leader, Member")]
    public async Task<IActionResult> UpdateTaskStatus(int taskId,[FromBody] string status)
    {
        if (string.IsNullOrEmpty(status)) 
            return BadRequest("You must specify the task status");

        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        if (task.Status == status)
            return BadRequest($"Current task status is already '{status}'.");

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);

        if (task.LeaderId != currentUserId && task.AssignedToId != currentUserId)
            return Forbid();

        task.Status = status;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Task status updated successfully", status = task.Status });
    }

    [HttpGet("{taskId}")]
    [Authorize]
    public async Task<IActionResult> ViewTask(int taskId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        return Ok(task);
    }

    [HttpPut("{taskId}/comment")]
    [Authorize(Roles = "Team Leader, Member")]
    public async Task<IActionResult> AddTaskComment(int taskId,[FromBody] string comment)
    {
         if (string.IsNullOrEmpty(comment)) 
            return BadRequest("Your comment is empty");

        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);

        if (task.LeaderId != currentUserId && task.AssignedToId != currentUserId)
            return Forbid();

        string roleLabel = (currentUserId == task.LeaderId) ? "Team Leader" : "Member";
        string formattedComment = $"[{DateTime.Now:g}] {roleLabel} (User {currentUserId}): {comment}";

        if (string.IsNullOrEmpty(task.Comments))
            task.Comments = formattedComment;
        else
            task.Comments += "\n\n" + formattedComment;
        
        await _context.SaveChangesAsync();
        return Ok(new { message = "Comment added", comment = task.Comments });
    }

    [HttpPost("{taskId}/attachments")]
    [Authorize(Roles = "Team Leader, Member")]
    public async Task<IActionResult> UploadAttachment(int taskId, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound("Task not found.");

        // Security Check
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);
        
        if (task.LeaderId != currentUserId && task.AssignedToId != currentUserId)
            return StatusCode(403, "Not authorized.");

        var storage = await StorageClient.CreateAsync();
        var bucketName = _configuration["GCP:BucketName"];
        
        var objectName = $"{taskId}/{Guid.NewGuid()}_{file.FileName}";

        using (var stream = file.OpenReadStream())
        {
            await storage.UploadObjectAsync(bucketName, objectName, file.ContentType, stream);
        }

        var attachment = new TaskAttachment
        {
            TaskId = taskId,
            FileName = file.FileName, 
            FilePath = objectName,
            UploadedByUserId = currentUserId,
            UploadedAt = DateTime.Now
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "File uploaded to Cloud", attachmentId = attachment.Id });
    }

    [HttpGet("{taskId}/attachments")]
    [Authorize]
    public async Task<IActionResult> GetTaskAttachments(int taskId)
    {
        var attachments = await _context.Attachments
            .Where(a => a.TaskId == taskId)
            .Select(a => new { a.Id, a.FileName, a.UploadedAt, a.UploadedByUserId })
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpGet("attachments/{attachmentId}")]
    [Authorize]
    public async Task<IActionResult> DownloadAttachment(int attachmentId)
    {
        var attachment = await _context.Attachments.FindAsync(attachmentId);
        if (attachment == null) return NotFound("Attachment not found.");

        var storage = await StorageClient.CreateAsync();
        var bucketName = _configuration["GCP:BucketName"];

        var stream = new MemoryStream();
        await storage.DownloadObjectAsync(bucketName, attachment.FilePath, stream);
        stream.Position = 0;

        return File(stream, "application/octet-stream", attachment.FileName);
    }
}