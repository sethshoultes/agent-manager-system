# Agent Manager System Styling Overhaul Specification

## Overview
This document outlines the plan to modernize the Agent Manager System's UI by implementing a consistent styling framework using Tailwind CSS. The current system uses a mix of inline styles and CSS files, which has led to inconsistencies, styling conflicts, and maintenance challenges.

## Goals

1. **Consistent Design Language**: Implement a uniform design system across all components
2. **Theme Support**: Add light/dark mode support with consistent color schemes
3. **Component Reusability**: Standardize component styling for better reuse
4. **Responsive Design**: Ensure all interfaces work well across device sizes
5. **Performance**: Reduce CSS bundle size with utility-first approach
6. **Developer Experience**: Simplify styling workflow and reduce conflicts

## Technology Stack

- **Tailwind CSS**: Primary styling framework
- **CSS Variables**: For theme configuration
- **React Context**: For theme state management
- **Headless UI**: For accessible interactive components (optional)

## Implementation Plan

### Phase 1: Environment Setup

1. Install and configure Tailwind CSS with PostCSS
2. Set up base configuration and theme settings
3. Create global styles and CSS variables
4. Implement theme context and provider

### Phase 2: Design System Foundation

1. Define color palette for light and dark themes
2. Create typography scale and text styles
3. Define spacing system and layout conventions
4. Establish component-specific design patterns

### Phase 3: Core Component Conversion

1. Convert shared components first (Button, Card, Modal, etc.)
2. Convert layout components (Header, Sidebar, Layout)
3. Implement dashboard components and visualizations
4. Convert agent and report components

### Phase 4: Advanced Features

1. Implement responsive design patterns
2. Add animations and transitions where appropriate
3. Implement specific UI improvements for problem areas (logs display)
4. Optimize for performance and accessibility

## Design Specifications

### Color Palette

#### Light Theme
- **Primary**: #4a69bd (rich blue)
- **Secondary**: #6c5ce7 (soft purple)
- **Accent**: #00b894 (mint green)
- **Background**: #ffffff (white)
- **Surface**: #f5f7fa (light gray)
- **Error**: #e74c3c (red)
- **Warning**: #f39c12 (amber)
- **Success**: #2ecc71 (green)
- **Text Primary**: #24292e (dark gray)
- **Text Secondary**: #6c757d (medium gray)

#### Dark Theme
- **Primary**: #5c85e6 (bright blue)
- **Secondary**: #9c88ff (lavender)
- **Accent**: #00d1a0 (teal)
- **Background**: #1a1a2e (navy blue)
- **Surface**: #16213e (dark blue)
- **Error**: #ff6b6b (bright red)
- **Warning**: #feca57 (yellow)
- **Success**: #1dd1a1 (bright green)
- **Text Primary**: #f8f9fa (off-white)
- **Text Secondary**: #adb5bd (light gray)

### Typography

- **Font Family**: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif
- **Monospace**: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
- **Base Size**: 16px
- **Scale**: 1.25 ratio (major third)
- **Weights**: 400 (regular), 500 (medium), 700 (bold)

### Component-Specific Styles

#### Terminal/Log Display
- **Background**: Pure black (#000000)
- **Text**: Electric blue (#00bfff)
- **Border**: Dark gray (#444444)
- **Success Messages**: Bright green (#00ff00)
- **Error Messages**: Bright red (#ff6b6b)
- **Warning Messages**: Amber (#ffcc00)
- **Info Messages**: Electric blue (#00bfff)

## Success Criteria

1. All components use Tailwind classes instead of inline styles
2. Theme toggle works correctly between light and dark modes
3. Log displays and terminal interfaces have consistent styling
4. Responsive design works on mobile, tablet, and desktop
5. No CSS conflicts or specificity issues
6. Improved developer experience for styling components

## Timeline

- **Phase 1**: 1 day
- **Phase 2**: 1 day
- **Phase 3**: 2-3 days
- **Phase 4**: 1-2 days

Total estimated time: 5-7 days for complete implementation