# System Context
**Brand Name:** Gauge
**Live Staging URL:** https://usegauge.vercel.app/
**Slogan:** "Zero bots. All signal."
**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, React.
**Vibe:** Premium, minimal, high-end B2B enterprise SaaS (think Linear, Vercel, or Stripe). Deep charcoal black and stark white.

# Task Objective
Implement a highly polished, interactive global Command Menu (`Cmd + K` / `Ctrl + K` palette) that elevates the platform's user experience and accessibility, without breaking any existing backend API routes or database schemas.

# Architectural Instructions
1. **Component Creation:** Create a new self-contained client component at `src/components/ui/command-menu.tsx`.
2. **Global Layout Integration:** Inject this component safely into the root layout (`src/app/layout.tsx`) just inside the `<body>` tag so the event listener handles the keyboard shortcut globally.
3. **Dependencies:** Use pure React state and Tailwind CSS to avoid adding unnecessary heavy libraries. If `cmdk` or Shadcn UI's `<Command>` primitive is already installed in the workspace, use that. Otherwise, build a native React modal.

# UI/UX Specifications
- **Backdrop:** Sleek glassmorphism (`bg-black/40 backdrop-blur-sm`).
- **Modal Container:** Dark mode aesthetic by default (`bg-gray-950 border-gray-800 rounded-xl shadow-2xl`).
- **Trigger:** Listen globally for both `Meta + k` (Mac) and `Ctrl + k` (Windows). Prevent default browser search behavior when pressed. Close the modal on `Escape` or clicking the backdrop.
- **Search Input:** Clean, transparent background, auto-focused, with the placeholder: "Type a command or search..."
- **Static Quick Actions (Suggestions):**
  - 🚀 Go to Dashboard
  - 🔌 Configure Integrations (Salesforce / HubSpot)
  - 💳 View Pricing
  - 📄 Documentation
- **Hover/Focus States:** Clean, rounded background highlights that transition smoothly when hovering over the quick actions.

# Execution Constraints
- DO NOT touch or alter `prisma/schema.prisma`.
- DO NOT modify any files inside `src/app/api/`.
- Ensure the code compiles with zero TypeScript or ESLint errors before finishing.
