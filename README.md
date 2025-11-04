# Post Graduate Supervision System - Backend

This is the backend implementation for the UTMGradient Post Graduate Supervision System.

## Features

- **Authentication**: User login, signup with role-based access (Student, Supervisor, Administrator)
- **User Management**: CRUD operations for users, students, and supervisors
- **Meetings**: Schedule, manage, and track supervision meetings
- **Documents**: Upload, download, and manage documents with weekly submissions
- **Progress Tracking**: Milestones and progress tracking for students
- **Dashboard**: Role-based dashboard statistics

## Tech Stack

- **Next.js 16** - Framework
- **Prisma** - ORM for database management
- **MySQL** - Database
- **TypeScript** - Type safety
- **bcryptjs** - Password hashing

## Setup Instructions

1. **Install Dependencies**

```bash
npm install
# or
pnpm install
```

2. **Set up Environment Variables**

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Update `DATABASE_URL` with your PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@localhost:5432/postgraduate_supervision?schema=public"
```

3. **Set up Database**

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. **Run Development Server**

```bash
npm run dev
```

## Database Schema

The system uses the following main models:

- **User**: Base user account with authentication
- **Student**: Student profile with program and supervisor info
- **Supervisor**: Supervisor profile with department and capacity
- **Meeting**: Supervision meetings between students and supervisors
- **Document**: File uploads and document management
- **Milestone**: Progress milestones for students
- **WeeklySubmission**: Weekly progress submissions

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Users
- `GET /api/users` - List all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `GET /api/users/[id]` - Get user by ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Deactivate user

### Students
- `GET /api/students` - List students
- `GET /api/students/[id]` - Get student details

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/[id]` - Get meeting details
- `PATCH /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Cancel meeting

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document

### Progress
- `GET /api/progress/milestones` - Get milestones
- `POST /api/progress/milestones` - Create milestone
- `PATCH /api/progress/milestones/[id]` - Update milestone
- `DELETE /api/progress/milestones/[id]` - Delete milestone

### Weekly Submissions
- `GET /api/weekly-submissions` - List weekly submissions
- `POST /api/weekly-submissions` - Create submission
- `PATCH /api/weekly-submissions/[id]` - Update submission

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Authentication

The API uses Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

Currently, the token is the user ID (simplified for development). In production, use JWT tokens.

## Role-Based Access

- **STUDENT**: Can access their own data, submit documents, request meetings
- **SUPERVISOR**: Can access their students' data, review submissions, schedule meetings
- **ADMIN**: Full access to all data and user management

## Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Next Steps

1. Set up a PostgreSQL database
2. Configure environment variables
3. Run migrations to create database schema
4. Start the development server
5. Test API endpoints

## Notes

- The authentication system currently uses a simplified token approach. For production, implement proper JWT authentication.
- File uploads currently expect a file URL. In production, implement proper file storage (AWS S3, Cloudinary, etc.).
- Meeting links are generated for Webex integration. Customize based on your video conferencing provider.

