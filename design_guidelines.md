# AI-DAN Design Guidelines

## Design Approach
**Reference-Based:** Linear-inspired with enterprise credibility. Clean, developer-focused aesthetics meeting professional HR software standards. Emphasizes clarity, efficiency, and intelligent information hierarchy.

## Core Design Principles
1. **Dual-Mode Clarity:** Distinct visual treatment for Development Mode vs HR Mode without color dependency
2. **AI Personality:** Consistent AI-DAN branding throughout - nerdy genius persona balanced with professional authority
3. **Information Density:** Dense layouts that don't overwhelm - strategic use of space and hierarchy
4. **Real-time Feedback:** Progress indicators, status badges, and live updates are prominent

## Typography
- **Primary Font:** Inter (Google Fonts) - clean, modern, excellent readability
- **Code Font:** JetBrains Mono - for code blocks and technical content
- **Hierarchy:**
  - H1: 2.5rem, font-semibold (page titles, AI-DAN greeting)
  - H2: 1.875rem, font-semibold (section headers, mode switchers)
  - H3: 1.5rem, font-medium (card titles, feature names)
  - Body: 1rem, font-normal (chat messages, descriptions)
  - Small: 0.875rem, font-normal (metadata, timestamps, labels)
  - Code: 0.9rem, font-mono (code snippets, technical data)

## Layout System
**Spacing Units:** Tailwind units 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Grid Structure:**
- **Main Layout:** Split-panel design (60% content / 40% sidebar on desktop)
- **Chat Interface:** Full-height left panel with message bubbles, right panel for context (code preview, HR documents, integrations)
- **Dashboard:** Card-based grid system (2-3 columns on desktop, stack on mobile)
- **Form Layouts:** Single column with max-w-2xl, generous vertical spacing (space-y-6)

## Component Library

### Core Navigation
- **Top Bar:** Fixed header with AI-DAN logo/branding, mode switcher (Development | HR), connection status indicators, user profile
- **Mode Switcher:** Pill-style toggle with clear active state (border treatment, not color-dependent)
- **Sidebar Navigation:** Collapsible with icons (Heroicons) - Projects, Templates, Integrations, Chat History, Settings

### Chat Interface
- **Message Bubbles:** Distinct treatment for user vs AI-DAN
  - User messages: Aligned right, compact
  - AI-DAN responses: Aligned left, avatar with nerdy glasses icon, generous spacing
- **Input Area:** Sticky bottom textarea with auto-expand, send button, attachment options
- **Typing Indicator:** Three animated dots when AI-DAN is processing

### Progress Dashboard
- **Status Cards:** Compact cards showing real-time AI-DAN actions
  - Action type (Analyzing, Coding, Deploying, Documenting)
  - Progress bar or spinner
  - Timestamp and status badge
- **Integration Pills:** Small badges showing connected services (GitHub, Discord, Notion) with status indicators

### Code Display
- **Syntax Highlighting:** Use Prism.js or highlight.js
- **File Tree:** Collapsible folder structure on the left of code panel
- **Code Blocks:** Dark theme with line numbers, copy button, language indicator
- **Live Preview:** Embedded iframe with responsive controls and device size toggles

### HR Compliance Tools
- **Compliance Checker:** Form-based interface with validation indicators
- **Calculator Cards:** WPS salary validator, Emiratisation quota calculator with clear input/output sections
- **Policy Templates:** Document preview with download/export options
- **Contract Generator:** Step-by-step wizard interface with progress indicator

### Project Templates
- **Template Grid:** 3-column grid of template cards
- **Template Card:** Icon, title, description, tech stack badges, "Use Template" button
- **Categories:** Quick filter pills (All, Web Apps, Discord Bots, APIs, HR Documents)

### Data Display
- **Tables:** Striped rows for readability, sticky headers, sortable columns
- **Stats:** Large number display with label and trend indicator
- **Badges:** Rounded pills for tags, status, tech stack (consistent sizing)
- **Avatars:** Circular for AI-DAN and user profiles

### Forms
- **Input Fields:** Full-width with floating labels, clear error states (border treatment)
- **Buttons:** 
  - Primary: Prominent, medium rounded corners
  - Secondary: Outlined style
  - Ghost: Minimal border, hover state elevation
- **Toggle Switches:** For settings and preferences
- **Select Dropdowns:** Custom-styled with Heroicons chevron

### Overlays
- **Modals:** Centered, max-w-2xl, backdrop blur, slide-up animation
- **Toast Notifications:** Top-right positioning, auto-dismiss, action buttons for critical alerts
- **Tooltips:** Subtle, appear on hover with 200ms delay, dark theme

## Animations
**Minimal and Purposeful:**
- Page transitions: 200ms fade
- Modal entry: 300ms slide-up with opacity
- Button hover: 150ms scale(1.02) transform
- Loading states: Subtle pulse or spinner
- **No scroll-based animations** - keep interface snappy

## Images
**Hero Section:** Yes - full-width abstract tech illustration showing AI + code + HR documents merging
- Placement: Top of landing/home view
- Style: Modern gradient mesh or isometric illustration
- Overlay: Subtle dark gradient for text readability

**Additional Images:**
- Integration logos: GitHub, Discord, Notion (official brand assets)
- Template previews: Screenshots of generated apps
- AI-DAN avatar: Nerdy character with glasses (consistent mascot)
- Empty states: Simple illustrations for "no projects yet," "chat history empty"

## Responsive Behavior
- **Desktop (1024px+):** Split panels, multi-column grids, full sidebar
- **Tablet (768-1023px):** Collapsible sidebar, 2-column grids, stacked chat
- **Mobile (<768px):** Single column, bottom nav, stacked everything, expandable code panels

## Accessibility
- Keyboard navigation throughout
- ARIA labels on interactive elements
- Focus indicators (2px outline offset)
- Semantic HTML structure
- Form validation with clear error messaging