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

    // POST: api/team (Admin Only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateTeam([FromBody] TeamRequest request) {
        // 1. Create Team
        var newTeam = new Team {
            Name = request.Name,
            Description = request.Description,
            LeaderId = request.LeaderId,
            DateOfCreation = DateOnly.FromDateTime(DateTime.Now)
        };

        _context.Teams.Add(newTeam);
        await _context.SaveChangesAsync();

        // 2. Auto-add the Leader as a Member
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

    // POST: api/team/{teamId}/members (Leader Only)
    // 1. Update Attribute to allow Admins
[Authorize(Roles = "Team Leader, Admin")] 
[HttpPost("{teamId}/members")]
public async Task<IActionResult> AddMember(int teamId, [FromBody] int newMemberUserId) {
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    int currentUserId = int.Parse(userIdString!);

    var team = await _context.Teams.FindAsync(teamId);
    
    if (team == null) return NotFound("Team not found");

    // 3. SECURITY LOGIC:
    // If the user is NOT an Admin AND they are NOT the leader of this team, block them.
    if (!User.IsInRole("Admin") && team.LeaderId != currentUserId)
        return Forbid();

    // SIMPLIFIED CHECK: Ensure not adding duplicates (Good practice)
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

    [Authorize(Roles = "Team Leader,Admin")] // 1. Allow Admins
[HttpDelete("{teamId}/members/{memberId}")]
public async Task<IActionResult> RemoveMember(int teamId, int memberId)
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    int currentUserId = int.Parse(userIdString!);

    var team = await _context.Teams.FindAsync(teamId);
    if (team == null) return NotFound("Team not found");

    // 2. SECURITY CHECK: Authorization
    // If not Admin AND not the Team Leader -> Block
    if (!User.IsInRole("Admin") && team.LeaderId != currentUserId)
        return Forbid();

    // 3. LOGIC CHECK: Prevent Leader Removal
    // You cannot remove the person who is currently the leader (even if you are Admin, usually)
    // because a team must have a leader.
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
        if (User.IsInRole("Admin"))
             return Ok(await _context.Teams.Include(t => t.Members).ToListAsync());

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int userId = int.Parse(userIdString!);

        // Efficient Query: Get teams where I am a member
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

    // PUT: api/team/{teamId} (Admin OR Leader)
    [Authorize(Roles = "Admin, Team Leader")]
    [HttpPut("{teamId}")]
    public async Task<IActionResult> EditTeam([FromBody] TeamInfo request, int teamId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null) return NotFound();

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

    [Authorize(Roles = "Admin")] // Strict Admin Access
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