using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using team_service.Data;
using team_service.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace team_service.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamController(TeamsDbContext context) : ControllerBase {
    private readonly TeamsDbContext _context = context;

    // POST: api/team
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateTeam([FromBody] TeamRequest request) {
        var newTeam = new Team {
            Name = request.Name,
            Description = request.Description,
            LeaderId = request.LeaderId,
            DateOfCreation = DateOnly.FromDateTime(DateTime.Now)
        };

        _context.Teams.Add(newTeam);
        await _context.SaveChangesAsync();

        // Add the leader as a member of the team
        _context.TeamMembers.Add(new TeamMember {
            TeamId = newTeam.Id,
            UserId = request.LeaderId
        });
        await _context.SaveChangesAsync();

        return Ok(newTeam);
    }

    // GET: api/team
    [HttpGet]
    public async Task<IActionResult> GetAllTeams() {
        return Ok(await _context.Teams.Include(t => t.Members).ToListAsync());
    }

    // POST: api/team/{teamId}/members
    [Authorize(Roles = "Team Leader, Admin")] 
    [HttpPost("{teamId}/members")]
    public async Task<IActionResult> AddMember(int teamId, [FromBody] int newMemberUserId) {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);

        var team = await _context.Teams.FindAsync(teamId);
        
        if (team == null) return NotFound("Team not found");

        // Only allow Admins or the Team Leader to add members
        if (!User.IsInRole("Admin") && team.LeaderId != currentUserId)
            return Forbid();

        // Prevent adding the same member twice
        bool alreadyExists = await _context.TeamMembers.AnyAsync(m => m.TeamId == teamId && m.UserId == newMemberUserId);
        if (alreadyExists) 
            return BadRequest("User is already in this team.");

        _context.TeamMembers.Add(new TeamMember {
            TeamId = teamId,
            UserId = newMemberUserId
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Member added successfully" });
    }

    // DELETE: api/team/{teamId}/members/{memberId}
    [Authorize(Roles = "Team Leader,Admin")]
    [HttpDelete("{teamId}/members/{memberId}")]
    public async Task<IActionResult> RemoveMember(int teamId, int memberId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int currentUserId = int.Parse(userIdString!);
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return NotFound("Team not found");

        // Only allow Admins or the Team Leader to remove members
        if (!User.IsInRole("Admin") && team.LeaderId != currentUserId)
            return Forbid();

        // Prevent removing the Team Leader
        if (memberId == team.LeaderId)
        {
            return BadRequest("Cannot remove the Team Leader. Promote another member first.");
        }

        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == memberId);

        if (member == null) return NotFound("Member not found in this team");

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Member removed successfully" });
    }
    
    // GET: api/team/my-teams
    [HttpGet("my-teams")]
    public async Task<IActionResult> GetMyTeams() {
        // Admins can see all teams
        if (User.IsInRole("Admin"))
             return Ok(await _context.Teams.Include(t => t.Members).ToListAsync());

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int userId = int.Parse(userIdString!);

        // Get team ID where the user is a member
        var myTeamIds = await _context.TeamMembers
            .Where(tm => tm.UserId == userId)
            .Select(tm => tm.TeamId)
            .ToListAsync();

        var teams = await _context.Teams
            .Where(t => myTeamIds.Contains(t.Id))
            .Include(t => t.Members)
            .ToListAsync();

        return Ok(teams);
    }

    // PUT: api/team/{teamId}
    [Authorize(Roles = "Admin, Team Leader")]
    [HttpPut("{teamId}")]
    public async Task<IActionResult> EditTeam([FromBody] TeamInfo request, int teamId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return NotFound();

        // Only Admins or the Team Leader can edit team info
        if (!User.IsInRole("Admin")) 
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int currentUserId = int.Parse(userIdString!);

            if (team.LeaderId != currentUserId)
                return Forbid();
        }

        if (!string.IsNullOrEmpty(request.Name)) team.Name = request.Name;
        if (!string.IsNullOrEmpty(request.Description)) team.Description = request.Description;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Team updated successfully" });
    }

    // DELETE: api/team/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTeam(int id)
    {
        var team = await _context.Teams.FindAsync(id);
        if (team == null)
        {
            return NotFound();
        }

        _context.Teams.Remove(team);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}