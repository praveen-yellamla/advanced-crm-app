# Advanced CRM Application 🚀

A world-class, executive-grade CRM solution built for high-performance sales teams. Surpassing standard industry interfaces with a premium design system, real-time analytics, and role-based operational control.

### 🌍 Live Production Deployment
*   **Frontend (Static UI)**: [https://advanced-crm-frontend.onrender.com](https://advanced-crm-frontend.onrender.com)
*   **Backend (API & DB)**: [https://advanced-crm-app.onrender.com](https://advanced-crm-app.onrender.com)
*   **API Health Status**: [Check System Health](https://advanced-crm-app.onrender.com/api/health)

## 🏗️ Day 2 Architecture Review
*   **Elite UI/UX**: Minimalist luxury aesthetic with rounded geometry and clean executive spacing.
*   **Role-Based Access (RBAC)**: Secure multi-portal entry for Admin, Manager, and Agent workflows.
*   **Executive Dashboard**: Real-time sales intelligence, automated AI insights, and live operations tracking.
*   **Production Infrastructure**: Fully deployed on **Render** using a high-performance PostgreSQL (Prisma) backend.

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
