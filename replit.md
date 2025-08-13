# Overview

This is a clean, minimal fullstack JavaScript application serving as a blank starting point for web development. The application features a React frontend served via CDN and a simple Node.js HTTP server backend with in-memory storage for demonstration purposes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19 served via CDN for simplicity
- **Build**: No build process - direct HTML with Babel standalone for JSX transformation
- **Styling**: Tailwind CSS via CDN for responsive design
- **State Management**: React hooks (useState, useEffect) for local state
- **API Communication**: Native fetch API for backend communication

## Backend Architecture
- **Runtime**: Node.js HTTP server without external frameworks
- **API Design**: RESTful endpoints with JSON responses
- **Storage**: In-memory storage for demonstration purposes
- **CORS**: Manual CORS headers for cross-origin requests
- **Development**: Direct Node.js execution without transpilation

## Data Management
- **Storage**: Simple in-memory JavaScript arrays
- **Schema**: Basic JavaScript objects with id, title, description, createdAt
- **Validation**: Basic server-side validation for required fields
- **Persistence**: Data resets on server restart (development feature)

## API Endpoints
- **GET /api/health**: Server status and health check
- **GET /api/hello**: Simple hello world endpoint
- **GET /api/items**: Retrieve all items from storage
- **POST /api/items**: Create new items with title and description
- **GET /**: Serves the React application HTML

## Development Setup
- **Server**: http-server.js runs on port 5000
- **Frontend**: Single HTML file with inline React components
- **Dependencies**: Minimal Node.js built-in modules only
- **CORS**: Enabled for localhost development

# External Dependencies

## CDN Libraries
- **React**: React 19 development build from unpkg CDN
- **ReactDOM**: React DOM 19 for rendering from unpkg CDN
- **Babel Standalone**: Client-side JSX transformation from unpkg CDN
- **Tailwind CSS**: Utility-first CSS framework from CDN

## Node.js Built-ins
- **http**: Native HTTP server functionality
- **fs**: File system operations for serving HTML
- **path**: Path manipulation utilities
- **url**: URL parsing for request routing

## Development & Deployment
- **No Build Process**: Direct HTML serving with runtime compilation
- **No Package Manager**: Pure Node.js without external dependencies
- **Replit Ready**: Designed to work on Replit environment out-of-the-box
- **Port Configuration**: Configured for 0.0.0.0:5000 binding

## Startup Instructions
To run the application:
1. Execute `node http-server.js` in the project root
2. Access the app at http://localhost:5000 or your Replit domain
3. API endpoints available at /api/* paths
4. Frontend served from root path with full React functionality