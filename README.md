# Advanced CRM Application 🚀

A world-class, executive-grade CRM solution built for high-performance sales teams. Surpassing standard industry interfaces with a premium design system, real-time analytics, and role-based operational control.

### 🌍 Live Production Deployment
*   **Frontend (Static UI)**: [https://advanced-crm-frontend.onrender.com](https://advanced-crm-frontend.onrender.com)
*   **Backend (API & DB)**: [https://advanced-crm-app.onrender.com](https://advanced-crm-app.onrender.com)
*   **API Health Status**: [Check System Health](https://advanced-crm-app.onrender.com/api/health)

## 💎 Premium UI/UX Architecture
*   **Glassmorphism & Depth**: Sleek `backdrop-blur-xl` data cards floating over deep, ambient background gradients.
*   **Dynamic Micro-Interactions**: Fully integrated with `framer-motion` for staggered cascading reveals, smooth page transitions, and hover-lift dynamics.
*   **Minimalist Luxury**: Executive-grade styling with rounded geometry, rich text-gradients, and custom data visualizations using `recharts`.

## 🔐 Multi-Tenant Role-Based Portals
The application is a full SaaS platform divided into four distinct, secure operational workspaces:

### 🛠️ Platform Ops (Super Admin)
*   **Live System Telemetry**: Real-time infrastructure monitoring (CPU, RAM, DB Latency) polling directly from the backend.
*   **Global Revenue Analytics**: Track global MRR/ARR, subscription tier distribution, and generate CSV financial reports.
*   **Tenant Management**: Provision new organizations, manage global subscription tiers, and monitor live system audit logs.

### 🏢 Organization Admin
*   **Business Command Center**: Full control over billing, agent provisioning, team structures, and advanced security settings.
*   **Unified Analytics**: Fiscal ledgers, comprehensive lead pipelines, and global task tracking across the entire company.

### 📊 Team Manager
*   **Operations Control**: Dedicated dashboards for QA call scoring, team performance analytics, lead routing, and agent monitoring.

### 🎧 Sales Agent
*   **Focused Workspace**: Streamlined interfaces for active calling, an integrated email inbox, daily task Kanban boards, and personal performance metrics.

## 🚀 CI/CD Pipeline

This project uses **GitHub Actions** for Continuous Integration and **Render** for Continuous Deployment.

### How it Works
1.  **CI Pipeline (`ci.yml`)**:
    *   Triggers on every `push` or `pull_request` to `main` and `develop` branches.
    *   **Frontend**: Installs dependencies and runs `npm run build` to catch compilation errors.
    *   **Backend**: Installs dependencies, generates Prisma client, and validates that the Express server starts without crashing.
2.  **Deploy Frontend (`deploy-frontend.yml`)**:
    *   Triggers when changes in the `frontend/` folder are pushed to `main`.
    *   Calls the Render Deploy Hook to trigger an automatic build and deployment.
3.  **Deploy Backend (`deploy-backend.yml`)**:
    *   Triggers when changes in the `backend/` folder are pushed to `main`.
    *   Calls the Render Deploy Hook to trigger an automatic build and deployment.

### 🛠️ Configuration & Secrets

To make the pipeline work, you must add the following **GitHub Secrets** in your repository settings (**Settings > Secrets and variables > Actions > New repository secret**):

| Secret Name | Description |
| :--- | :--- |
| `RENDER_FRONTEND_DEPLOY_HOOK` | The Deploy Hook URL from your Render Frontend service. |
| `RENDER_BACKEND_DEPLOY_HOOK` | The Deploy Hook URL from your Render Backend service. |
| `DATABASE_URL` | Your production/staging database connection string (required for CI validation). |
| `JWT_SECRET` | Secret key for JWT authentication (required for CI validation). |
| `RAZORPAY_KEY_ID` | Your Razorpay API Key ID (required for billing integration). |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API Key Secret (required for secure payment verification). |

### 🔄 How to Manually Rerun Workflows
If a build fails due to transient issues or you want to redeploy manually:
1.  Go to the **Actions** tab in your GitHub repository.
2.  Select the desired workflow (e.g., "Deploy Backend").
3.  Click the **Run workflow** dropdown and select the branch.
4.  Click **Run workflow**.

### 🌍 Render Setup
1.  **Frontend**:
    *   Connect your GitHub repo.
    *   Set **Build Command**: `npm install && npm run build` (ensure you are in the `frontend` root or use Root Directory setting).
    *   Set **Publish Directory**: `dist` (for Vite).
    *   Copy the **Deploy Hook** URL and add it to GitHub Secrets.
2.  **Backend**:
    *   Connect your GitHub repo.
    *   Set **Build Command**: `npm install && npx prisma generate` (ensure you are in the `backend` root).
    *   Set **Start Command**: `npm start`.
    *   Copy the **Deploy Hook** URL and add it to GitHub Secrets.

### 🛡️ Branch Protection Recommendation (Enterprise Standard)
To ensure the stability of the `main` branch, it is highly recommended to:
1.  Go to **Settings > Branches**.
2.  Add a **Branch protection rule** for `main`.
3.  Enable **"Require status checks to pass before merging"**.
4.  Search for and select **Frontend CI** and **Backend CI**.
5.  This ensures that no broken code ever reaches production.
