using Microsoft.EntityFrameworkCore;
using task_service.Models;

namespace task_service.Data;

public class TasksDbContext(DbContextOptions<TasksDbContext> options) : DbContext(options) {
    public DbSet<Models.Task> Tasks { get; set; }   // Explicit declaration of Task due to ambiguity
    public DbSet<TaskAttachment> Attachments { get; set; }
}