# Deployment Fixes & Troubleshooting Guide

We have identified and fixed several critical issues that were causing the 503 Service Unavailable and Network Errors in your deployment.

## 🛠️ Fixes Applied

### 1. Build Process Fixed
**Issue**: The `npm run build` command was only building the frontend (`vite build`), leaving the backend uncompiled. This meant `dist/server/index.js` did not exist, causing the server to crash immediately on startup.
**Fix**: Updated `package.json` to compile both frontend and backend:
```json
"build": "vite build && npm run build:backend"
```

### 2. Server Static File Serving
**Issue**: The backend was not configured to serve the frontend files in production. If deployed as a single service, the root URL `/` would return a JSON message instead of the app.
**Fix**: Updated `server/index.ts` to serve static files from the `dist` directory and handle the catch-all route for React Router.

### 3. Swagger Configuration
**Issue**: The Swagger documentation was looking for `.ts` files in `src/routes`, which might not exist or be in the correct location in production.
**Fix**: Updated `src/config/swagger.ts` to look for `.js` files in `../routes/` when running in production.

## 🚀 Next Steps

### 1. Redeploy
Push these changes to your repository. Railway should detect the change and trigger a new build.
The new build process will now compile the backend correctly.

### 2. Verify Environment Variables
Ensure the following variables are set in your Railway project settings:

- `DATABASE_URL`: Connection string for your PostgreSQL database.
- `JWT_SECRET`: A long, random string for security.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins.
  - Example: `https://smart-campus-assistant-v-11-production.up.railway.app`
- `NODE_ENV`: Should be set to `production`.

### 3. Troubleshooting
If you still see errors after redeployment:

1. **Check Railway Logs**: Look for "Build Logs" and "Deploy Logs".
   - **Build Logs**: Ensure `tsc` runs without errors.
   - **Deploy Logs**: Look for "Server listening on port..." to confirm startup.

2. **Database Connection**: If the server starts but crashes later, check if `DATABASE_URL` is correct and the database is reachable.

3. **CORS Errors**: If you see CORS errors in the browser console, verify that your frontend URL is exactly listed in `ALLOWED_ORIGINS`.

## 🔍 Understanding the Errors You Saw

- **503 Service Unavailable**: The backend server process crashed or exited because `dist/server/index.js` was missing.
- **Network Error**: The frontend could not reach the backend because the backend was down.
- **Token Refresh Error**: The frontend tried to refresh the session on load, but the request failed because the backend was down.
