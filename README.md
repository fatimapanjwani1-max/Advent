# Advent SmartSite

A premium Client + Project Control Dashboard for a construction company in Tanzania.

## Folder Structure

```
/
├── .env.example
├── index.html
├── package.json
├── supabase-schema.sql
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── components/
    │   ├── Layout.tsx
    │   └── ProtectedRoute.tsx
    ├── contexts/
    │   └── AuthContext.tsx
    ├── lib/
    │   └── supabase.ts
    └── pages/
        ├── Dashboard.tsx
        ├── Login.tsx
        ├── ProjectDetails.tsx
        ├── admin/
        │   ├── AdminDashboard.tsx
        │   ├── AdminProjects.tsx
        │   └── CreateProject.tsx
        └── client/
            └── ClientDashboard.tsx
```

## Supabase Setup Steps

1. **Create a new Supabase project** at [supabase.com](https://supabase.com).
2. **Run the SQL Schema**: Go to the SQL Editor in your Supabase dashboard and run the contents of `supabase-schema.sql`.
3. **Create Storage Bucket**: Go to Storage and create a new public bucket named `smartsite-assets`.
4. **Get API Keys**: Go to Project Settings > API and copy your `Project URL` and `anon public` key.
5. **Set Environment Variables**: Add the keys to your deployment environment (Vercel) or local `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. **Create Users**: Go to Authentication > Users and invite or create users.
7. **Assign Roles**: After users sign up or are created, go to the Table Editor, open the `profiles` table, and set their roles to `admin`, `project_manager`, or `client`.

## Deployment Steps (Vercel)

1. Push your code to a GitHub repository.
2. Log in to [Vercel](https://vercel.com) and click "Add New..." > "Project".
3. Import your GitHub repository.
4. Vercel will automatically detect Vite. Leave the Build Command and Output Directory as default.
5. Expand "Environment Variables" and add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy".

## V2 Scaling Improvements

1. **Next.js App Router Migration**: For better SEO and server-side rendering, migrate to Next.js App Router (currently implemented as a Vite SPA for immediate compatibility).
2. **Real-time Subscriptions**: Use Supabase real-time features to update project progress and chat messages instantly without refreshing.
3. **Advanced Role Management**: Create a dedicated UI in the Admin dashboard to manage user roles and permissions.
4. **Automated Invoicing**: Integrate Stripe or a local payment gateway (like Selcom or DPO) for automated invoice processing.
5. **Gantt Charts**: Implement interactive Gantt charts for project timelines using libraries like `dhtmlx-gantt` or `frappe-gantt`.
