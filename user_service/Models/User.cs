namespace user_service.Models;
using System.ComponentModel.DataAnnotations;

public class User {
    [Key]
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";    // Admin, Team Leader, Member
    public bool IsActive { get; set; } = false;
}