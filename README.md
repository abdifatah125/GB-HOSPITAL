# Garasbaley Hospital (GB Hospital) Management System

A hospital management web application built with React 19, TypeScript, Express, Tailwind CSS, Lucide icons, and Recharts.

---

## 🚀 Getting Started Locally (After Downloading ZIP)

When you download a project ZIP, dependencies (`node_modules`) and build artifacts are excluded by design to keep the file lightweight and secure.

### 1. Prerequisites
- **Node.js**: Version 18 or higher ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn** / **pnpm** / **bun**

---

### 2. Installation & Setup

1. Extract the downloaded ZIP file to a folder on your computer.
2. Open your terminal or Command Prompt in that extracted folder:
   ```bash
   cd path/to/extracted-folder
   ```
3. Install all project dependencies:
   ```bash
   npm install
   ```

---

### 3. Run the Development Server

Start the full-stack server (Vite frontend + Express backend):
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📦 How to Upload to GitHub

Follow these steps in your project root folder:

1. **Initialize Git repository**:
   ```bash
   git init
   ```
2. **Add all files to staging**:
   ```bash
   git add .
   ```
3. **Commit the files**:
   ```bash
   git commit -m "Initial commit of Garasbaley Hospital Management System"
   ```
4. **Link to your GitHub repository**:
   Create a new repository on [GitHub](https://github.com/new), then run:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git push -u origin main
   ```

---

## 🔑 Default Login Credentials

| Role | Email / Username | Password |
|---|---|---|
| **Hospital Administrator** | `admin@garasbaley.so` (or `admin`) | `admin123` |
| **Doctor** | `doctor.amina@garasbaley.so` (or `doctor`) | `doctor123` |
| **Receptionist** | `reception@garasbaley.so` (or `receptionist`) | `reception123` |
| **Pharmacist** | `pharmacy@garasbaley.so` (or `pharmacist`) | `pharmacy123` |
| **Lab Technician** | `lab@garasbaley.so` (or `labtech`) | `lab123` |
| **Patient** | `patient@garasbaley.so` (or `patient`) | `patient123` |

---

## 🛠 Available Scripts

- `npm run dev`: Starts the application with `tsx server.ts` on port `3000`.
- `npm run build`: Builds the production bundle in `dist/`.
- `npm run start`: Runs the compiled production server.
- `npm run lint`: Checks TypeScript types.
