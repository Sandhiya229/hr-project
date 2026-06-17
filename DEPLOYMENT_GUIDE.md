# Production Deployment Guide

This guide provides step-by-step instructions to deploy the Employee Management System to production using **MongoDB Atlas** (database), **Render/Railway** (backend), and **Vercel** (frontend).

---

## Part 1: Database Setup (MongoDB Atlas)

To host your database in the cloud:

1. **Sign Up / Log In:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Create a Cluster:** 
   - Choose the **M0 Free** cluster tier.
   - Select your preferred cloud provider (e.g., AWS) and region nearest to your users.
   - Click **Create**.
3. **Database Security (Users):**
   - Create a database user. Note down the **Username** and **Password** (avoid special characters in password to prevent URI parsing issues).
4. **Network Access (IP Whitelist):**
   - Go to **Network Access** -> **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`). 
     > [!NOTE]
     > Cloud providers like Render and Railway use dynamic IP addresses that change frequently. Allowing access from anywhere is required so they can communicate with your database.
5. **Get Connection String:**
   - Go to your Cluster **Database** tab -> click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy the connection string. It will look like this:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/employee-project-management?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the database user credentials you created.

---

## Part 2: Backend Deployment (Render or Railway)

Choose either Render or Railway to deploy your Node.js backend API.

### Option A: Hosting on Render
1. **Prepare Code:** Push your workspace code to a GitHub repository.
2. **Create Web Service:**
   - Log into [Render](https://render.com/).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
3. **Configure Settings:**
   - **Name:** `employee-management-backend`
   - **Runtime:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Add Environment Variables:**
   Under the **Environment** tab, add the following variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (Render will bind to this, but setting it explicitly is good practice)
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET`: `<generate-a-long-random-secret-key>`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app` (Change this to your actual Vercel URL once the frontend is deployed)
   - `EMAIL_USER`: `sandhiyaviswanathan2004@gmail.com`
   - `EMAIL_PASS`: `epzt ndxx zhwt rkoo`
5. **Persistent Disk for File Uploads:**
   Because Render containers are stateless/ephemeral, uploaded files in the `/uploads` directory will be lost on container restart.
   - Go to **Disks** -> **Add Disk**.
   - **Name:** `uploads-volume`
   - **Mount Path:** `/opt/render/project/src/backend/uploads`
   - **Size:** `1 GB` (or larger depending on your needs).
6. **Deploy:** Click **Create Web Service**. Note down the backend service URL (e.g. `https://your-backend.onrender.com`).

---

### Option B: Hosting on Railway
1. **Log In:** Go to [Railway.app](https://railway.app/) and log in.
2. **New Project:** Click **New Project** -> **Deploy from GitHub repo** -> select your repository.
3. **Configure Service:**
   - Click on the service -> Go to **Settings** -> **Root Directory** -> set to `backend`.
4. **Add Environment Variables:**
   Under **Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET`: `<generate-a-long-random-secret-key>`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `EMAIL_USER`: `sandhiyaviswanathan2004@gmail.com`
   - `EMAIL_PASS`: `epzt ndxx zhwt rkoo`
5. **Persistent Volume:**
   - Go to the service **Settings** -> click **Mount Volume**.
   - Mount path: `/app/backend/uploads`.
6. **Deploy:** Deploy the service and copy the public URL generated.

---

## Part 3: Frontend Deployment (Vercel)

To deploy your React SPA frontend:

1. **Log In:** Go to [Vercel](https://vercel.com/) and log in.
2. **Add New Project:** Click **Add New** -> **Project**.
3. **Import Repo:** Connect/import your GitHub repository.
4. **Configure Project Settings:**
   - **Framework Preset:** Select **Vite** (if not automatically detected).
   - **Root Directory:** Edit and select **`frontend`**.
   - **Build and Output Settings:** Keep defaults (`npm run build` and `dist`).
5. **Add Environment Variables:**
   Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api/v1` (or your Railway backend URL)
     > [!IMPORTANT]
     > Ensure there is **no trailing slash** at the end of the URL, and it ends with `/api/v1`.
6. **Deploy:** Click **Deploy**. Vercel will build and launch your application!

---

## Part 4: Verification & Connecting Frontend to Backend

1. **Get Vercel URL:** Once the frontend deploys, copy your Vercel deployment URL (e.g., `https://employee-management-frontend.vercel.app`).
2. **Update Backend CORS:**
   - Go back to Render or Railway settings for your backend service.
   - Update the `FRONTEND_URL` environment variable to match your Vercel URL exactly (e.g., `https://employee-management-frontend.vercel.app`, no trailing slash).
   - Redeploy the backend service.
3. **Test Credentials:**
   - Go to your Vercel URL in your browser.
   - Select the **Administrator** portal.
   - Log in using the default admin credentials:
     - **Email:** `shatechxitsolutions@gmail.com`
     - **Password:** `devsha12`
   - You should be successfully logged in and redirected to the `/admin` dashboard!
