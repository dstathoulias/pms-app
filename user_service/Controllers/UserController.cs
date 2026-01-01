using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using user_service.Data;
using user_service.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace user_service.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController(UsersDbContext context, IConfiguration configuration) : ControllerBase {
    private readonly UsersDbContext _context = context;
    private readonly IConfiguration _configuration = configuration;

    // POST: api/user/signup
    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] User newUser) {
        // Prevent DB Crash on duplicate email
        if (await _context.Users.AnyAsync(u => u.Email == newUser.Email))
            return BadRequest("Email already exists.");

        if (await _context.Users.AnyAsync(u => u.Username == newUser.Username))
            return BadRequest("Username already exists.");

        if (string.IsNullOrEmpty(newUser.Role))
            newUser.Role = "Member"; // Default fallback

        // First user is Admin, others are Members
        bool isFirstUser = !await _context.Users.AnyAsync();
        if (isFirstUser || newUser.Role == "Admin")
            newUser.IsActive = true;
        else
            newUser.IsActive = false;

        newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newUser.PasswordHash);

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User registered successfully." });
    }

    // POST: api/user/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request) {
        User? user = null;
        if (!string.IsNullOrEmpty(request.Email))
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        else if (!string.IsNullOrEmpty(request.Username))
            user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        else
            return BadRequest("Email or Username is required.");

        if (user == null)
            return BadRequest("Invalid credentials.");

        if (!user.IsActive) return Unauthorized("Account is not active.");

        return Ok(new { token = GenerateJwtToken(user), message = "Login successful" });
    }

    // GET: api/user
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers() {
        return await _context.Users.ToListAsync();
    }

    // PUT: api/user/{id}/activate (Admin Only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id) {
        return await UpdateUserStatus(id, u => u.IsActive = true, "Activated");
    }

    // PUT: api/user/{id}/deactivate (Admin Only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id) {
        return await UpdateUserStatus(id, u => u.IsActive = false, "Deactivated");
    }

    // PUT: api/user/{id}/promote (Admin Only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/promote")]
    public async Task<IActionResult> PromoteMember(int id) {
        return await UpdateUserStatus(id, u => u.Role = "Team Leader", "Promoted to Team Leader");
    }

    // PUT: api/user/{id}/demote (Admin Only)
    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/demote")]
    public async Task<IActionResult> DemoteMember(int id) {
        return await UpdateUserStatus(id, u => u.Role = "Member", "Demoted to Member");
    }


    private async Task<IActionResult> UpdateUserStatus(int id, Action<User> updateAction, string successMessage) {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");
        
        updateAction(user);
        await _context.SaveChangesAsync();
        return Ok(new { message = successMessage });
    }

    private string GenerateJwtToken(User user) {
        var claims = new List<Claim> {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("role", user.Role),
            new("isActive", user.IsActive.ToString().ToLower()) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}