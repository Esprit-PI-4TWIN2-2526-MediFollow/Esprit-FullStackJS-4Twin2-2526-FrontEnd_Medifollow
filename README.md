# 🏥 MediFollow — Frontend

> **Post-Hospitalization Remote Patient Monitoring Platform**  
> Built with Angular 18 · Tailwind CSS · Chart.js · Web Speech API

---

## 🌐 Live Demo

🚀 **Access the deployed application here:**  
👉 https://medifollow.netlify.app

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Roles & Dashboards](#roles--dashboards)
- [AI Features](#ai-features)
- [Screenshots](#screenshots)
- [Related Repositories](#related-repositories)

---

## 🌟 Overview

MediFollow is a comprehensive web platform designed to monitor patients remotely after hospital discharge. It reduces the risk of complications and readmissions through an intelligent, ergonomic, and secure system connecting patients to healthcare professionals.

The platform enables:
- Collection and tracking of vital signs and symptoms entered by patients
- Healthcare professionals to consult and analyze patient data
- Automatic alerts via Machine Learning when abnormal values are detected
- Full traceability and security of all medical information

---

## ✨ Features

### 🔐 Authentication & Security
- Secure login with JWT authentication
- Role-based access control (RBAC)
- Automatic session timeout on inactivity
- Password reset flow

### 👥 Multi-Role User Management
| Role | Capabilities |
|---|---|
| **Patient** | Submit symptoms & vitals, fill questionnaires, view history |
| **Physician** | Monitor patients, view AI alerts, analyze responses |
| **Nurse** | Assist with data entry, validate patient submissions |
| **Coordinator** | Supervise protocol compliance, send patient reminders |
| **Auditor** | Consult logs and audit trails |
| **Admin / SuperAdmin** | Full platform management |

### 📋 Dynamic Questionnaire System
- Create, edit, and manage questionnaires per medical service
- AI-powered question generation (Groq / LLaMA 3.3)
- 7 question types: text, number, scale, single choice, multiple choice, date, boolean
- Patient-side renderer with real-time validation per question type
- Response history with detailed answer view

### 🩺 Symptom Tracking
- Daily symptom form submission (max 3 per day)
- Vital signs extraction: temperature, heart rate, blood pressure, SpO2
- Nurse/Coordinator validation workflow
- Voice input support via Web Speech API

### 🤖 AI & Machine Learning
- **Anomaly Detection**: Random Forest + PCA model trained on 50,000 patient records
- **Automatic Alerts**: Critical alerts sent to the assigned doctor in real time
- **AI Medical Summary**: Automatic generation of clinical summaries (HuggingFace `Falconsai/medical_summarization`)
- **AI Question Generation**: Groq API with LLaMA 3.3 70B for service-specific clinical questions

### 📊 Physician Dashboard
- Patient list with search, filter, and pagination
- Gender distribution donut chart
- Age distribution bar chart
- Response trend line chart (last 8 weeks)
- KPI cards: Total Responses, Compliance Rate, Patients Responded, This Week
- Unread critical alerts panel with severity badges
- Service questionnaire viewer

### 🔔 Notifications & Alerts
- Real-time unread alert counter
- Severity levels: Low / Medium / High / Critical
- Dismiss and mark-as-read actions
- Alert history per patient

### 🌐 Additional Features
- **Multilingual support**
- **Telemedicine integration**
- **Real-time messaging**
- **Gesture-based navigation**
- **Voice-assisted form filling** (Web Speech API)
- **Dark mode** support
- **Responsive design** (mobile, tablet, desktop)
- **Data export** (CSV / PDF)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Angular | 18 | Frontend framework |
| Tailwind CSS | 3.x | UI styling |
| Chart.js + ng2-charts | 5.x | Data visualization |
| Web Speech API | Native | Voice input |
| RxJS | 7.x | Reactive programming |
| TypeScript | 5.x | Type safety |

---

## 📁 Project Structure

```
src/
├── app/
│ ├── auth/ # Authentication (login, signup, reset password)
│ ├── dashboards/ # Role-based dashboards
│ │ ├── patient/
│ │ ├── physician/
│ │ ├── nurse/
│ │ ├── coordinator/
│ │ ├── auditor/
│ │ └── super-admin/
│ │
│ ├── pages/ # General UI pages & modules
│ │ ├── auth-pages/
│ │ ├── dashboard/
│ │ ├── charts/
│ │ ├── forms/
│ │ ├── tables/
│ │ ├── notifications/
│ │ ├── invoices/
│ │ ├── calendar/
│ │ └── other-page/
│ │
│ ├── questionnaire/ # Questionnaire system (builder, renderer, responses)
│ ├── symptoms/ # Symptom tracking & vitals
│ ├── telemedicine/ # Telemedicine features
│ ├── chat/ # Messaging system
│ ├── users/ # User management & profiles
│ │ ├── all-profiles/
│ │ └── mic-button/ # Voice input component
│ │
│ ├── shared/ # Reusable components
│ │ ├── components/
│ │ │ ├── charts/
│ │ │ ├── forms/
│ │ │ ├── tables/
│ │ │ ├── header/
│ │ │ ├── notifications/
│ │ │ └── ui/
│ │ ├── layout/
│ │ ├── pipe/
│ │ └── services/
│ │
│ ├── models/ # TypeScript interfaces
│ ├── services/ # Core HTTP services
│ ├── gesture-control/ # Gesture-based navigation
│ └── manage-service/ # Service management (admin)
│
├── assets/ # Static assets (images, icons, etc.)
├── environments/ # Environment configuration
│
├── index.html
├── main.ts
└── styles.css

Root files:
├── angular.json
├── package.json
├── Dockerfile
├── Jenkinsfile
├── README.md
└── sonar-project.properties
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Angular CLI >= 18.x

```bash
npm install -g @angular/cli@18
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-FrontEnd_Medifollow
cd medifollow-frontend

# Install dependencies
npm install --legacy-peer-deps
```

### Run Development Server

```bash
ng serve --open
```

The application will be available at `http://localhost:4200`

### Build for Production

```bash
ng build --configuration=production
```

---

## ⚙️ Environment Setup

Edit `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

Make sure the following services are running:

| Service | Port | Description |
|---|---|---|
| NestJS Backend | 3000 | Main REST API |
| MongoDB Atlas | Cloud | Database |
| FastAPI ML Service | 8000 | Anomaly detection model |

---

## 🎭 Roles & Dashboards

### Patient
- View assigned questionnaires by medical service
- Submit responses with real-time validation
- Track completion status with "Completed" badge
- Voice-assisted form filling
- Entry of vital signs (temperature, blood pressure, heart rate, SpO2)
- Declaration of symptoms (pain, fatigue, shortness of breath, nausea)
- Access to personal medical history with graphical visualization
- Send messages or notes to physicians

---

### Nurse
- Assist with data entry and validation of patient inputs
- Daily monitoring of assigned patients
- Validate patient-submitted symptoms and vitals

---

### Physician
- Full patient dashboard with charts and KPIs
- View all questionnaire responses per patient
- Receive and manage ML-generated critical alerts
- Generate AI medical summary of patient history
- Read-only access to service questionnaires
- Full access to patient medical records
- Analyze clinical trends and patient evolution
- Support clinical decision-making with data insights
- Adjust care and follow-up protocols

---

### Coordinator
- Supervise compliance with follow-up protocols
- Verify data completeness and submission regularity
- Coordinate between healthcare teams


---

### Auditor / Quality Manager
- Access system logs and audit trails
- Verify traceability of all user actions
- Monitor compliance with medical and organizational processes
- Review access and modification history
- Generate audit and compliance reports

---

### Admin / SuperAdmin
- Full platform management
- Create and manage users with role assignment
- Manage hospital services and units
- Build and publish dynamic questionnaires
- Export data (CSV / PDF)
- Access full audit logs and system data
- Configure and maintain the global system

---

## 🤖 AI Features

### 1. Anomaly Detection (Machine Learning)

When a patient submits vital signs, the system:

1. Extracts vitals from responses (heart rate, SpO2, temperature, blood pressure)
2. Sends them to the FastAPI ML microservice
3. The model runs: **StandardScaler → PCA (2 components) → Random Forest**
4. If an anomaly is detected → an alert is created in MongoDB
5. The alert appears instantly on the physician's dashboard

**Model trained on:** 50,000 patient records with labeled vital sign alerts

### 2. AI Question Generation

In the questionnaire builder, clicking **"Generate with AI"** :
- Sends the title, service, and description to Groq API
- LLaMA 3.3 70B generates clinically relevant questions
- Questions are added directly to the form with correct types

### 3. AI Medical Summary

In the patient responses view, clicking **"Generate AI Summary"** :
- Sends all patient responses to HuggingFace
- `Falconsai/medical_summarization` generates a clinical summary
- Displayed as a professional medical paragraph for the physician

---

## 📸 Screenshots

| Dashboard Physician | Patient Questionnaire | Alert Panel |
|---|---|---|
| Charts, KPIs, alerts | Step-by-step renderer | Critical alert with severity |

---

## 🔗 Related Repositories

| Repository | Description |
|---|---|
| [medifollow-backend](https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/Esprit-FullStackJS-4Twin2-2526-Backend_Medifollow) | NestJS REST API + MongoDB |
| [medifollow-ml-service](https://github.com/Esprit-PI-4TWIN2-2526-MediFollow/ModelesIA) | FastAPI + Random Forest anomaly detection |

---

## 👥 Team

Developed as part of the **PI / CDIO** project at **ESPRIT** — École Supérieure Privée d'Ingénierie et de Technologie.

---

## 📄 License

This project is developed for academic purposes at ESPRIT.

---

<div align="center">
  <strong>MediFollow — Never miss a sign.</strong><br/>
  <em>Powered by Angular 18 · Machine Learning · Groq AI</em>
</div>
