using Microsoft.EntityFrameworkCore;
using team_service.Models;

namespace team_service.Data;

public class TeamsDbContext(DbContextOptions<TeamsDbContext> options) : DbContext(options) {
    public DbSet<Team> Teams { get; set; }
    public DbSet<TeamMember> TeamMembers { get; set; }
}