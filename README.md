# Student Management System - EduPortal

> **Clean Architecture:**
> - **Backend:** Django 5 + Django REST Framework (`backend/`)
> - **Frontend:** React 18 + Vite SPA (`frontend/`)
> - **Database:** SQLite (`backend/student_portal.sqlite3`)
> - **Media & Uploads:** Dedicated storage (`uploads/`)

---

## 🚀 Quick Start (Single Command)

In the root directory, simply run:

```bash
npm start
```

This single command automatically starts **both**:
1. **Django REST Backend** at `http://127.0.0.1:8000/api/`
2. **React Frontend** at `http://localhost:5173/`

*(Press `Ctrl + C` in the terminal to stop both servers simultaneously).*

---

## 🛠️ Running Individually (Alternative)

If you prefer to run each service in separate terminals:

### 1. Backend (Django)
```powershell
cd backend
$env:DJANGO_SECRET_KEY="replace-with-a-long-random-production-secret"
python manage.py runserver 8000
```

### 2. Frontend (React)
```powershell
cd frontend
npm run dev
```

---

## 🔐 Default Credentials

| Role | Username / Identifier | Password |
| :--- | :--- | :--- |
| **Admin** | `rony@eduportal.edu` | `admin123` |
| **Student** | `STU001` (Rahul Kumar) | `student123` |
| **Student** | `STU002` (Priya Sharma) | `student123` |
| **Student** | `STU003` (Amit Patel) | `student123` |
| **Student** | `STUD2026001` (Vishnu) | `student123` |

---

## 📂 Project Structure

```text
├── backend/            # Django 5 + DRF Backend
│   ├── config/         # Django settings, WSGI, URLs, CORS config
│   ├── portal/         # Views, serializers, models, authentication, URLs
│   ├── manage.py       # Django management script
│   ├── requirements.txt# Python dependencies
│   └── student_portal.sqlite3 # Active SQLite database
├── frontend/           # React 18 + Vite SPA Frontend
│   ├── src/
│   │   ├── components/ # Admin & Student modular views, Modals, Sidebar, Toasts
│   │   ├── api.js      # Universal authenticated API client
│   │   ├── styles.css  # Modern responsive design system
│   │   ├── App.jsx     # Master application shell
│   │   └── main.jsx    # React bootstrap
│   ├── package.json
│   └── vite.config.js
├── database/           # Database schemas and reference database
├── uploads/            # Academic files, profile photos, and ticket attachments
├── start.js            # Dual-server concurrent runner
├── package.json        # Root npm configuration (powers npm start)
└── README.md           # Documentation & instructions
```
