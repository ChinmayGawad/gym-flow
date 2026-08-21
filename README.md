# GymFlow - Real-Time Gym Occupancy Monitoring & Crowd Prediction

## Project Overview

A real-time gym occupancy monitoring and crowd prediction web application that allows gym members to check current crowd levels, view estimated wait times, discover optimal visit hours, inspect hourly attendance predictions, and track past gym visit history. See `MEMORY.md` for full system rules and `index.html` for single-page application structure.

## Tech Stack

- **Frontend**: Vanilla HTML5 + CSS3 + ES6 JavaScript (Single Page Application)
- **Typography**: Inter (Google Fonts, weights 400, 500, 600, 700, 800)
- **Icons**: Font Awesome 6.5.2 (`fa-solid`, `fa-regular` via CDNJS)
- **Styling Architecture**: BEM-inspired CSS custom component layout with mobile-first media query breakpoints (`850px`, `650px`, `380px`)

## Project Structure

```
/ (root)
├── index.html   - SPA structure, dynamic crowd status script, prediction schedule, and history view
├── style.css    - Responsive design system, minimalist UI theme, card layouts, and mobile media queries
├── MEMORY.md    - Comprehensive project memory bank, tech stack overview, and architecture rules
├── GEMINI.md    - Agent context rules, loading instructions, and capacity threshold rules
└── README.md    - High-level overview and local development instructions
```

## Development

```bash
# Preview locally using any static HTTP server or direct browser open
# Example using Python:
python -m http.server 8000

# Or open index.html directly in a browser
```

The application runs entirely client-side. The dashboard automatically initializes dynamic DOM updates and starts a 5-second live simulation loop upon page load.

## Core Rules & Architecture

1. **Gym Capacity**: Fixed at `60` people (`const capacity = 60`).
2. **Occupancy Thresholds & Wait Times**:
   - **LOW Crowd** (`< 40%` occupancy, `< 24` people):
     - Badge Class: `.status.low` (bg `#e5f4e8`, text `#277a3e`)
     - Wait Time: `"0–5 min"`
   - **MODERATE Crowd** (`40% - 74%` occupancy, `24-44` people):
     - Badge Class: `.status.moderate` (bg `#eeeeee`, text `#555`)
     - Wait Time: `"10 min"`
   - **HIGH Crowd** (`>= 75%` occupancy, `>= 45` people):
     - Badge Class: `.status.high` (bg `#f7e4e4`, text `#9b3131`)
     - Wait Time: `"15–25 min"`

3. **Design System & Theme Tokens**:
   - **Canvas Background**: `#f7f7f7`
   - **Primary Accent / Headers**: `#171717`
   - **Card Background**: `#ffffff`
   - **Card Borders**: `1px solid #dedede`
   - **Subtle Text**: `#777777`
   - **Border Radius**: Cards (`14px` - `15px`), Buttons (`9px`), Status Badges (`20px` - `30px`)

## Key Conventions

- **State Management**:
  - `updateDashboard(people)` clamps input between `0` and `capacity` (`60`).
  - Computes `percent = Math.round((people / capacity) * 100)`.
  - Dynamically updates text content for `#currentPeople`, `#peopleStat`, `#percentage`, and sets `#progressBar.style.width`.
- **Live Activity Simulation**:
  - `setInterval(..., 5000)` randomly shifts crowd count by `+1` or `-1` every 5 seconds to simulate real-time gym check-ins and check-outs.
- **Navigation & Scrolling**:
  - Sticky navbar (`height: 76px`, `z-index: 1000`, `position: sticky`, `top: 0`).
  - `#viewCrowdBtn` triggers smooth scrolling into `#prediction` view (`scrollIntoView({ behavior: "smooth" })`).
- **Responsive Layout Breakpoints**:
  - **Tablet (`<= 850px`)**: Nav link padding reduced, image width adjusted to `200px`.
  - **Mobile (`<= 650px`)**: Navbar link text hidden (`display: none`), profile button scaled, crowd card switches to single column, gym background image hidden (`display: none`), stats grid switches from `1fr 1fr` to `1fr`.
  - **Small Mobile (`<= 380px`)**: Button container spans 100% width, header text scales down.
