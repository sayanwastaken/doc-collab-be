# Doc Collab Backend (doc-collab-be)

A backend service for collaborative document management, built with [NestJS](https://nestjs.com/), TypeScript, and MongoDB. This project provides user registration, authentication, and user management APIs, with robust error handling and modular architecture.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [Database Configuration](#database-configuration)
- [User Module](#user-module)
  - [User Schema](#user-schema)
  - [Registration (Signup) Flow](#registration-signup-flow)
  - [Authentication (Signin) Flow](#authentication-signin-flow)
  - [Forgot Password & OTP Flow](#forgot-password-otp-flow)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Extending the Project](#extending-the-project)
- [Support and Resources](#support-and-resources)
- [Collaborative Editing with Yjs and y-websocket](#collaborative-editing-with-yjs-and-y-websocket)
  - [Backend Setup](#backend-setup)
  - [Frontend Usage Example](#frontend-usage-example)
  - [Notes](#notes)

---

## Overview

**doc-collab-be** is the backend for a collaborative document platform. It provides RESTful APIs for user management, authentication, and lays the foundation for document collaboration features. The project is designed for scalability, security, and ease of extension.

## Features

- User registration and authentication (JWT-based)
- Secure password hashing (bcrypt)
- MongoDB integration via Mongoose
- Modular, service-oriented architecture (NestJS)
- Global and module-specific error handling
- Environment-based configuration
- Ready for extension with new modules (e.g., document management)

## Technology Stack

- **Node.js** (TypeScript)
- **NestJS** (v11)
- **MongoDB** (via Mongoose)
- **JWT** for authentication
- **bcrypt** for password security
- **Jest** for testing
- **ESLint/Prettier** for code quality

## Project Structure

```
doc-collab-be/
  src/
    app.controller.ts        # Root controller
    app.module.ts            # Root module
    app.service.ts           # Root service
    main.ts                  # Entry point
    users/                   # User module (controllers, services, DTOs, exceptions, types)
    models/mongo/            # Mongoose schemas
    configs/db/              # Database config module
    common/filters/          # Global exception filter
    utils/                   # Utility functions (e.g., password hashing)
  test/                      # Test files
  setup-env.md               # Environment setup guide
  package.json               # Dependencies and scripts
  tsconfig*.json             # TypeScript configs
  nest-cli.json              # NestJS CLI config
```

## Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/docCollab
MONGO_URI=mongodb://localhost:27017/docCollab   # (used in code)
MONGO_DB_NAME=docCollab                        # (used in code)

# Server Configuration
PORT=4050

# SMTP Configuration (for email OTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

> **Note:** `MONGODB_URI` is referenced in the setup guide, but the code uses `MONGO_URI` and `MONGO_DB_NAME` for configuration. Ensure both are set for compatibility.

## Running the Project

Install dependencies:

```bash
npm install
```

Start the server (development):

```bash
npm run start:dev
```

Start the server (production):

```bash
npm run start:prod
```

Run tests:

```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:cov     # Test coverage
```

## Database Configuration

MongoDB is configured using the `MongoModule` in `src/configs/db/mongo.module.ts`:

- Uses `MONGO_URI` and `MONGO_DB_NAME` from environment variables.
- Connects via Mongoose with async configuration.

## User Module

### User Schema

Defined in `src/models/mongo/user.schema.ts`:

```ts
@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
}
```

- **name**: User's display name
- **email**: Unique email address
- **password**: Hashed password (never stored in plain text)

### Registration (Signup) Flow

1. **Validation**: Incoming data is validated using DTOs and class-validator decorators.
2. **Duplicate Check**: Checks if a user with the given email already exists.
3. **Password Hashing**: Password is hashed using bcrypt with 10 salt rounds.
4. **User Creation**: New user is saved to MongoDB.
5. **Response**: Returns user info (excluding password).
6. **Error Handling**: Duplicate emails and other errors are handled with meaningful messages.

### Authentication (Signin) Flow

1. **Validation**: Credentials are validated using DTOs.
2. **User Lookup**: Finds user by email.
3. **Password Check**: Compares provided password with stored hash using bcrypt.
4. **JWT Issuance**: On success, issues access and refresh tokens (JWT), signed with `JWT_SECRET`.
5. **Response**: Returns user info and tokens.
6. **Error Handling**: Handles user not found, invalid password, and JWT misconfiguration.

### Forgot Password & OTP Flow

1. **Request OTP**: User submits their email to receive an OTP for password reset.
2. **OTP Sent**: System generates a 6-digit OTP, stores it in the user's MongoDB record (valid for 10 minutes), and sends it to the user's email.
3. **Verify OTP**: User submits the OTP and email to verify.
4. **Reset Password**: On successful OTP verification, user submits a new password along with the OTP and email to reset their password.

> **Note:** OTPs are now stored in MongoDB as part of the user document for persistence and scalability.

## Error Handling

- **GlobalExceptionFilter**: Catches unhandled exceptions, logs them, and returns structured error responses.
- **UserExceptionFilter**: Handles MongoDB duplicate key errors (e.g., duplicate email) with user-friendly messages.
- **ValidationPipe**: Ensures all incoming data is validated and errors are reported clearly.

## API Endpoints

### User Endpoints

- `GET /api/v1/doc-collab/users?page=1&limit=10`  
  List users (paginated)
- `POST /api/v1/doc-collab/users/signup`  
  Register a new user
  - Body: `{ name, email, password }`
- `POST /api/v1/doc-collab/users/signin`  
  Authenticate user
  - Body: `{ email, password }`
- `POST /api/v1/doc-collab/users/forgot-password`  
  Request an OTP for password reset
  - Body: `{ email }`
- `POST /api/v1/doc-collab/users/verify-otp`  
  Verify OTP for password reset
  - Body: `{ email, otp }`
- `POST /api/v1/doc-collab/users/reset-password`  
  Reset password using OTP
  - Body: `{ email, otp, newPassword }`

#### Example Signup Request

```json
POST /api/v1/doc-collab/users/signup
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

#### Example Signin Request

```json
POST /api/v1/doc-collab/users/signin
{
  "email": "alice@example.com",
  "password": "securePassword123"
}
```

#### Example Signin Response

```json
{
  "user": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### Example Forgot Password Request

```json
POST /api/v1/doc-collab/users/forgot-password
{
  "email": "alice@example.com"
}
```

#### Example Verify OTP Request

```json
POST /api/v1/doc-collab/users/verify-otp
{
  "email": "alice@example.com",
  "otp": "123456"
}
```

#### Example Reset Password Request

```json
POST /api/v1/doc-collab/users/reset-password
{
  "email": "alice@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword456"
}
```

#### Example Success Response

```json
{
  "message": "Password reset successful"
}
```

## Extending the Project

- Add new modules (e.g., document collaboration) by creating new directories in `src/` and registering them in `app.module.ts`.
- Use NestJS providers, controllers, and services for modularity.
- Follow the existing patterns for DTOs, validation, and error handling.

## Support and Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [NestJS Discord](https://discord.gg/G7Qnnhy)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Mongoose Docs](https://mongoosejs.com/docs/)

## Collaborative Editing with Yjs and y-websocket

This project includes a built-in collaborative editing backend using [Yjs](https://github.com/yjs/yjs) and a custom y-websocket server with LevelDB persistence. This enables real-time collaborative features (such as a whiteboard or document editor) out of the box.

### Backend Setup

1. **Install dependencies** (already included in package.json):

   ```sh
   npm install y-websocket y-leveldb ws yjs
   ```

2. **How it works:**

   - The NestJS backend starts a WebSocket server on port `1234` using a custom `YWebsocketService`.
   - Documents are persisted using LevelDB in the `./yjs-docs` folder.
   - The server uses a local `setupWSConnection` utility for handling Yjs document sync and persistence.

3. **No additional configuration is needed**—the service starts automatically with your NestJS app.

### Frontend Usage Example

To connect a collaborative client (e.g., a whiteboard or editor):

```js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  'ws://localhost:1234/roomname',
  'roomname',
  ydoc,
);

// Use ydoc to manage your collaborative state (shapes, text, etc.)
```

- Replace `'roomname'` with a unique identifier for each collaborative session.

### Notes

- The backend uses LevelDB for persistence. All collaborative data is stored in the `./yjs-docs` directory.
- The implementation uses a custom `setupWSConnection` utility for basic Yjs document sync. For advanced features (awareness, authentication, etc.), further customization may be needed.
- The WebSocket server runs independently of the REST API and can be accessed at `ws://localhost:1234/roomname`.

---

**Author:** [Sayan Das]

**License:** UNLICENSED (see `package.json`)
