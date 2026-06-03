# Lucie Galvin — Fine Art Portfolio

This repository contains the source code for the professional portfolio website of artist **Lucie Galvin**. The platform is built using a modern static site architecture designed for high performance, smooth mobile responsiveness, and easy content management.

---

## 🚀 Technology Stack

- **Framework**: [Astro (v6)](https://astro.build/) - Selected for blazing-fast static page generation and lightweight page-load characteristics.
- **Database & Storage**: [Firebase (v12)](https://firebase.google.com/) - Live content synchronization using Firebase Firestore (for artworks database, biography text, and exhibitions details) and Firebase Storage (for high-resolution images).
- **Authentication**: Firebase Authentication - Standard email/password dashboard access control.
- **Styling**: Vanilla CSS - Custom HSL colors and animations inspired by David Hockney's iconic poolside and landscape aesthetics (glassmorphism, vibrant colors, and layouts).
- **Testing**: [Vitest](https://vitest.dev/) + [JSDOM](https://github.com/jsdom/jsdom) - Automated unit testing for helper functions and browser-rendering integration tests validating the compiled output under `/dist`.

---

## 📁 Project Structure

```text
lucie-portfolio/
├── dist/                     # Static production build output (Astro compile target)
├── public/                   # Static public assets (Favicon, placeholder images)
├── src/
│   ├── components/           # Reusable Astro components (Header, Footer, layout slots)
│   ├── layouts/              # Global page layout containers and base CSS rules
│   ├── lib/                  # Central utility modules (Firebase init, shared logic helpers)
│   ├── pages/                # File-system router pages (Home, About, Artworks, Exhibitions, Contact, Admin)
│   ├── test/                 # Automated test suite (rendering, gallery filters, contact honeypots, admin panels)
│   └── types/                # Strict TypeScript declaration types
├── firestore.rules           # Local Firestore database security rules
├── firebase.storage.rules    # Local Firebase Storage authorization rules
├── package.json              # Script directives and node package dependencies
└── tsconfig.json             # TypeScript rules configuration
```

---

## 🛠️ Setup & Local Development

### 1. Requirements
Ensure you are running **Node.js >= 22.12.0** on your system.

### 2. Dependencies
Install all required package dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure your Firebase Web SDK config credentials:
```env
PUBLIC_FIREBASE_API_KEY="your-api-key"
PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 4. Running the Development Server
Starts the local development server at `http://localhost:4321`:
```bash
npm run dev
```

---

## 🧞 Commands & Verification

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Astro development server locally |
| `npm run build` | Compiles the production-ready static pages into the `/dist` directory |
| `npm run preview` | Runs a local server to preview the built static pages in `/dist` |
| `npm test` | Runs the full Vitest + JSDOM test suite |
| `npx astro check` | Runs full TypeScript diagnostics and compilation type-checks |

---

## 🔒 Security Rules

Database writes are locked down strictly to the authenticated administrator UID `4oY0H5lnPnUFkVdON7cFlOIlWLK2` inside both configuration files:
- **Firestore Database Rules**: [firestore.rules](file:///Users/kategalvin/Git/lucie-portfolio/firestore.rules)
- **Storage Rules**: [firebase.storage.rules](file:///Users/kategalvin/Git/lucie-portfolio/firebase.storage.rules)

To deploy rules changes to your live Firebase project, execute:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 🧪 Testing Suite Architecture

The tests located under `src/test/` cover both core formatting algorithms and full-page layout integration validations:
1. **`utils.test.ts`**: Verifies text parser helper functions (split biography paragraphs, format dimensions, normalize subjects).
2. **`rendering.test.ts`**: Uses JSDOM to load the static output inside `/dist/` after compilation, asserting correct page headings, navigation linkages, and footer social anchors.
3. **`gallery.test.ts`**: Validates filtering and search behaviors, simulating multiple subjects, query strings, and Masonry grid class assignments.
4. **`contact.test.ts`**: Mocks API fetches and Firestore calls, verifying spam CAPTCHA honeypot drop operations and loading spinners.
5. **`admin.test.ts`**: Simulates panel changes based on user session authentication and "Prints Available" checkbox toggles.
