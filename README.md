# SkillFound - Full-Stack Job Portal for Students & Recruiters

SkillFound is a full-stack, production-grade job portal designed to bridge the gap between job seekers (students) and recruiters. The platform allows students to build profiles, apply to jobs, and track their applications, while recruiters can manage companies, post jobs, and view applicants.

---

## 🔗 Live Demo

- **Frontend**: [https://skillfound-frontend.onrender.com](https://skillfound-frontend.onrender.com)
- **Backend**: [https://skillfound-backend.onrender.com](https://skillfound-backend.onrender.com)

---

## ✨ Features

### For Students:
- ✅ Sign up, login, logout with secure JWT-based authentication (cookie-based)
- ✅ View job listings with filters
- ✅ Apply to jobs with resume upload support
- ✅ View list of applied jobs and statuses
- ✅ Profile page with editable bio, skills, and resume

### For Recruiters:
- ✅ Role-based dashboard access
- ✅ Create, update, delete jobs
- ✅ Register a company, edit its details
- ✅ View applicants for each job with profile and resume access

### Core Features:
- 🔒 Secure authentication with JWT stored in HttpOnly cookies
- 🛂 Role-based routing and access control
- ☁️ Cloudinary integration for resume uploads
- 🔁 Full CRUD support for jobs, companies, and applications
- 🔔 Toast notifications for user feedback
- 💻 Responsive UI with Tailwind CSS
- ♻️ Persistent Redux state via redux-persist
- ⚙️ RESTful APIs with error handling and validation

---

## 🧱 Tech Stack

### Frontend:
- React.js
- Vite
- Tailwind CSS
- Redux Toolkit & Redux Persist
- Axios
- React Router DOM
- Lucide Icons
- Radix UI (Avatar, Dialog, Popover)

### Backend:
- Node.js
- Express.js
- MongoDB + Mongoose
- Cloudinary (resume uploads)
- Multer (file uploads)
- Cookie-parser
- JWT Authentication
- CORS Configuration

### Deployment:
- Render (Frontend + Backend)
- MongoDB Atlas (Cloud DB)

---

## 🚀 Getting Started

### Prerequisites:
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB Atlas Account
- Cloudinary Account

---

## 📦 Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install

2. Environment Variables
Create a .env file inside the backend folder:

PORT=8000
MONGO_URI=<Your MongoDB URI>
CLOUD_NAME=<Cloudinary Cloud Name>
API_KEY=<Cloudinary API Key>
API_SECRET=<Cloudinary API Secret>
SECRET_KEY=<JWT Secret Key>
FRONTEND_URL=https://skillfound-frontend.onrender.com

### 🔧 Backend
Create a .env file inside the backend/ folder:

ini
PORT=8000
MONGO_URI=<Your MongoDB URI>
CLOUD_NAME=<Cloudinary Cloud Name>
API_KEY=<Cloudinary API Key>
API_SECRET=<Cloudinary API Secret>
SECRET_KEY=<JWT Secret Key>
FRONTEND_URL=https://skillfound-frontend.onrender.com
▶️ Run the Backend Server
bash
Copy
Edit
cd backend
npm install
npm run dev
🧩 Frontend Setup
1. Install Dependencies
bash
Copy
Edit
cd frontend
npm install
2. Environment Variables
Create a .env file inside the frontend/ folder:

ini
Copy
Edit
VITE_BACKEND_URL=https://skillfound-backend.onrender.com
3. Start the Development Server
bash
Copy
Edit
npm run dev
🗂️ Folder Structure
Backend
bash
Copy
Edit
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── index.js
└── .env
Frontend
bash
Copy
Edit
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── redux/
│   ├── hooks/
│   ├── App.jsx
│   └── main.jsx
🔐 Authentication
JWT tokens are stored securely in HttpOnly, Secure, SameSite=None cookies.

isAuthenticated, isRecruiter middlewares protect routes based on roles.

Supports automatic login/logout by checking cookie presence across sessions.

💡 Deployment Notes
✅ MongoDB Whitelist: Add Render's dynamic IPs to MongoDB Atlas IP whitelist (0.0.0.0/0 for dev)

✅ Render CORS: Set Access-Control-Allow-Origin to https://skillfound-frontend.onrender.com in backend CORS config

✅ Resume Uploads: Handled via Multer → Cloudinary and linked in the user profile schema

✅ Render Setup:

Add .env in both services using Render's Environment tab

Set build command for frontend: npm run build

Set start command for frontend: serve -s dist (after installing serve)

Set start command for backend: node index.js

📅 Upcoming Improvements
⏳ Pagination and filtering on job listings

📊 Admin analytics dashboard for recruiters

📧 Email verification and password reset

🔍 Search by company name or skill tags

👤 Author
Dhairya Shah
🔗 LinkedIn
🔗 GitHub
