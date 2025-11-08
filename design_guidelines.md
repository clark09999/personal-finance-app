# Personal Finance Dashboard - Design Guidelines

## Design Approach
**System**: Material Design principles with inspiration from modern fintech dashboards (Stripe, Revolut, Mint)
**Rationale**: Finance applications require data clarity, professional trustworthiness, and information density. Material Design provides excellent patterns for dashboards, data tables, and forms while maintaining consistency.

## Typography System
- **Primary Font**: Inter or Roboto via Google Fonts CDN
- **Hierarchy**:
  - Page Headers: text-3xl font-bold
  - Section Titles: text-xl font-semibold
  - Card Titles: text-lg font-medium
  - Body Text: text-base font-normal
  - Data/Numbers: text-sm font-medium (tabular-nums for alignment)
  - Labels: text-sm font-medium uppercase tracking-wide
  - Captions: text-xs

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Card spacing: p-6
- Section margins: mb-6 or mb-8
- Grid gaps: gap-4 or gap-6
- Button padding: px-4 py-2 or px-6 py-3

**Dashboard Grid**:
- Sidebar: fixed w-64, full height
- Main content: flex-1 with max-w-7xl container
- Card grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for summary cards
- Responsive breakpoints: Follow Tailwind defaults

## Core Components

### Navigation
- **Sidebar**: Fixed left navigation with logo at top, menu items with icons (Heroicons), bottom section for user profile
- **Menu Items**: Icon + label, active state with subtle indicator, hover states
- **Mobile**: Collapsible hamburger menu with overlay

### Dashboard Summary Cards
- **Structure**: 3-4 cards in grid showing key metrics (Total Spending, Budget Remaining, Savings, Goals)
- **Card Design**: Elevated cards with shadow-sm, rounded-lg borders
- **Content**: Large number (text-2xl font-bold), label below, optional icon or mini trend indicator
- **Layout**: p-6 spacing, flex column layout

### Transaction Table
- **Design**: Dense data table with alternating row subtle treatment
- **Columns**: Date | Description | Category | Amount | Actions
- **Headers**: Sticky positioning, font-semibold, border-b
- **Rows**: Hover state, px-4 py-3 spacing
- **Actions**: Icon buttons (edit/delete) aligned right
- **Filters**: Top bar with category dropdown, date range picker, search input

### Budget Progress Components
- **Layout**: Category cards showing budget vs. actual
- **Progress Bar**: Full-width rounded bar with animated fill, percentage label
- **Details**: Category name, spent amount / total budget, remaining amount
- **Alert States**: Visual indicators when approaching or exceeding budget (no color mentioned, use border/icon treatment)

### Charts & Visualizations
- **Library**: Recharts for all data visualization
- **Chart Types**: 
  - Pie chart for category breakdown
  - Line chart for monthly trends (6-month view)
  - Bar chart for budget comparison
- **Container**: Aspect ratio 16:9 or 4:3, p-6 card wrapper
- **Responsive**: min-h-64 or min-h-80, responsive width

### Forms
- **Input Fields**: 
  - Label above input (text-sm font-medium mb-2)
  - Input: px-4 py-2, rounded-md, border, focus ring
  - Full-width on mobile, max-w-md on desktop
- **Buttons**: 
  - Primary: px-6 py-3, rounded-md, font-medium
  - Secondary: px-4 py-2, border variant
  - Icon buttons: p-2, rounded-md for actions

### AI Insights Placeholder
- **Card Design**: Distinct elevated card with subtle border
- **Icon**: Sparkle or lightbulb icon (Heroicons)
- **Content**: "AI Insights Coming Soon" heading, descriptive text about future functionality
- **Position**: Prominent placement on dashboard, above or beside charts

## Component Library Reference
**Icons**: Heroicons (via CDN) - outline style for navigation, solid for data emphasis
**Standard Components**:
- Cards with shadow-sm, rounded-lg, border
- Buttons with hover/active states (native browser states)
- Input fields with focus states
- Dropdowns for filters
- Modal overlays for transaction add/edit (backdrop-blur-sm)
- Toast notifications for actions (top-right positioning)

## Spacing & Rhythm
- **Page Container**: px-4 md:px-6 lg:px-8, py-6 md:py-8
- **Section Spacing**: mb-8 between major sections
- **Card Grids**: gap-4 md:gap-6
- **Form Elements**: mb-4 between fields, mb-6 between sections
- **Consistent Padding**: All interactive elements use p-2, p-4, or p-6

## Data Display Principles
- **Numerical Emphasis**: Use tabular-nums for all currency/numerical data
- **Hierarchy**: Larger numbers for key metrics, smaller for supporting data
- **Grouping**: Related data in cards, clear visual separation between sections
- **Density**: Professional information density - not cramped but efficient use of space
- **Empty States**: Friendly illustrations with clear CTAs when no data exists

## Responsive Behavior
- **Mobile**: Single column, stacked cards, hamburger menu
- **Tablet**: 2-column grids, visible sidebar or slide-out
- **Desktop**: Full 3-column grids, fixed sidebar, optimal data table width

## Animations
Use sparingly and purposefully:
- Page transitions: Subtle fade-in
- Chart animations: Recharts built-in animations only
- Button states: Native browser hover (no custom hover effects needed)
- Form validation: Smooth error message appearance

**No Images Required**: This is a data-focused dashboard application without hero sections or marketing content.