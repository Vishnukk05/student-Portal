<div align="center">

# 🎓 EduPortal

### A modern student management portal

**One connected workspace for students, administrators, and academic resources.**

[Getting Started](#-get-started) · [Project Structure](#-project-structure) · [Development](#-development)

</div>

---

## ✨ About

EduPortal is a full-stack student management system built with a React single-page application and a Django REST API. It brings the frontend and backend together in a straightforward local development setup.

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite |
| Backend | Django 5, Django REST Framework |
| Database | SQLite |
| Upload storage | `uploads/` |

## 🚀 Get started

### Prerequisites

Install **Node.js and npm**, plus **Python** with `pip`. Use versions supported by the dependencies in the project.

### Run both services

From the repository root:

```bash
npm install
npm start
```

The development servers will be available at:

- **Web app:** [http://localhost:5173/](http://localhost:5173/)
- **API:** [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)

Stop both services with `Ctrl+C` in the terminal.

> **First run:** If startup reports missing Python packages, install the backend dependencies from `backend/requirements.txt`. If the frontend dependencies are missing, run `npm install` in the appropriate directory.

## 🧑‍💻 Development

You can also run the backend and frontend separately in two terminals.

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

For local development, set a Django secret key in your environment before starting the backend. Do not commit production secrets.

**PowerShell:**

```powershell
$env:DJANGO_SECRET_KEY = "your-local-development-secret"
python manage.py runserver 8000
```

**macOS / Linux:**

```bash
export DJANGO_SECRET_KEY="your-local-development-secret"
python manage.py runserver 8000
```

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project structure

```text
├── backend/                  # Django REST API
│   ├── config/               # Settings, URLs, WSGI, and CORS configuration
│   ├── portal/               # Portal app: views, serializers, models, and URLs
│   ├── manage.py             # Django management commands
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite web application
│   ├── src/
│   │   ├── components/       # Admin and student UI components
│   │   ├── api.js            # API client
│   │   ├── styles.css        # Application styles
│   │   ├── App.jsx           # Application shell
│   │   └── main.jsx          # Frontend entry point
│   └── package.json
├── database/                 # Database schemas and reference data
├── uploads/                  # Uploaded files and media
├── start.js                  # Starts both development servers
├── package.json              # Root npm scripts and dependencies
└── README.md
```

## 🔐 Security notes

- Use a unique, private `DJANGO_SECRET_KEY`; never commit real secrets.
- The Django development server is for local development, not production deployment.
- Review Django's deployment checklist and configure production settings, allowed hosts, HTTPS, and database/media storage before deploying.

## 📄 License

No license is specified in this repository. Contact the repository owner before redistributing or reusing the project.
