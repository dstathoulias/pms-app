using Microsoft.EntityFrameworkCore;
using user_service.Models;

namespace user_service.Data;

public class UsersDbContext(DbContextOptions<UsersDbContext> options) : DbContext(options) {
    public DbSet<User> Users { get; set; }
}