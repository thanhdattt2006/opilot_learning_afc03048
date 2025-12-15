# 📚 Course Management Dashboard (Remix Stack)

This is a functional Course Management application built using **Remix.run** (React Framework) and **Prisma** (ORM). The project focuses on developing a robust **CRUD (Create, Read, Update, Delete)** feature set while delivering an optimized and polished **User Experience (UX)** on the frontend.

## 🎯 Core Features

The application provides full data management capabilities for courses:

| Feature | Action | Description |
| :--- | :--- | :--- |
| **List & Filter** | READ | Displays the course list with comprehensive multi-level filtering (Category, SubCategory, Tags), sorting, and pagination. |
| **Create** | CREATE | Creates new courses with input validation, including multi-selection for Tags. |
| **Update** | UPDATE | Updates detailed course information, ensuring correct pre-selection of existing tags and editable fields. |
| **Delete** | DELETE | Permanently removes a course record. |

## ✨ UX/Front-end Highlights

The project's key focus was on refining UI/UX, demonstrating attention to detail and modern web development practices:

1.  **Intelligent Filtering:**
    * **Dependent Dropdowns:** The **SubCategory** field is dynamically disabled until a primary **Category** is selected, enforcing logical data entry.
    * **State Consistency:** Filter inputs maintain focus during searches, and all filter selections are retained during pagination.
2.  **Robust Pagination & Data Safety:**
    * **Server Protection:** The backend (Loader) includes critical logic to prevent **Prisma database crashes** that occur when users manually navigate to invalid page parameters (e.g., `?page=0` or negative numbers).
    * **UI Clarity:** **Previous** and **Next** buttons are correctly disabled and visually muted when no further navigation is possible.
3.  **Refined Interactions:**
    * **Safe Deletion Modal:** Replaced the default browser `window.confirm()` with a custom, large Modal that explicitly confirms the deletion of the **specific course name** (e.g., "Delete **Course ABC**?") to prevent user error.
    * **Visual Completion:** Course cards include placeholder images, and the dashboard header displays the **Total Result Count** for active filters.

---

## ⚙️ Setup and Running the Application

### Prerequisites

* Node.js (>= 18)
* npm

### Steps to Run

#### 1. Clone Repository and Switch Branch

As the work was done on a specific development branch, clone the repository and switch to the correct branch:

```bash
# Clone the repository root
git clone [https://github.com/thanhdattt2006/opilot_learning_afc03048.git](https://github.com/thanhdattt2006/opilot_learning_afc03048.git)

# Change into the project directory
cd opilot_learning_afc03048

# Switch to the development branch
git checkout prd_courses_page_v1
2. Install Dependencies (Resolving React Conflict)
The current setup may involve a conflict between React 19 (used in the project) and React 18 (required by some Remix packages). Use the flag below to bypass the peer dependency error and install packages:

Bash

npm install --legacy-peer-deps
3. Database Setup (Prisma)
Ensure your .env file has the DATABASE_URL configured.

Initialize the database schema and seed sample data:

Bash

npx prisma migrate dev --name init
npx prisma db seed
4. Start Development Server
Run the development command to start the server:

Bash

npm run dev
🌐 Accessing the Application
The application will start at port 5173.

Please navigate directly to the following path to view the main course management dashboard:

http://localhost:5173/courses

Developed by [Your Name]
