# Signal – Deployment and Configuration Architecture

## 1. Local Development Ports
*   **Frontend (Next.js):** `3000` (Default Next.js dev server)
*   **Backend API (Node.js/Python):** `4000` (Node) or `8000` (Python)
*   *Note: All external services (Supabase, Bright Data, ActionBook, Acontext, Gemini) are cloud-hosted and do not require local ports.*

## 2. Reserved Ports
*   `3000`: Must remain uncontested for local UI development.
*   `4000` / `8000`: Must remain open for the local API server to receive frontend requests.
*   *Environment Adjustment:* If encountering `EADDRINUSE` locally, use `PORT=3001 npm run dev` or `PORT=4001 node server.js` (or python equivalent) and update local environment variables accordingly to match.

## 3. Production Deployment Notes
*   **Externally Hosted Services:** Supabase (Database/Auth), Bright Data (Scraper), ActionBook (Browser Automation), Acontext (Memory), Gemini (LLM).
*   **Irrelevant Ports:** In a production serverless environment (e.g., Vercel, Render), explicit port bindings like `3000` or `4000` are typically abstracted away by the platform's ingress controller.
*   **Reverse Proxy Considerations:** If deployed on a VPS (e.g., DigitalOcean Droplet), Nginx or Caddy will act as a reverse proxy, listening on `80`/`443` and routing traffic to the internal frontend/backend ports.

## 4. Environment Variables (No Secrets)
*   **Frontend Required (.env.local):**
    *   `NEXT_PUBLIC_API_URL`: Points to the Backend API (e.g., `http://localhost:4000` locally, or `https://api.signal-app.com` in production).
    *   `NEXT_PUBLIC_SUPABASE_URL`: Public URL for the database.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous access.
*   **Backend Required (.env):**
    *   `PORT`: `4000` or `8000`.
    *   `SUPABASE_SERVICE_ROLE_KEY`: Secured backend database access.
    *   `BRIGHT_DATA_API_KEY`: Required for web scraping.
    *   `ACTIONBOOK_API_KEY`: Required for fallback browser interaction.
    *   `ACONTEXT_API_KEY`: Required for agent memory snapshots.
    *   `GEMINI_API_KEY`: Required for LLM insight generation.

## 5. Network Flow Explanation
*   **Frontend → Backend:** The React/Next.js client makes a POST request to the backend `/api/scan` endpoint holding only the user context and target URL.
*   **Backend → Supabase:** Fetches the single `latest_snapshot` row before scraping, and performs an `UPSERT` to store the new snapshot and insight after analysis.
*   **Backend → Bright Data:** Fires a synchronous HTTP request to fetch the raw HTML/JSON of the competitor's pricing page.
*   **Backend → ActionBook:** (Fallback only) Invoked if Bright Data fails or encounters a complex captcha block requiring dynamic browser resolution.
*   **Backend → Acontext:** Sends and retrieves necessary contextual variables for the delta analysis.
*   **Backend → Gemini:** Sends the parsed, lightweight JSON delta to the LLM to generate the strategic summary.

## 6. Security Notes
*   **Never Expose API Keys:** `BRIGHT_DATA_API_KEY`, `ACTIONBOOK_API_KEY`, `ACONTEXT_API_KEY`, and `GEMINI_API_KEY` MUST remain securely in the backend `.env`. They should never be prefixed with `NEXT_PUBLIC_` or shipped in the frontend bundle.
*   **Backend Origination:** All outbound calls to Bright Data, Gemini, etc., must originate strictly from the backend server layer to prevent CORS issues, key leakage, and unauthorized scraping.
*   **CORS Configuration:** The backend server must enforce strict CORS policies, only accepting requests from the verified frontend domain (e.g., `http://localhost:3000` locally, or `https://signal-app.com` in production).
