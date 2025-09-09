# AnchorPopover Component Documentation

## Overview

The `AnchorPopover` component is a reusable, accessible popover component built with `@floating-ui/react`. It provides proper positioning, collision detection, and keyboard navigation for dropdown menus and popover content.

## Features

✅ **Proper Positioning**: Uses `bottom-start` placement by default with 8px offset  
✅ **Collision Detection**: Automatically flips and shifts to avoid screen edges  
✅ **Portal Rendering**: Renders to `<body>` to avoid z-index and overflow issues  
✅ **Accessibility**: Full keyboard navigation, focus management, and ARIA attributes  
✅ **Animation**: Smooth GPU-friendly animations with `prefers-reduced-motion` support  
✅ **Click Outside & ESC**: Closes on outside clicks and Escape key  
✅ **Focus Return**: Returns focus to trigger button when closed  

## Basic Usage

```jsx
import { AnchorPopover } from '@shared/components/ui'

function HeaderButton() {
  return (
    <AnchorPopover
      trigger={
        <button className="icon-btn">
          <BellIcon />
        </button>
      }
    >
      {({ close }) => (
        <div className="p-4">
          <p>Popover content</p>
          <button onClick={close}>Close</button>
        </div>
      )}
    </AnchorPopover>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `ReactNode` | required | The trigger element that opens the popover |
| `children` | `ReactNode \| ({ close, activeIndex, getItemProps }) => ReactNode` | required | Content or render function |
| `placement` | `Placement` | `'bottom-start'` | Floating-UI placement |
| `offset` | `number` | `8` | Distance from trigger element |
| `className` | `string` | `''` | Additional CSS classes |
| `role` | `'menu' \| 'dialog'` | `'menu'` | ARIA role for accessibility |
| `modal` | `boolean` | `false` | Focus trap behavior |

## Advanced Usage with Menu Items

```jsx
<AnchorPopover
  trigger={
    <button className="icon-btn" aria-label="User menu">
      <UserIcon />
    </button>
  }
  placement="bottom-end"
  role="menu"
>
  {({ close, getItemProps }) => (
    <div className="py-2">
      <button 
        {...getItemProps({ index: 0 })}
        className="block px-4 py-2 hover:bg-surface-soft w-full text-left"
      >
        Profile
      </button>
      <button 
        {...getItemProps({ index: 1 })}
        className="block px-4 py-2 hover:bg-surface-soft w-full text-left"
        onClick={() => {
          handleLogout()
          close()
        }}
      >
        Logout
      </button>
    </div>
  )}
</AnchorPopover>
```

## Accessibility Features

### ARIA Attributes
- `aria-haspopup`: Set to `"menu"` or `"dialog"` based on role
- `aria-expanded`: Indicates open/closed state
- `aria-controls`: Links trigger to popover content
- `role="menu"` and `role="menuitem"` for menu items

### Keyboard Navigation
- **Arrow Keys**: Navigate between menu items
- **Enter/Space**: Activate focused item
- **Escape**: Close popover
- **Tab**: Standard tab navigation
- **Type-ahead**: Jump to items by typing

### Focus Management
- Focus is trapped within popover when `modal=true`
- Focus returns to trigger button when closed
- First item is focused when opened (for menus)

## Animation

The component uses `framer-motion` for smooth animations:

- **GPU-friendly**: Uses `transform` and `opacity`
- **Reduced motion**: Respects `prefers-reduced-motion: reduce`
- **Smooth transitions**: 150ms duration with ease-out timing

## Positioning

Built on `@floating-ui/react` with smart positioning:

- **Default**: `bottom-start` with 8px offset
- **Flip**: Automatically flips to opposite side when colliding
- **Shift**: Shifts along the axis to stay in viewport
- **Auto-update**: Repositions on scroll, resize, and DOM changes

## Examples in Header

### Notifications Dropdown
```jsx
<AnchorPopover
  trigger={
    <button className="relative icon-btn">
      <BellIcon />
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  }
  placement="bottom-end"
>
  {({ close }) => (
    <NotificationDropdown onClose={close} />
  )}
</AnchorPopover>
```

### Search Dropdown
```jsx
<AnchorPopover
  trigger={
    <button className="icon-btn">
      <SearchIcon />
    </button>
  }
  placement="bottom-start"
>
  {({ close }) => (
    <ClientSearchDropdown onClose={close} />
  )}
</AnchorPopover>
```

### Settings Menu
```jsx
<AnchorPopover
  trigger={
    <button className="icon-btn">
      <SettingsIcon />
    </button>
  }
  placement="bottom-end"
  role="menu"
>
  {({ close, getItemProps }) => (
    <div className="py-2 min-w-48">
      <button {...getItemProps({ index: 0 })}>
        Profile Settings
      </button>
      <button {...getItemProps({ index: 1 })}>
        Preferences
      </button>
      <hr />
      <button {...getItemProps({ index: 2 })}>
        Sign Out
      </button>
    </div>
  )}
</AnchorPopover>
```

## Migration from SimpleDropdown

Replace `SimpleDropdown` usage:

```jsx
// Before
<SimpleDropdown
  trigger={<button>Click</button>}
  align="right"
>
  {({ onClose }) => <Content onClose={onClose} />}
</SimpleDropdown>

// After  
<AnchorPopover
  trigger={<button>Click</button>}
  placement="bottom-end"
>
  {({ close }) => <Content onClose={close} />}
</AnchorPopover>
```

## Browser Support

- **Modern browsers**: Full support with all features
- **Legacy browsers**: Graceful degradation without animations
- **Mobile**: Touch-friendly with proper viewport handling
- **Screen readers**: Full accessibility support

## Performance

- **Portal rendering**: Avoids layout thrashing
- **Auto-update**: Efficient positioning updates
- **GPU acceleration**: Hardware-accelerated animations
- **Tree-shakable**: Import only what you need

## Troubleshooting

### Popover appears in wrong position
- Check for `overflow: hidden` containers
- Ensure trigger has proper positioning context
- Verify z-index stacking context

### Focus issues
- Make sure trigger is focusable
- Check for competing focus traps
- Verify ARIA attributes are correct

### Animation problems  
- Check `prefers-reduced-motion` settings
- Verify Framer Motion is properly installed
- Look for CSS conflicts with transforms

## Related Components

- `SimpleDropdown`: Legacy dropdown (deprecated)
- `Tooltip`: For simple hover content
- `Modal`: For full-screen overlays
- `Select`: For form dropdowns