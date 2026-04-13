# Project Goal
Build a modern, aesthetic, and social book-tracking web application where users can manage their libraries, track reading progress, and create reading groups with friends to see each other's progress in real-time.

# Tech Stack (Crucial)
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + Shadcn/UI (For a polished, minimal look)
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth)
- **Real-time:** Supabase Realtime (For live group updates)
- **Icons:** Lucide-React
- **Core API:** Google Books API (For fetching book data via ISBN)

# Core Features & User Flow

### 1. Database Schema Design (Initial Step)
Please design the Supabase database schema first. Key tables needed:
- `users`: User profiles (id, email, display_name, avatar_url).
- `books`: Master book catalog fetched from API (id, google_books_id, isbn, title, author, cover_image_url, page_count).
- `user_books`: Junction table for user libraries (id, user_id, book_id, status ['to-read', 'reading', 'finished'], current_page, rating).
- `groups`: Reading groups (id, name, created_by).
- `group_members`: Junction table (group_id, user_id).

### 2. Library Management & Onboarding
- Implement Supabase Auth (Email/Password and/or Google).
- Create a 'My Library' page with tabs for "To-Read," "Reading," and "Finished."
- Implement "Add Book" functionality using **Google Books API**.
- **Crucial Feature: Barcode Scanner.** Implement a feature using a library like `html5-qrcode` to access the device camera, scan an ISBN barcode, fetch book details from the Google Books API, and automatically populate the "Add Book" form.

### 3. Reading Progress & Journal
- For books marked "Reading," allow users to easily update their `current_page`.
- Calculate and display reading progress as a percentage (%) visually.
- Add a simple "Highlights/Quotes" section per book where users can save text snippets.

### 4. Real-time Social Reading Groups
- Implement functionality to create groups and invite friends (via email or username).
- Create a dynamic **Group Dashboard**.
- On the dashboard, show a list of all group members and their *current* "Reading" book.
- For each member, display their book's cover, current page, and a visual **Progress Bar** (e.g., "Tuba: 120/300 pages - 40%").
- **MUST HAVE:** Use **Supabase Realtime** so that when one user updates their page count, their progress bar on every other group member's screen updates instantly without refreshing.

### 5. UI/UX & Design "Vibe"
- The design must be modern, minimalist, and aesthetically pleasing (inspired by apps like Notion or Linear).
- Use a calm, "bookish" color palette.
- Implement **Dark Mode** by default, with a light mode toggle.
- Mobile-responsive design is a priority.

# Instructions for Cursor
Please start by generating the initial project structure and the Supabase database schema migration file based on the design above. Then, proceed to build the authentication flow.