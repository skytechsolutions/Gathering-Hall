# Backend - Chamkani Gathering Hall (PostgreSQL & pgAdmin 4)

This directory contains the PostgreSQL database schema, migration script for pgAdmin 4, backend API server with JWT Auth, Cloudinary configuration, and administrative seed scripts.

---

## 1. Database Setup in pgAdmin 4

Follow these steps to migrate and create your database in pgAdmin 4:

1. **Open pgAdmin 4** and connect to your server (**`PostgreSQL 18`**, user: `postgres`, password: `samij7141`).
2. **Create the Database** (if not already created):
   - Right-click **Databases** -> **Create** -> **Database...**
   - Name: `Chamkani Gathering Hall`
   - Click **Save**.
3. **Open Query Tool**:
   - Right-click `Chamkani Gathering Hall` and click **Query Tool** (or click **Connect & Open Query Tool**).
4. **Execute Migration Script**:
   - Open or copy the entire contents of [`backend/database/pgadmin_schema.sql`](./database/pgadmin_schema.sql).
   - Paste it into the Query Tool and press **F5** (or click the **Execute/Play** button ▶️).
   - All tables (`users`, `customers`, `bookings`, `reference_values`, `activity_logs`, `whatsapp_reminders`, `media_uploads`), triggers, and default data will be created!

---

## 2. Default Access Credentials

The migration script automatically seeds the first Administrator account into PostgreSQL:

| Field | Value |
|---|---|
| **Email** | `admin@example.com` |
| **Username** | `admin` |
| **Password** | `samij7141` |
| **Role** | `ADMIN` |

You can also seed or update the admin at any time using:
```bash
npm run seed:admin
# or
npm run create-admin -- --email admin@example.com --name "Administrator" --password "samij7141"
```

---

## 3. Running the Backend Server

```bash
# Production mode
npm start

# Development mode (auto-reload on changes)
npm run dev
```

The backend server runs on **`http://localhost:5000`** with the following endpoints:
* **`GET /`**: Server status, PostgreSQL connection state, Cloudinary status
* **`GET /api/health`**: Real-time database health check query
* **`POST /api/auth/login`**: Authenticate email/username and password (`samij7141`) -> Returns JWT token
* **`GET /api/auth/me`**: Returns authenticated user profile (Bearer token required)
* **`GET /api/bookings`**: List recent bookings with customer information
* **`GET /api/customers`**: List all customers
* **`GET /api/availability?date=YYYY-MM-DD`**: Check slot availability for any date
* **`POST /api/cloudinary/sign`**: Generate secure upload signatures for Cloudinary

---

## 4. Environment Variables (`.env`)

The `.env` and `.env.local` files in `backend/` are pre-configured:
* **Database**: `postgresql://postgres:samij7141@localhost:5432/Chamkani%20Gathering%20Hall?schema=public`
* **JWT Secret**: Configured with a secure 48-byte token.
* **Cloudinary**:
  * Cloud Name: `amyls4sk`
  * API Key: `858262961956569`
  * API Secret: `YdNxLeYLwKvmssU4JV_mpEdusW4`
