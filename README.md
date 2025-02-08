# 🚀 Node.js Clean Architecture API with PostgreSQL

## 📌 Project Overview
This project follows a clean architecture approach using Node.js and PostgreSQL, ensuring modularity, scalability, and maintainability.

## 📂 Folder Structure
```
📦 mi-proyecto
 ┣ 📂 src
 ┃ ┣ 📂 config          # Database configuration
 ┃ ┣ 📂 core            # Core utilities
 ┃ ┣ 📂 middleware      # Authentication and validation middleware
 ┃ ┣ 📂 modules         # Features
 ┃ ┣ 📂 utils           # Utility functions
 ┃ ┣ 📜 routes.js       # Centralized route management
 ┃ ┣ 📜 server.js       # Server entry point
 ┣ 📜 .env              # Environment variables
 ┣ 📜 package.json      # Project dependencies
 ┣ 📜 README.md         # Documentation
```

## ⚡ Installation & Setup

### 1️⃣ Clone Repository
```sh
git clone 
cd mi-proyecto
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Configure Environment Variables
Create a `.env` file in the root directory and fill in your database and JWT secrets:
```env
PORT=3000
DB_USER=
DB_HOST=
DB_NAME=
DB_PASS=
DB_PORT=5432
JWT_SECRET=
```

### 4️⃣ Set Up PostgreSQL Database
Ensure PostgreSQL is running, then create the database.

### 5️⃣ Start the Server
```sh
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

### 7️⃣ Test API
Use Postman or curl to test endpoints:
```sh
curl -X GET http://localhost:3000/
```
Expected response:
```json
{ "message": "Server is running" }
```

## 📌 License
MIT License © 2025 Opieka
