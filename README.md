# ⏱ TimeFlow — Time Calculator and Productivity Analysis System

A full-stack productivity tracking application built with Node.js, Express, MongoDB, and vanilla JS.

---

## 🗂 Project Structure

```
project/
├── server.js                  ← Express app entry point
├── package.json
│
├── server/
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── models/
│   │   ├── User.js            ← User schema (name, email, password)
│   │   └── Task.js            ← Task schema (userId, taskName, category...)
│   ├── controllers/
│   │   ├── userController.js  ← Register, login logic
│   │   └── taskController.js  ← CRUD + stats logic
│   ├── routes/
│   │   ├── userRoutes.js      ← /api/users/*
│   │   └── taskRoutes.js      ← /api/tasks/*
│   └── middleware/
│       └── authMiddleware.js  ← JWT token verification
│
└── public/
    ├── html/
    │   ├── login.html         ← Login page
    │   ├── register.html      ← Register page
    │   └── dashboard.html     ← Main app dashboard
    ├── css/
    │   └── style.css          ← All styles
    └── js/
        ├── auth.js            ← Login/register form handlers
        └── dashboard.js       ← Dashboard logic, charts, task management
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure MongoDB
Edit `server/config/db.js` and update the connection string:
```js
// Local MongoDB:
'mongodb://localhost:27017/productivity_app'

// MongoDB Atlas:
'mongodb+srv://<username>:<password>@cluster.mongodb.net/productivity_app'
```

Or set environment variable:
```bash
export MONGO_URI="mongodb://localhost:27017/productivity_app"
export JWT_SECRET="your_secret_key_here"
```

### 3. Start the server
```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

### 4. Open in browser
```
https://tempo-app-nine.vercel.app/
```

---

## 📡 API Endpoints

### Auth (Public)
| Method | Endpoint              | Description     |
|--------|-----------------------|-----------------|
| POST   | /api/users/register   | Create account  |
| POST   | /api/users/login      | Login           |
| GET    | /api/users/profile    | Get profile *(protected)* |

### Tasks (Protected — JWT required)
| Method | Endpoint          | Description                       |
|--------|-------------------|-----------------------------------|
| GET    | /api/tasks        | Get all tasks (filter by date/category) |
| POST   | /api/tasks        | Create a new task                 |
| PUT    | /api/tasks/:id    | Update a task                     |
| DELETE | /api/tasks/:id    | Delete a task                     |
| GET    | /api/tasks/stats  | Get today's stats + 7-day chart data |

### Authorization Header
All protected routes need:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🧮 Key Logic

### Time Calculation
```js
function calcDurationMinutes(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}
```

### Productivity Formula
```
Productivity % = (Productive Minutes / Total Minutes) × 100

Productive categories: study, work, exercise
Break category: break
```

---

## 🏗 MongoDB Schemas

### Users Collection
```js
{
  name:      String (required),
  email:     String (unique, required),
  password:  String (hashed with bcrypt),
  createdAt: Date
}
```

### Tasks Collection
```js
{
  userId:    ObjectId (ref: User),
  taskName:  String,
  category:  enum['study','work','break','exercise'],
  startTime: String ("HH:MM"),
  endTime:   String ("HH:MM"),
  duration:  Number (minutes),
  date:      String ("YYYY-MM-DD"),
  createdAt: Date
}
```
#
