# TravelMate Deployment Guide

This guide provides end-to-end instructions for deploying TravelMate to production. Choose the deployment architecture that best fits your needs:

| Option | Best For | Hosting | Cost |
| :--- | :--- | :--- | :--- |
| **Option 1: Decoupled Cloud (Recommended)** | Production web apps, auto-deploys from GitHub | Frontend: **Vercel**<br>Backend: **Render**<br>Database: **MongoDB Atlas** | **Free tier** available |
| **Option 2: Docker Compose** | VPS, DigitalOcean droplet, AWS EC2, or self-hosted | Any Linux server with Docker | ~$4–$6/month VPS |
| **Option 3: All-in-One Container** | Simplest 1-URL deployment without CORS | Render / Railway / Fly.io | **Free tier** available |

---

## Option 1: Decoupled Cloud Deployment (Recommended)

This standard production setup decouples the React frontend (hosted on Vercel's global CDN) and the FastAPI backend (hosted on Render's Python runtime), backed by MongoDB Atlas.

### Step 1: Set up MongoDB Atlas (Free Cloud Database)

1. Sign up or log in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create Deployment** → choose the **M0 Free** cluster (512MB free forever).
3. Set up **Database Access**:
   - Create a database user (e.g. username: `travelmate_user`, create a secure password).
4. Set up **Network Access**:
   - Add IP Address: Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so cloud hosts like Render can reach your database.
5. Click **Connect** → **Drivers (Python)**:
   - Copy the connection URI:
     ```
     mongodb+srv://travelmate_user:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your database user password.

> **Note:** If you want to evaluate or demo without a database first, you can skip MongoDB Atlas and leave `USE_MOCK_DB=true` on the backend.

---

### Step 2: Deploy Backend to Render

1. Sign up or log in at [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`travelmate`).
4. Configure the service settings:
   - **Name:** `travelmate-api` (or your preferred name)
   - **Root Directory:** `backend`
   - **Language / Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Expand **Advanced** → **Add Environment Variables**:

| Key | Recommended Value | Notes |
| :--- | :--- | :--- |
| `USE_MOCK_DB` | `false` | Set to `true` if you skipped MongoDB Atlas |
| `MONGODB_URI` | `mongodb+srv://travelmate_user:...` | Your MongoDB connection string |
| `MONGODB_DB` | `travelmate` | Database name |
| `SEED_ON_STARTUP` | `true` | Pre-populates demo journeys and users on initial startup |
| `JWT_SECRET` | *(generate a random string)* | Run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | 7-day token validity |
| `CORS_ORIGINS` | `*` *(or your Vercel URL)* | Put `*` initially, then restrict to your Vercel domain after Step 3 |

6. Click **Create Web Service**.
7. Wait 2–3 minutes for deployment. Once ready, copy your backend URL (e.g. `https://travelmate-api.onrender.com`).
8. Verify backend health by visiting: `https://travelmate-api.onrender.com/health` (should return `{"status":"ok",...}`).

---

### Step 3: Deploy Frontend to Vercel

1. Sign up or log in at [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`travelmate`).
4. In the project setup screen:
   - **Framework Preset:** `Vite` (automatically detected)
   - **Root Directory:** Click **Edit** and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables**:
   - **Name:** `VITE_API_BASE`
   - **Value:** Your Render backend URL from Step 2 (e.g. `https://travelmate-api.onrender.com` without a trailing slash)
6. Click **Deploy**.
7. In ~1 minute, your site will be live at `https://travelmate-xxxx.vercel.app`.

---

### Step 4: Lock Down CORS on the Backend

Now that your frontend has a permanent domain on Vercel:
1. Go back to your Render dashboard → `travelmate-api` → **Environment**.
2. Update `CORS_ORIGINS` to include your production frontend URL:
   ```
   https://travelmate-xxxx.vercel.app,http://localhost:5173
   ```
3. Save changes. Render will redeploy automatically.

---

## Option 2: Docker Compose (VPS / Self-Hosted)

A pre-configured [`docker-compose.yml`](file:///g:/travelmate/travelmate/docker-compose.yml) is ready to deploy on any server (Ubuntu/Debian VPS, AWS EC2, DigitalOcean, etc.).

### Prerequisites
- Docker Engine 24+ and Docker Compose v2 installed on the target machine.

### Instructions

1. Clone your repository onto the server:
   ```bash
   git clone https://github.com/kartikgupta09877/travelmate.git
   cd travelmate
   ```

2. Generate a secure secret key:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

3. (Optional) Customize environment variables in `docker-compose.yml` or create a `.env` file in the same directory:
   ```env
   JWT_SECRET=your-generated-secret-key-here
   ```

4. Build and start all three containers (MongoDB, Backend, and Frontend):
   ```bash
   docker compose up -d --build
   ```

5. Check container statuses:
   ```bash
   docker compose ps
   ```

6. Access your services:
   - **Frontend:** `http://<your-server-ip>:3000`
   - **Backend API:** `http://<your-server-ip>:8000/api`
   - **Interactive API Docs:** `http://<your-server-ip>:8000/docs`
   - **API Health:** `http://<your-server-ip>:8000/health`

---

## Option 3: All-in-One Service (FastAPI Serving React Frontend)

The FastAPI backend is built to serve the compiled frontend `dist` directory if present:
- Single web service on Render or Railway
- Zero CORS configuration required
- Single domain for both user interface and API

### Steps:
1. In your deployment build script:
   ```bash
   cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
   ```
2. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. FastAPI will serve `/` and client routes through `index.html` while serving `/api/*` for API endpoints.

---

## Post-Deployment Verification Checklist

Once your deployment is complete, run through this quick checklist:

- [ ] **Health Endpoint:** Visit `/health` on the backend and confirm `{"status":"ok"}`.
- [ ] **API Documentation:** Visit `/docs` to inspect the Swagger UI.
- [ ] **Frontend Loading:** Open the frontend URL and verify the landing page renders with styling and map preview.
- [ ] **Demo Login:**
  - Email: `demo@travelmate.app`
  - Password: `password123`
- [ ] **Journey Creation:** Try creating a local commute or long trip from the dashboard.
- [ ] **Matching Check:** Verify route match calculation displays match percentages.
- [ ] **Admin Access:** Log in as `admin@travelmate.app` / `password123` and verify the admin moderation panel.
