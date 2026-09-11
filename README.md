# ISBusy ☕

> **Who's free for tea right now?**
> A modern campus companion for ISB students to check live schedules and see which classmates are currently free or in class.

---

## ⚡ Features

- **Live Status in Real-Time**: Instant visibility into whether classmates are in class, which room they're in, when the class ends, or how long they are free until their next session (calculated using `Asia/Kolkata` time).
- **Dual Campus Support**: Built-in support for Hyderabad and Mohali campuses with live search.
- **Friends Roster**: Add and follow friends to see their live status, with free classmates automatically sorted to the top.
- **Term 4 Schedules & Timeline**: Full timetable view for today and upcoming class days with room numbers and course codes.
- **Mobile-First & PWA Ready**: Optimized for mobile devices with install-to-homescreen support and offline asset caching.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with React 19
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL (Neon / Supabase / Vercel Postgres)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with shadcn/ui primitives
- **Client State & Caching**: [@tanstack/react-query](https://tanstack.com/query)
- **Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Hosting Target**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
Ensure you have **Node.js 18.18+** (Node.js 20 or 22 recommended).

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
Create a `.env` file from the template:
```bash
cp .env.example .env
```
Provide your PostgreSQL connection string:
```env
DATABASE_URL=postgresql://user:password@hostname:5432/dbname?sslmode=require
```

### 4. Push Database Schema
```bash
npm run db:push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel

1. **Push to GitHub**: Commit and push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Migrate to Next.js for Vercel"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your **`ISB-Z`** repository.
   - Framework Preset will automatically be detected as **Next.js**.
3. **Set Environment Variables**:
   - Add `DATABASE_URL` with your PostgreSQL connection string (from Neon, Supabase, or Vercel Postgres).
4. **Deploy**: Click **Deploy**!
   - Your application will be built and live with global serverless edge execution.
