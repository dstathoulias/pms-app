namespace team_service.Models;
using System.ComponentModel.DataAnnotations;

public class TeamMember {
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TeamId { get; set; }
}