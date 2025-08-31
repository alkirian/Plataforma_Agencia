# Cadence - Agencia Platform

## Project Overview

Cadence is a full-stack web application for managing clients, schedules, and documents for creative agencies. It consists of:

- **Frontend**: React (Vite) application with modern UI components
- **Backend**: Node.js + Express API server
- **Database**: Supabase (PostgreSQL) with integrated storage and authentication

The platform allows agencies to manage their clients, organize schedules, store and process documents with AI capabilities, and maintain activity feeds.

## Architecture

### Backend (Node.js + Express)
- REST API with Express.js
- Supabase integration for database operations and authentication
- Document processing pipeline with AI capabilities (PDF/DOCX parsing, image analysis, embeddings)
- Modular route structure with controllers and services
- Authentication middleware using JWT tokens
- Environment-based configuration

### Frontend (React + Vite)
- Component-based architecture with React and JSX
- React Router for client-side routing
- TanStack Query (React Query) for data fetching and state management
- Tailwind CSS for styling with custom design system
- Framer Motion for animations
- Supabase client for real-time data and authentication
- Comprehensive document management UI with drag-and-drop support

## Key Features

1. **Client Management**
   - Create and manage client profiles
   - View client details and activity feeds

2. **Document Management**
   - Upload documents (PDF, DOCX, images)
   - AI-powered document processing (text extraction, embeddings)
   - Document storage in Supabase
   - Document viewing in board or list formats
   - Drag-and-drop upload support

3. **Scheduling**
   - Calendar-based scheduling system
   - FullCalendar integration for events

4. **AI Capabilities**
   - Document content analysis
   - Image description with GPT-4 Vision
   - Text embedding generation for semantic search

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Supabase account and project
- OpenAI API key (for AI features)

### Environment Configuration

#### Backend (.env)
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

#### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Installation and Running

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

Default ports:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## API Structure

The backend API is organized into modules:
- `/api/v1/clients` - Client management
- `/api/v1/documents` - Document operations
- `/api/v1/schedule` - Calendar/scheduling
- `/api/v1/ai` - AI processing features
- `/api/v1/users` - User management
- `/api/v1/agencies` - Agency operations

## Data Flow

1. **Document Upload Process**:
   - Frontend uploads file to Supabase storage
   - Backend creates document record in database
   - Backend triggers AI processing pipeline
   - Document is parsed and embedded for search

2. **Authentication**:
   - Supabase handles user authentication
   - JWT tokens are used for API authorization
   - Each request is validated through middleware

## Development Conventions

### Code Style
- JavaScript with ES6+ features
- Modular code organization (controllers, services, routes)
- Consistent error handling with try/catch blocks
- Comprehensive logging for debugging

### Frontend Patterns
- Component-based architecture
- React hooks for state management
- Custom hooks for reusable logic
- React Query for server state management
- Framer Motion for animations

### Backend Patterns
- Express.js middleware architecture
- Controller-service pattern
- Supabase client for database operations
- Environment-based configuration
- Comprehensive error handling middleware

## Testing

Currently, the project doesn't have a formal testing setup. Tests would need to be added using:
- Jest for backend unit tests
- React Testing Library for frontend component tests
- Cypress or Playwright for end-to-end tests

## Deployment

### Backend
The backend can be deployed to any Node.js hosting platform (Vercel, Render, Heroku, etc.).

### Frontend
The frontend can be built and deployed as a static site to CDNs or hosting platforms like Vercel, Netlify, or GitHub Pages.

## Important Notes
- Both frontend and backend must use the SAME Supabase project
- Profile table can be named either `profiles` or `profile` - the backend detects both
- OpenAI API key is required for document AI processing features
- Document storage uses Supabase Storage with a bucket named "documents"