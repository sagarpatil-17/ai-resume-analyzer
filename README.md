# CVBoost AI — Frontend

A modern web interface for **CVBoost AI**, an AI-powered resume analyzer designed to help job seekers evaluate their resumes and identify opportunities for improvement.

## ✨ Features

- Clean and responsive user interface
- Resume analysis workflow
- Presentation of resume feedback and insights
- User-friendly navigation and form interactions
- Integration with the CVBoost AI backend API

## 🛠️ Tech Stack

- Angular
- TypeScript
- Tailwind CSS
- REST API integration
- npm

## 📁 Project Structure

```text
.
├─ app
│  ├─ core
│  │  ├─ guards
│  │  │  └─ auth.guard.ts
│  │  ├─ interceptors
│  │  │  └─ auth.interceptor.ts
│  │  └─ services
│  │     ├─ auth.service.ts
│  │     └─ resume.service.ts
│  ├─ features
│  │  ├─ analyzer
│  │  │  ├─ analyzer.css
│  │  │  ├─ analyzer.html
│  │  │  └─ analyzer.ts
│  │  ├─ auth
│  │  │  ├─ login
│  │  │  │  ├─ login.css
│  │  │  │  ├─ login.html
│  │  │  │  └─ login.ts
│  │  │  └─ register
│  │  │     ├─ register.css
│  │  │     ├─ register.html
│  │  │     └─ register.ts
│  │  ├─ history
│  │  │  ├─ history.css
│  │  │  ├─ history.html
│  │  │  └─ history.ts
│  │  └─ results
│  │     ├─ results.css
│  │     ├─ results.html
│  │     └─ results.ts
│  ├─ app.config.ts
│  ├─ app.routes.ts
│  └─ app.ts
├─ environments
│  ├─ environment.prod.ts
│  └─ environment.ts
├─ index.html
├─ main.ts
└─ styles.css
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- A running CVBoost AI backend

### Installation

Clone the repository and navigate to the frontend directory.

```bash
git clone https://github.com/sagarpatil-17/ai-resume-analyzer.git
cd ai-resume-analyzer
npm install
```

### Environment Configuration

Configure the backend API URL using the environment mechanism supported by your frontend framework.

Example:

```env
API_BASE_URL=http://localhost:3000
```

### Run the Application

Use the development script defined in your `package.json`. For example:

```bash
npm run dev
```

For Angular projects, the command may instead be:

```bash
ng serve
```

### Build for Production

```bash
ng build
```

## 👨‍💻 Author

**Sagar Patil**

- GitHub: [@sagarpatil-17](https://github.com/sagarpatil-17)
- Project: [CVBoost AI](https://github.com/sagarpatil-17/ai-resume-analyzer)

---

Part of the CVBoost AI project.
