<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>
# 🌱 EcoSetu (इकोसेतु)
### Personal Carbon Bridge — Understand, Track & Reduce Your Carbon Footprint

> Built for **Hack2Skill Prompt Wars Virtual** | Powered by **Google AI Studio + Gemini API**

---

## 🔍 About

EcoSetu is a personalized carbon footprint tracker that goes beyond generic calculators. Instead of just giving you a number, it builds a profile from your actual lifestyle and surfaces specific, ranked actions you can take — and tracks your progress over time.

The name *Setu* (सेतु) means **bridge** in Hindi — EcoSetu is a bridge between where your carbon footprint is today and where it needs to be.

---

## ✨ Features

- **6-Step Lifestyle Quiz** — Covers commute mode, commute frequency, diet type, home energy source, electricity usage, and shopping habits. Multiple-choice only, takes under 2 minutes.
- **Personal Carbon Dashboard** — Estimated monthly footprint (kg CO2e), compared against national average and global climate target.
- **Sector Breakdown** — Transport, Food, Home Energy, and Shopping split so you know exactly where your footprint comes from.
- **AI-Ranked Action Plan** — Personalized recommendations based on your quiz answers, ranked by potential CO2 savings. Never shows generic advice that doesn't apply to you.
- **Weekly Check-In** — Log which actions you followed each week. The mitigation curve tracks your downward carbon trajectory over time.
- **Carbon Coach (Gemini AI)** — Ask anything about your footprint and get specific, personalized answers based on your profile. Includes quick-reply chips for common questions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (Single Page App) |
| AI / LLM | Gemini API via Google AI Studio |
| Deployment | [your platform — e.g. Vercel / Firebase Hosting] |
| Data Storage | Browser LocalStorage (no backend required) |
| Emission Factors | IPCC-aligned CO2e values per lifestyle category |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/[your-username]/ecosetu.git

# Open in browser
# No install needed — it's a static web app
open index.html
```

To use the Carbon Coach feature, add your Gemini API key:
```js
// In config.js or wherever the API call is made
const API_KEY = "your-gemini-api-key-here";
```

---

## 📸 Screenshots

| Onboarding | Dashboard |
|---|---|
| ![Onboarding](./screenshots/onboarding.png) | ![Dashboard](./screenshots/dashboard.png) |

---

## 🗂️ Project Structure

```
ecosetu/
├── index.html          # Main app entry point
├── style.css           # Styling
├── app.js              # Quiz logic + footprint calculation
├── coach.js            # Gemini API integration
├── emissions.js        # CO2e factor constants
└── screenshots/        # App screenshots
```

---

## 🌍 Emission Factor Sources

Carbon estimates are based on published lifecycle emission factors across categories:
- **Transport** — per-km CO2e by vehicle type (IPCC AR6, Our World in Data)
- **Food** — per-diet annual footprint estimates (Oxford University food emissions study)
- **Home Energy** — grid emission intensity (IEA 2023, India CEA grid factor)
- **Shopping** — consumer goods lifecycle average (Carbon Trust)

---

## 🙌 Acknowledgements

- **Google AI Studio** — for the Build feature that scaffolded this app
- **Gemini API** — powering the Carbon Coach
- **Hack2Skill** — for the Prompt Wars problem statement

---

## 👤 Author

**Divyanshu**
B.Tech CSE — JIMS Engineering Management and Technical Campus
BS Data Science & Applications — IIT Madras

[LinkedIn](https://linkedin.com/in/your-profile) • [GitHub](https://github.com/your-username)

---

*EcoSetu — Small actions, tracked consistently, add up.*
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a151b4ce-977c-44e9-9071-dcc80542eab0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
