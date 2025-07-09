# SkillFound - Full-Stack Job Portal for Students & Recruiters

SkillFound is a full-stack, production-grade job portal designed to bridge the gap between job seekers (students) and recruiters. The platform allows students to build profiles, apply to jobs, and track their applications, while recruiters can manage companies, post jobs, and view applicants.

Live Demo:

- Frontend: [https://skillfound-frontend.onrender.com](https://skillfound-frontend.onrender.com)
- Backend: [https://skillfound-backend.onrender.com](https://skillfound-backend.onrender.com)

---

## ✨ Features

### For Students:

- Sign up, login, logout with secure JWT-based authentication (cookie-based)
- View job listings with filters
- Apply to jobs with resume upload support
- View list of applied jobs and statuses
- Profile page with editable bio, skills, and resume

### For Recruiters:

- Role-based dashboard access
- Create, update, delete jobs
- Register a company, edit its details
- View applicants for each job with profile and resume access

### Core Features:

- Secure authentication with JWT stored in HttpOnly cookies
- Role-based routing and access control
- Cloudinary integration for resume uploads
- Full CRUD support for jobs, companies, and applications
- Toast notifications for user feedback
- Responsive UI with Tailwind CSS
- Persistent Redux state via redux-persist
- RESTful APIs with error handling and validation

---

## 📄 Tech Stack

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

### Clone the Repository:

```bash
git clone https://github.com/dhairya0609/SkillFound.git
cd SkillFound
```

---

## 📦 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file inside the `backend` folder:

```env
PORT=8000
MONGO_URI=<Your MongoDB URI>
CLOUD_NAME=<Cloudinary Cloud Name>
API_KEY=<Cloudinary API Key>
API_SECRET=<Cloudinary API Secret>
SECRET_KEY=<JWT Secret Key>
FRONTEND_URL=https://skillfound-frontend.onrender.com
```

### 3. Run the Server

```bash
npm run dev
```

---

## 📆 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env` file inside the `frontend` folder:

```env
VITE_BACKEND_URL=https://skillfound-backend.onrender.com
```

### 3. Start the Development Server

```bash
npm run dev
```

---

## 🚧 Folder Structure

### Backend

```
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── index.js
└── .env
```

### Frontend

```
frontend/
├── src/
    ├── components/
    ├── pages/
    ├── redux/
    ├── hooks/
    ├── App.jsx
    └── main.jsx
```

---

## 🔒 Authentication

- Cookies are used to store JWT tokens (HttpOnly + Secure + SameSite=None)
- Middlewares like `isAuthenticated` and `isRecruiter` guard protected routes
- Auto-login and logout based on cookie presence

---

## 💡 Deployment Notes

- **MongoDB Whitelist:** Add Render's dynamic IPs to MongoDB Atlas IP whitelist
- **Render CORS Issue:** Use `Access-Control-Allow-Origin: https://skillfound-frontend.onrender.com` in backend
- **Resume Uploads:** Handled via Multer -> Cloudinary and linked to user profiles
- **Frontend & Backend:** Both deployed on Render using `build` scripts and `start` commands



## 👤 Author

**Dhairya Shah**\
[LinkedIn](https://www.linkedin.com/in/dhairya0609/) | [GitHub](https://github.com/dhairya0609)
