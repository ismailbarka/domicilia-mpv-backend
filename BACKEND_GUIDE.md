# 🚀 Backend Setup Guide — Express.js + Prisma + PostgreSQL

> **Goal:** By the end of this guide you will have a running REST API that can create and read service providers and categories, powered by Express.js and Prisma ORM talking to a PostgreSQL database.

---

## Table of Contents

1. [Prerequisites](#1--prerequisites)
2. [Project Setup](#2--project-setup)
3. [Understanding the Project Structure](#3--understanding-the-project-structure)
4. [Database Setup with PostgreSQL](#4--database-setup-with-postgresql)
5. [Prisma Setup](#5--prisma-setup)
6. [Defining the Database Schema](#6--defining-the-database-schema)
7. [Running Your First Migration](#7--running-your-first-migration)
8. [Creating the Prisma Client Helper](#8--creating-the-prisma-client-helper)
9. [Building the Express Server](#9--building-the-express-server)
10. [Seeding the Database](#10--seeding-the-database)
11. [Running & Testing the API](#11--running--testing-the-api)
12. [Key Concepts Explained](#12--key-concepts-explained)
13. [Common Errors & Fixes](#13--common-errors--fixes)
14. [Next Steps / Challenges](#14--next-steps--challenges)

---

## 1 — Prerequisites

Before you start, make sure you have the following installed on your machine:

| Tool                | What it is                             | How to check     |
| ------------------- | -------------------------------------- | ---------------- |
| **Node.js** (v18+)  | JavaScript runtime                     | `node -v`        |
| **npm**             | Node package manager (comes with Node) | `npm -v`         |
| **PostgreSQL**      | Relational database                    | `psql --version` |
| **A code editor**   | VS Code is recommended                 | —                |
| **Postman or curl** | To test your API endpoints             | —                |

> 💡 **Tip:** If you're on Mac, you can install PostgreSQL with `brew install postgresql@16` and start it with `brew services start postgresql@16`.

---

## 2 — Project Setup

### 2.1 — Create the project folder

```bash
mkdir cleaning-map-app-backend
cd cleaning-map-app-backend
```

### 2.2 — Initialize a Node.js project

```bash
npm init -y
```

This creates a `package.json` file — the manifest for your project. It tracks your dependencies, scripts, and project metadata.

### 2.3 — Install dependencies

**Production dependencies:**

```bash
npm install express @prisma/client cors dotenv
```

| Package          | What it does                                                                          |
| ---------------- | ------------------------------------------------------------------------------------- |
| `express`        | Web framework — handles HTTP requests and routing                                     |
| `@prisma/client` | Auto-generated database client for querying your DB                                   |
| `cors`           | Middleware that allows your API to be called from other domains (like a frontend app) |
| `dotenv`         | Loads environment variables from a `.env` file                                        |

**Development dependencies:**

```bash
npm install --save-dev nodemon prisma
```

| Package   | What it does                                              |
| --------- | --------------------------------------------------------- |
| `nodemon` | Automatically restarts your server when you save a file   |
| `prisma`  | CLI tool for managing your database schema and migrations |

### 2.4 — Add scripts to `package.json`

Open `package.json` and replace the `"scripts"` section with:

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```

- `npm run dev` → starts the server with **auto-restart** (for development)
- `npm start` → starts the server normally (for production)

### 2.5 — Set the module system

Add this line to your `package.json` (at the top level, alongside `"name"`, `"version"`, etc.):

```json
"type": "commonjs"
```

This tells Node to use `require()`/`module.exports` syntax (CommonJS) instead of `import`/`export` (ES Modules).

### 2.6 — Create a `.gitignore` file

```bash
touch .gitignore
```

Add the following content:

```
node_modules
.env
```

> ⚠️ **Never commit `node_modules` or `.env` to Git!** `node_modules` is huge and can be recreated with `npm install`. `.env` contains secrets like database passwords.

---

## 3 — Understanding the Project Structure

When you're done, your project will look like this:

```
cleaning-map-app-backend/
├── prisma/
│   └── schema.prisma      ← Database schema (tables, columns, relations)
├── node_modules/           ← Installed packages (auto-generated, never edit)
├── .env                    ← Secret environment variables (DB connection string)
├── .gitignore              ← Files Git should ignore
├── index.js                ← Main server file (Express app + routes)
├── prismaClient.js         ← Shared Prisma client instance
├── seed.js                 ← Script to populate the database with initial data
├── package.json            ← Project config + dependencies
└── package-lock.json       ← Exact dependency versions (auto-generated)
```

---

## 4 — Database Setup with PostgreSQL

### 4.1 — Create the database

Open your terminal and run:

```bash
psql -U your_username
```

Then inside the PostgreSQL shell:

```sql
CREATE DATABASE servicemap;
```

Type `\q` to exit.

### 4.2 — Create the `.env` file

In the root of your project, create a `.env` file:

```bash
touch .env
```

Add your database connection string:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/servicemap"
```

Replace:

- `YOUR_USERNAME` with your PostgreSQL username
- `YOUR_PASSWORD` with your PostgreSQL password (leave empty if none)

> 🔑 **What is a connection string?** It's a URL that tells Prisma how to connect to your database. The format is:
> `postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME`

---

## 5 — Prisma Setup

### 5.1 — Initialize Prisma

```bash
npx prisma init
```

This creates:

- `prisma/schema.prisma` — where you define your database tables
- `.env` — if it doesn't exist already (it will add a sample `DATABASE_URL`)

> 📝 If the `.env` file already exists, Prisma won't overwrite it. Just make sure your `DATABASE_URL` is correct.

---

## 6 — Defining the Database Schema

Open `prisma/schema.prisma` and replace its content with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id        Int       @id @default(autoincrement())
  name      String
  providers Provider[]
}

model Provider {
  id          Int      @id @default(autoincrement())
  name        String
  phone       String
  description String?
  latitude    Float
  longitude   Float
  photoUrl    String?
  isActive    Boolean  @default(true)

  categoryId  Int
  category    Category @relation(fields: [categoryId], references: [id])

  createdAt   DateTime @default(now())
}
```

### Let's break this down:

**The `generator` block:**

```prisma
generator client {
  provider = "prisma-client-js"
}
```

Tells Prisma to generate a JavaScript client that you can use to query the database.

**The `datasource` block:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Tells Prisma which database to connect to. `env("DATABASE_URL")` reads the value from your `.env` file.

**The `Category` model:**

- `id` → Auto-incrementing primary key
- `name` → The category name (e.g., "Cleaner", "Plumber")
- `providers` → A **one-to-many** relationship: one category can have many providers

**The `Provider` model:**

- `id` → Auto-incrementing primary key
- `name`, `phone` → Required text fields
- `description`, `photoUrl` → Optional fields (`String?` — the `?` means nullable)
- `latitude`, `longitude` → GPS coordinates (decimal numbers)
- `isActive` → Boolean with a default value of `true`
- `categoryId` → Foreign key linking to the `Category` table
- `category` → The relation definition — `@relation(fields: [categoryId], references: [id])` means "the `categoryId` column in this table points to the `id` column in the Category table"
- `createdAt` → Automatically set to the current timestamp when a row is created

> 📖 **What is a relation?** In databases, a relation connects two tables. Here, each Provider _belongs to_ one Category, and each Category _has many_ Providers. This is called a **one-to-many** relationship.

---

## 7 — Running Your First Migration

A **migration** is how you apply your schema changes to the actual database. Run:

```bash
npx prisma migrate dev --name init
```

**What this does:**

1. Reads your `schema.prisma`
2. Compares it with the current state of your database
3. Generates a SQL migration file (stored in `prisma/migrations/`)
4. Runs that SQL against your database → creates the actual tables
5. Regenerates the Prisma Client so your code can use the new tables

You should see output like:

```
✓ Generated Prisma Client
✓ The database is now in sync with the schema
```

> 💡 **Tip:** Every time you change `schema.prisma`, run `npx prisma migrate dev --name describe_your_change` to apply the changes.

---

## 8 — Creating the Prisma Client Helper

Create a file called `prismaClient.js`:

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
```

### Why a separate file?

You could create `new PrismaClient()` in every file that needs it, but that's a bad idea:

- Each instance opens a new database connection pool
- You'd quickly run out of connections
- By exporting a **single shared instance**, every file uses the same connection pool

> 📖 **What is `require` and `module.exports`?**
>
> - `require("./prismaClient")` → imports the value exported by another file
> - `module.exports = prisma` → makes `prisma` available for other files to import
>   This is the **CommonJS** module system used in Node.js.

---

## 9 — Building the Express Server

Create the main file `index.js`:

```javascript
const express = require("express");
const prisma = require("./prismaClient");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
```

### Let's understand each line:

| Line                                       | What it does                                                                                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `const express = require("express")`       | Imports the Express library                                                                    |
| `const prisma = require("./prismaClient")` | Imports your shared Prisma client                                                              |
| `const app = express()`                    | Creates an Express application instance                                                        |
| `app.use(express.json())`                  | Tells Express to **parse JSON request bodies** — without this, `req.body` would be `undefined` |
| `const PORT = process.env.PORT \|\| 3000`  | Uses the PORT from environment variables, or defaults to 3000                                  |

### Now add the routes:

#### Route 1 — GET all categories

```javascript
app.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});
```

- `app.get("/categories", ...)` → When someone sends a **GET** request to `/categories`, run this function
- `prisma.category.findMany()` → Fetch **all rows** from the `Category` table
- `res.json(categories)` → Send the result back as JSON

#### Route 2 — GET all providers (with optional filter)

```javascript
app.get("/providers", async (req, res) => {
  const { categoryId } = req.query;

  const providers = await prisma.provider.findMany({
    where: {
      isActive: true,
      ...(categoryId && { categoryId: Number(categoryId) }),
    },
    include: {
      category: true,
    },
  });

  res.json(providers);
});
```

- `req.query` → Contains URL query parameters. For `/providers?categoryId=2`, `req.query.categoryId` is `"2"`
- `where: { isActive: true }` → Only return active providers
- `...(categoryId && { categoryId: Number(categoryId) })` → If `categoryId` is provided, add it to the filter. `Number()` converts the string `"2"` to the number `2`
- `include: { category: true }` → Also fetch the related `Category` object for each provider (this is called **eager loading**)

> 📖 **What is the spread operator `...`?**
> The `...` syntax "spreads" an object's properties into another object. The expression `...(condition && { key: value })` is a pattern that **conditionally adds a property** — if `condition` is falsy, nothing is added.

#### Route 3 — POST create a new provider

```javascript
app.post("/providers", async (req, res) => {
  const data = req.body;

  const provider = await prisma.provider.create({
    data: {
      name: data.name,
      phone: data.phone,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      photoUrl: data.photoUrl,
      categoryId: data.categoryId,
    },
  });

  res.json(provider);
});
```

- `app.post(...)` → Handles **POST** requests (used for creating data)
- `req.body` → The JSON body sent by the client. Requires `express.json()` middleware to work
- `prisma.provider.create({ data: ... })` → Inserts a new row into the `Provider` table

#### Start the server

```javascript
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- `app.listen(PORT, callback)` → Starts the server and listens for requests on the given port
- The callback runs once the server is ready

### Complete `index.js`:

```javascript
const express = require("express");
const prisma = require("./prismaClient");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/categories", async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

app.get("/providers", async (req, res) => {
  const { categoryId } = req.query;

  const providers = await prisma.provider.findMany({
    where: {
      isActive: true,
      ...(categoryId && { categoryId: Number(categoryId) }),
    },
    include: {
      category: true,
    },
  });

  res.json(providers);
});

app.post("/providers", async (req, res) => {
  const data = req.body;

  const provider = await prisma.provider.create({
    data: {
      name: data.name,
      phone: data.phone,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      photoUrl: data.photoUrl,
      categoryId: data.categoryId,
    },
  });

  res.json(provider);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## 10 — Seeding the Database

Seeding means inserting initial data so your app has something to work with. Create `seed.js`:

```javascript
const prisma = require("./prismaClient");

async function main() {
  await prisma.category.createMany({
    data: [
      { name: "Cleaner" },
      { name: "Nanny" },
      { name: "Plumber" },
      { name: "Electrician" },
    ],
  });

  console.log("✅ Seed data inserted!");
}

main();
```

Run it:

```bash
node seed.js
```

This inserts 4 categories into your database. You only need to run this **once**.

> 💡 `createMany()` inserts multiple rows in a single database query — much faster than creating them one by one.

---

## 11 — Running & Testing the API

### Start the server:

```bash
npm run dev
```

You should see:

```
Server running on http://localhost:3000
```

### Test the endpoints:

**Get all categories:**

```bash
curl http://localhost:3000/categories
```

Expected response:

```json
[
  { "id": 1, "name": "Cleaner" },
  { "id": 2, "name": "Nanny" },
  { "id": 3, "name": "Plumber" },
  { "id": 4, "name": "Electrician" }
]
```

**Create a new provider:**

```bash
curl -X POST http://localhost:3000/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed",
    "phone": "+212600000000",
    "description": "Professional house cleaner",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "categoryId": 1
  }'
```

**Get all providers:**

```bash
curl http://localhost:3000/providers
```

**Get providers filtered by category:**

```bash
curl http://localhost:3000/providers?categoryId=1
```

> 💡 You can also use **Postman** to test these endpoints with a nice visual interface.

---

## 12 — Key Concepts Explained

### What is Express.js?

Express is a **web framework** for Node.js. It makes it easy to:

- Define URL routes (like `/categories`, `/providers`)
- Handle different HTTP methods (GET, POST, PUT, DELETE)
- Parse request data (query params, JSON body)
- Send responses

### What is Prisma?

Prisma is an **ORM** (Object-Relational Mapping). Instead of writing raw SQL:

```sql
SELECT * FROM "Provider" WHERE "isActive" = true;
```

You write JavaScript:

```javascript
await prisma.provider.findMany({ where: { isActive: true } });
```

Prisma gives you:

- **Type safety** — it knows your table columns and types
- **Auto-completion** — your editor suggests valid fields
- **Migrations** — version control for your database schema

### What is Middleware?

Middleware is a function that runs **before** your route handler. `express.json()` is middleware that:

1. Intercepts incoming requests
2. Checks if the body contains JSON
3. Parses it and puts the result in `req.body`

Without it, `req.body` would be `undefined`.

### HTTP Methods Cheat Sheet

| Method   | Purpose                             | Example                      |
| -------- | ----------------------------------- | ---------------------------- |
| `GET`    | Read/fetch data                     | Get all providers            |
| `POST`   | Create new data                     | Create a new provider        |
| `PUT`    | Update existing data (full replace) | Update a provider's info     |
| `PATCH`  | Update existing data (partial)      | Change just the phone number |
| `DELETE` | Remove data                         | Delete a provider            |

### `async`/`await` Explained

Database queries take time. `async`/`await` lets you write asynchronous code that **looks** synchronous:

```javascript
// WITHOUT async/await (callback hell)
prisma.category.findMany().then((categories) => {
  res.json(categories);
});

// WITH async/await (clean and readable)
const categories = await prisma.category.findMany();
res.json(categories);
```

The function must be marked `async` to use `await` inside it.

---

## 13 — Common Errors & Fixes

### ❌ `ReferenceError: app is not defined`

**Cause:** You used `app.get(...)` before creating the app with `const app = express()`.
**Fix:** Make sure `const app = express()` is at the top of your file, right after the imports.

### ❌ `Error: Cannot find module 'express'`

**Cause:** Express is not installed.
**Fix:** Run `npm install express`.

### ❌ `PrismaClientInitializationError: Can't reach database server`

**Cause:** PostgreSQL is not running or your `DATABASE_URL` is wrong.
**Fix:**

1. Make sure PostgreSQL is running: `brew services start postgresql@16` (Mac)
2. Check your `.env` file — the username, password, and database name must be correct
3. Make sure the database exists: `psql -U your_username -l` to list databases

### ❌ `Environment variable not found: DATABASE_URL`

**Cause:** The `.env` file is missing or not in the right location.
**Fix:** Make sure `.env` is in the **root** of your project (same level as `package.json`).

### ❌ `req.body is undefined`

**Cause:** Missing `express.json()` middleware.
**Fix:** Add `app.use(express.json());` before your routes.

---

## 14 — Next Steps / Challenges

Once you've got this working, try these challenges to level up:

1. **Add error handling** — Wrap your route handlers in try/catch blocks:

   ```javascript
   app.get("/categories", async (req, res) => {
     try {
       const categories = await prisma.category.findMany();
       res.json(categories);
     } catch (error) {
       res.status(500).json({ error: "Something went wrong" });
     }
   });
   ```

2. **Add a DELETE route** — Delete a provider by ID:

   ```javascript
   app.delete("/providers/:id", async (req, res) => { ... });
   ```

3. **Add a PUT route** — Update a provider's information

4. **Add CORS** — Allow your frontend to call this API:

   ```javascript
   const cors = require("cors");
   app.use(cors());
   ```

5. **Add input validation** — Check that required fields are provided before creating a provider

6. **Use Prisma Studio** — A visual database editor. Run: `npx prisma studio`

---

## 📚 Useful Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Node.js Documentation](https://nodejs.org/docs/latest/api/)
- [HTTP Methods Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

---

**Good luck! 🎉 If you get stuck, re-read the error message carefully — it usually tells you exactly what's wrong.**
