# Saif Ali — Personal Portfolio

A modern, interactive personal portfolio website featuring a cyberpunk-inspired 3D background, liquid-glass UI, and a fully functional simulated terminal. Built to showcase projects across Full-Stack Development and UI/UX Design.

![Status](https://img.shields.io/badge/Status-Live-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-3D-white?style=flat-square&logo=three.js)

## 🌍 Live Demo

🔗 https://saifalihdd.github.io/Portfolio/

---

## ✨ Features

- 🎨 **Interactive 3D Background**
  - Dynamic cyberpunk wave grid powered by **Three.js**
  - Mouse-responsive animations for an immersive experience

- 🪟 **Custom UI Architecture**
  - Liquid-glass design language
  - Custom trailing cursor
  - Smooth scroll progress indicator

- 👤 **Profile Mode Toggle**
  - Switch between **DEV_MODE** and **DESIGN_MODE**
  - Dynamic accent colors
  - Context-aware profile presentation

- 💻 **Interactive Terminal**
  - Simulated command-line interface
  - Commands such as:
    - `whoami`
    - `experience`
    - `projects`
    - and more

- 🌐 **Responsive Design**
  - Optimized for desktop, tablet, and mobile devices

- 🏗️ **Scalable Product Architecture**
  - Structured for maintainability
  - Clean component organization
  - Universal accessibility

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS Variables & Custom Glassmorphism |
| 3D Rendering | Three.js |
| Deployment | GitHub Pages + GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

Install the latest version of **Node.js** before running the project.

---

### 1. Clone the Repository

```bash
git clone https://github.com/saifalihdd/Portfolio.git
```

### 2. Navigate to the Project

```bash
cd Portfolio
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser and visit:

```
http://localhost:3000
```

---

## 📦 Deployment

This portfolio is configured for **static export** and automatically deployed to **GitHub Pages** using **GitHub Actions**.

### Configuration

`next.config.ts`

```ts
output: "export",
basePath: "/Portfolio"
```

### CI/CD

Every push to the `main` branch automatically:

1. Builds the project
2. Exports the static site
3. Deploys it to GitHub Pages

Workflow location:

```text
.github/workflows/nextjs.yml
```

---

## 📁 Project Structure

```text
Portfolio/
├── app/
├── components/
├── public/
├── styles/
├── .github/
│   └── workflows/
├── next.config.ts
├── package.json
└── README.md
```

---

## 📄 License

© 2026 Saif Ali. All rights reserved.