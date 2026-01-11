**Project Management System (PMS)**

**Project Description**
This project implements a Project Management System (PMS) similar to Jira, developed using a microservices architecture. The system supports user, team, and task management through RESTful APIs and a web-based frontend. All components are containerized using Docker and the application is deployed both locally and on the Google Cloud Platform.

The application is already deployed and accessible online.

**Online Application Access**
Frontend UI: http://34.6.169.37:5000/

**Swagger API documentation**
User API: http://34.6.169.37:5001/swagger/index.html
Team API: http://34.6.169.37:5002/swagger/index.html
Task API: http://34.6.169.37:5003/swagger/index.html

**pgAdmin**
http://34.6.169.37:5050/browser/

**Local Access**
Frontend UI: http://localhost:5000/

**Swagger API documentation**
User API: http://localhost:5001/swagger/index.html
Team API: http://localhost:5002/swagger/index.html
Task API: http://localhost:5003/swagger/index.html

**pgAdmin**
http://localhost:5050/browser/

**Installation and Execution**
The application is executed entirely using Docker and Docker Compose.

**Prerequisites**
Docker
Docker Compose

**Run the application**
From the root directory of the project, run:
docker compose up --build

This command builds and starts all backend APIs, the frontend application, the PostgreSQL database, and pgAdmin.

**Database Instructions**
The application uses PostgreSQL as its database system. Each backend microservice (User, Team, Task) manages its own independent database, following microservices architecture principles. All databases are hosted on a single PostgreSQL server running inside a Docker container.

Database access is implemented using Entity Framework Core, and database schema creation and updates are handled automatically through migrations when each service starts. pgAdmin is provided as a separate container for database inspection and management. No manual database setup is required.

**Database UI Access**
pgAdmin email: admin@pms.com
pgAdmin password: admin

Host Server Name: postgres
Password: password123

**Technologies Used**
**Backend**
- C#
- ASP.NET Core Web API
- REST APIs
- JWT Authentication and Authorization
- BCrypt password hashing
- Entity Framework Core
- Swagger UI

**Frontend**
- React
- TypeScript
- Vite
- Axios
- React Router
- Tailwind CSS
- React Toastify

**Infrastructure**
- Docker
- Docker Compose
- PostgreSQL
- pgAdmin
- Google Cloud Platform (VM-based deployment)

**Repository**
https://github.com/dstathoulias/pms-app

**UI Instructions**
**Login**
- A user can login using either their email or username (automatically detected)
- To login as an Admin use Username: admin, password: admin
- To login as a Team Leader use Username: user_1, password: admin
- To login as a Member use Username: user_2, password: admin

**Signup**
- A user can signup as an Admin (for testing purposes ONLY)
- New users need to be activated by an admin

**Member Dashboard**
- 



- When logged in a Menu button appears at the top right with shortcuts based on role + logout button
- 