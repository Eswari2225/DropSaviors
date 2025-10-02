Kavi Integrated Project
Folders:
- frontend: React + Tailwind project (Vite + TypeScript)
- backend.py : Flask backend with API endpoints
- districts_rainfall.csv : dataset (do not change)

Quick start (development):
1. Frontend: open a terminal, cd frontend
   npm install
   npm run dev
   The frontend will run (usually at http://localhost:5173). It will call API at /api/*
2. Backend: in another terminal, create virtualenv and install requirements:
   python3 -m venv venv
   source venv/bin/activate   # on Windows: venv\Scripts\activate
   pip install flask scikit-learn pandas numpy reportlab flask-cors
   python backend.py
   Flask runs at http://127.0.0.1:5000
3. In development, the frontend running on port 5173 will call backend on port 5000. CORS is enabled.
   Update API base URL in frontend fetch calls if needed (currently uses relative '/api/...').

Production build (serve build from Flask):
1. cd frontend
   npm install
   npm run build
2. Copy build output (dist/) into backend static folder or configure Flask to serve the build directory.
   (You can also run a simple static server to serve the build.)

Notes:
- I updated LocationSelector.tsx so the district/subdivision dropdowns are populated from the backend /api/meta endpoint which reads districts from the provided CSV.
- I added /api/predict which accepts JSON {username, district, subdistrict, roof_type, roof_area} and returns JSON results similar to the web form.
- If you want, I can further modify the frontend to call /api/predict and display results client-side (instead of server-rendered pages). For now the change ensures all districts/subdivisions are available.
