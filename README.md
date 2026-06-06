# Ticket Box Backend

## 1. Introduction

## 2. Collaborators

## 3. How to setup

1. Open up the terminal and type in

```bash
git clone https://github.com/NichikouGN/happy-recipe-frontend.git
```

2. After that, run

```bash
npm install
```

3. Change the .env file to point to the backend

```js
VITE_API_URL = "http://localhost:4000"; //default
```

4. Start up the server

```bash
npm run dev
```

## 4. Version

### v0.1.0 (2026-06-05)

- Created database schema and seed
- Created User Microservices with the following functions
  1. JWT and RBAC middleware
  2. Sign in, Sign up functionality
  3. Update user role, status for organizer
  4. View a list of active user for organizer
- Other setup
