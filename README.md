# workflow360

WorkForce 360 — Multi-Tenant Workforce, Attendance, Shift, Leave, Uniform & Operations Management Platform.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic, MySQL, JWT Auth
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS

## Local Setup

### Backend
```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```
