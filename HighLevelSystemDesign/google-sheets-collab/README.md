# Google Sheets Clone - Collaborative Spreadsheet Application

## High-Level Architecture

### Overview
This project is a collaborative spreadsheet application that mimics core features of Google Sheets. It's built using a modern tech stack with real-time collaboration capabilities and offline support.

### System Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│   React Client  │◄────────►  Express API  │◄────────►   MongoDB   │
│   (Frontend)    │         │   (Backend)   │         │ (Database)  │
└─────────────────┘         └──────────────┘         └─────────────┘
       ▲                          ▲
       │                          │
       │                          │
       └──────────────┬──────────┘
                      │
                   WebSocket
                (Real-time Updates)
```

### Key Components

#### Frontend (React + TypeScript)
- **Components/**
  - `Sheet.tsx`: Main spreadsheet interface with cell editing and formatting
  - `FormattingToolbar.tsx`: Toolbar for text formatting options
  - `Login.tsx` & `Register.tsx`: Authentication interfaces
- **Contexts/**
  - `AuthContext.tsx`: Global authentication state management
- **Types/**
  - Type definitions for cells, cursors, and formatting
- **Utils/**
  - Formula evaluation and cell manipulation utilities
- **Service Workers/**
  - Offline support and caching
  - Background sync for pending changes

#### Backend (Node.js + Express + TypeScript)
- **Routes/**
  - Authentication endpoints (`/auth`)
  - Sheet operations (`/api/sheets`)
- **Models/**
  - User schema with authentication
  - Sheet schema with cell data and permissions
- **Middleware/**
  - Authentication and authorization
  - Request validation
- **Utils/**
  - Formula evaluation
  - CSV import/export

### Key Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - Secure password handling

2. **Spreadsheet Operations**
   - Cell editing and formatting
   - Formula evaluation
   - CSV import/export
   - Real-time collaboration

3. **Data Management**
   - MongoDB for persistent storage
   - Efficient cell data structure
   - Version history

4. **Performance & Scalability**
   - Optimized cell rendering
   - Efficient formula evaluation
   - Pagination for large sheets

### Security Features

1. **Authentication**
   - Secure password hashing
   - JWT token validation
   - Protected API endpoints

2. **Data Protection**
   - Input sanitization
   - CORS configuration
   - Rate limiting

3. **Access Control**
   - Sheet-level permissions
   - User role management
   - Collaboration controls

### Database Schema

#### User Collection
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

#### Sheet Collection
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  cells: [[{
    value: String,
    formula: String,
    displayValue: String,
    format: {
      bold: Boolean,
      // other formatting options
    }
  }]],
  owners: [ObjectId],
  editors: [ObjectId],
  viewers: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

### API Endpoints

#### Authentication
- POST `/auth/register` - User registration
- POST `/auth/login` - User login

#### Sheets
- GET `/api/sheets` - List sheets
- POST `/api/sheets` - Create sheet
- GET `/api/sheets/:id` - Get sheet details
- PUT `/api/sheets/:id/cells/:row/:col` - Update cell
- POST `/api/sheets/import` - Import CSV
- GET `/api/sheets/:id/export` - Export as CSV

### Development Setup

1. Clone the repository
2. Install dependencies for both client and server
3. Set up MongoDB database
4. Configure environment variables
5. Start development servers

### Testing

- Jest for unit and integration tests
- End-to-end testing with user flows
- Model and API route testing

### Future Enhancements

1. Real-time Collaboration
   - WebSocket integration
   - Operational Transformation
   - Cursor tracking

2. Advanced Features
   - Cell comments
   - Rich text formatting
   - Chart creation
   - Template support

3. Performance Optimizations
   - Cell virtualization
   - Formula caching
   - Batch updates

4. Enhanced Security
   - 2FA support
   - API rate limiting
   - Audit logging

## Contributing

See CONTRIBUTING.md for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
