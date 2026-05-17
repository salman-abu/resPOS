---
version: 1.0.0
theme: resPOS High-Visibility Light
description: A semantic, high-contrast light theme designed for POS environments with harsh lighting and screen glare.

tokens:
  colors:
    # ─── Foundations ──────────────────────────────────────────────────────────
    surface-base: '#F8FAFC' # App background (slate-50)
    surface-card: '#FFFFFF' # Elevated cards, modals, sidebars
    surface-sunken: '#F1F5F9' # Input backgrounds, disabled states (slate-100)

    # ─── Typography ───────────────────────────────────────────────────────────
    text-primary: '#0F172A' # Headers, active items (slate-900) - High Contrast
    text-secondary: '#475569' # Body copy, subtitles (slate-600)
    text-muted: '#94A3B8' # Placeholder, disabled text (slate-400)
    text-inverse: '#FFFFFF' # Text on solid primary/accent colors

    # ─── Borders ──────────────────────────────────────────────────────────────
    border-subtle: '#E2E8F0' # Dividers, standard borders (slate-200)
    border-strong: '#CBD5E1' # Hover states, active inputs (slate-300)

    # ─── Primary Brand ────────────────────────────────────────────────────────
    brand-light: '#DBEAFE' # Active tabs, subtle highlights (blue-100)
    brand-default: '#2563EB' # Primary buttons, active states (blue-600)
    brand-strong: '#1D4ED8' # Hover states (blue-700)

    # ─── Semantic / Actions ───────────────────────────────────────────────────
    success-light: '#DCFCE7' # Success backgrounds (green-100)
    success-default: '#16A34A' # Paid, Active, Available, Success text (green-600)

    danger-light: '#FEE2E2' # Error backgrounds, void actions (red-100)
    danger-default: '#DC2626' # Voids, Out of stock, Errors (red-600)

    warning-light: '#FEF3C7' # Warning backgrounds (amber-100)
    warning-default: '#D97706' # Billed tables, low stock alerts (amber-600)

    info-light: '#E0E7FF' # Info backgrounds (indigo-100)
    info-default: '#4F46E5' # Occupied tables, ongoing orders (indigo-600)

  spacing:
    xs: '0.25rem' # 4px
    sm: '0.5rem' # 8px
    md: '1rem' # 16px
    lg: '1.5rem' # 24px
    xl: '2rem' # 32px

  radii:
    sm: '0.25rem' # Buttons, inputs
    md: '0.5rem' # Small cards, items
    lg: '1rem' # Main layout cards, modals
    full: '9999px' # Pills, avatars

  shadows:
    sm: '0 1px 2px 0 rgba(15, 23, 42, 0.05)'
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.03)'
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)'
---

# resPOS Design System

This document outlines the core design language for **resPOS**, optimized for high-visibility Point of Sale (POS) environments.

## Core Principles

1. **Legibility Over Aesthetics**: In a fast-paced restaurant environment, clarity is paramount. Pure whites, deep slate grays, and semantic colors ensure that screen glare does not impede a cashier or waiter's ability to read the screen.
2. **Distinct Interaction Areas**: We use shadows (`shadow-sm`, `shadow-md`) and distinct border colors (`border-subtle`) rather than glassmorphism to define interactive boundaries.
3. **Semantic Feedback**: Color is used strictly for meaning. Green always means success/available. Red always means destructive/void/error. Amber means caution/billed.
4. **Fat Finger Optimization**: All interactive elements (buttons, inputs, list items) must have a minimum target size of `44px` to `48px` to accommodate rapid, imprecise tapping on touch screens.

## Typography Structure

- **Font Family**: `Inter`, sans-serif.
- **Headings**: Bold (`700`), `text-primary`.
- **Body**: Regular (`400`) or Medium (`500`), `text-secondary`.
- **Labels/Tiny Text**: Bold (`700`), uppercase, tracking-wide, `text-muted` or colored.

## Components Guidelines

### 1. POS Item Cards

- **Background**: `surface-card` (White)
- **Border**: `border-subtle`
- **Hover/Active**: `border-brand-default` with a slight transform (e.g., scale 101%)
- **Shadow**: `shadow-sm` default, `shadow-md` on hover.

### 2. Sidebars & Layouts

- **Main Background**: `surface-base`
- **Sidebar Navigation**: `surface-card`
- **Active Tab/Nav**: `brand-light` background with `brand-default` text and icon.

### 3. Forms & Inputs

- **Background**: `surface-sunken` or `surface-card` with `border-subtle`.
- **Focus State**: Ring with `brand-default` and distinct solid border.

## AI Instructions

When generating UI components for resPOS:

- Do NOT use hardcoded colors like `bg-gray-800` or `text-blue-500`.
- Use standard Tailwind CSS classes mapped to these design tokens (e.g., `bg-surface-card`, `text-primary`, `border-subtle`).
- Ensure dark mode overrides (`dark:...`) are removed from standard components, enforcing the Light Theme strictly across the application.
