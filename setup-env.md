# Environment Setup Guide

To fix the "Failed to signin" error, you need to create a `.env` file in the `doc-collab-be` directory with the following content:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (if needed)
MONGODB_URI=mongodb://localhost:27017/docCollab

# Server Configuration
PORT=4050
```

## Steps to fix:

1. Create a `.env` file in the `doc-collab-be` directory
2. Add the above content to the file
3. Replace `your-super-secret-jwt-key-change-this-in-production` with a strong secret key
4. Restart your NestJS server

## What was fixed:

1. **Improved error handling** in `user.service.ts` to provide more specific error messages
2. **Enhanced JWT configuration** in `user.module.ts` to use ConfigService properly
3. **Added JWT secret validation** to catch configuration issues early

The main issue was that the JWT_SECRET environment variable was not configured, causing the JWT signing to fail silently and throw a generic "Failed to signin" error.
