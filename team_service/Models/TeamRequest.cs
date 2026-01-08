namespace team_service.Models;

// Helper class to hold team request information, inheriting from TeamInfo
public class TeamRequest : TeamInfo
{
    public int LeaderId { get; set; }
}