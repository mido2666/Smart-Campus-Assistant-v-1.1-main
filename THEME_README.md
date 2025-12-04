# Theme System Documentation

## Overview

The Smart Campus Assistant uses a centralized theme system that supports light and dark modes with proper persistence and system preference detection.

## How It Works

### Initial Theme Detection

The app uses a two-phase approach to prevent theme flashing:

1. **Inline Script** (in `index.html`): Runs before React loads to set the initial theme class
2. **ThemeProvider** (in React): Manages theme state and handles toggling

### Theme Priority

The theme is determined in this order:
1. User's saved preference (localStorage.theme)
2. System preference (prefers-color-scheme: dark)
3. Default: light mode

## Usage

### Using the Theme Hook

Any component can access and control the theme:

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Force Dark</button>
      <button onClick={() => setTheme('light')}>Force Light</button>
    </div>
  );
}
```

### API Reference

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';           // Current theme
  setTheme: (theme: Theme) => void;  // Set specific theme
  toggleTheme: () => void;           // Toggle between light/dark
}
```

## Customization

### Adding a New Toggle Button

Simply import and use the existing DarkModeToggle component:

```typescript
import DarkModeToggle from './components/DarkModeToggle';

function MyHeader() {
  return (
    <header>
      <DarkModeToggle />
    </header>
  );
}
```

All toggles automatically sync across the application.

### Modifying Theme Colors

Edit `tailwind.config.js` to customize dark mode colors:

```javascript
theme: {
  extend: {
    colors: {
      darkBg: '#0B1220',      // Dark background
      cardDark: '#0F1724',    // Dark card background
      textDark: '#E6EEF8',    // Dark text color
      mutedDark: '#94A3B8',   // Dark muted text
    }
  }
}
```

### Customizing Initial Script

If you need to modify the initial theme detection logic, edit the inline script in `index.html`:

```html
<script>
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Your custom logic here
      if (theme === 'dark' || (!theme && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) { /* silent */ }
  })();
</script>
```

## Accessibility

The theme toggle buttons include:
- `aria-label`: Describes the action (e.g., "Switch to dark mode")
- `aria-pressed`: Indicates current state (true when dark mode is active)
- `title`: Provides tooltip text
- Keyboard accessible with proper focus states

## Browser Support

- localStorage API (all modern browsers)
- prefers-color-scheme media query (all modern browsers)
- CSS custom properties for dark mode (all modern browsers)

## Troubleshooting

### Theme Flashing on Load

If you see a flash of the wrong theme:
1. Verify the inline script in `index.html` is present and runs before the app bundle
2. Check that ThemeProvider wraps your entire app in `main.tsx`

### Toggles Not Syncing

If toggles don't sync:
1. Ensure all components import `useTheme` from `contexts/ThemeContext`
2. Verify ThemeProvider wraps the entire app

### Theme Not Persisting

If theme doesn't persist across sessions:
1. Check localStorage is enabled in the browser
2. Verify the domain isn't blocking localStorage
3. Check browser console for errors

## Performance Notes

- `useLayoutEffect` is used for synchronous DOM updates to prevent visual flashing
- Theme state updates are batched by React
- localStorage is accessed only during initialization and theme changes
- The inline script adds negligible load time (<1ms)
