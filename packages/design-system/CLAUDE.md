# Grassroots Design System

This file tells Claude (and any AI assistant) how to build UI for Project Grassroots correctly. Read it before writing any HTML, CSS, React, or component code for this project.

---

## What this system is

Grassroots is a feed-based social platform. The design system is **clean and minimal** — it exists to get out of the way of content. The aesthetic is warm-neutral, not cool. The personality lives in the typography contrast and the non-blue accent, not in decoration.

When in doubt: **remove something rather than add something.**

---

## File structure

```
grassroots-design-system/
├── index.css                   ← Import this. It pulls everything in order.
├── tokens/
│   ├── colors.css              ← All color custom properties + dark mode
│   ├── typography.css          ← Font families, scale, utility classes
│   ├── spacing.css             ← Spacing, radius, borders, z-index, layout
│   └── motion.css              ← Duration scale, easing curves, keyframes     [NEW]
└── components/
    ├── components.css          ← Core component classes
    ├── components-new.css      ← Tabs, dropdowns, tooltips, command palette    [NEW]
    └── responsive.css          ← Breakpoints, mobile nav, bottom sheet         [NEW]
```

Import order in `index.css`:
```css
@import './tokens/colors.css';
@import './tokens/typography.css';
@import './tokens/spacing.css';
@import './tokens/motion.css';          /* NEW */
@import './components/components.css';
@import './components/components-new.css'; /* NEW */
@import './components/responsive.css';  /* NEW — always last */
```

Always import `index.css`. Never import token files individually in production.

---

## Color

All colors are CSS custom properties. **Never hardcode a hex value in component code.** Use tokens.

| Token | Value | Use |
|---|---|---|
| `--color-ink` | `#1C2B1A` | Primary text, filled buttons, headings |
| `--color-ink-soft` | `#3D3D35` | Body copy, feed post text |
| `--color-accent` | `#6B8C6A` | The one interactive color. Focus rings, active links, following badges |
| `--color-accent-subtle` | `#D5E5D4` | Avatar backgrounds, accent badge fills |
| `--color-accent-mist` | `rgba(107,140,106,0.12)` | Focus ring glow only |
| `--color-canvas` | `#F7F6F4` | Page background |
| `--color-surface` | `#FAFAF8` | Cards, inputs, nav bar |
| `--color-border` | `#E2DDD7` | Default hairline borders |
| `--color-border-strong` | `#C5C0B8` | Input borders, dividers on hover |
| `--color-secondary` | `#8A897F` | Timestamps, secondary labels |
| `--color-muted` | `#A5A49A` | Placeholders, tertiary text |
| `--color-danger` | `#C17A5A` | Errors, destructive actions |
| `--color-danger-subtle` | `#F0EAE0` | Error background tints |

**The accent is sage green, not blue.** This is the system's primary personality choice. Do not introduce blue as an interactive color. Do not use `#0000ff`, `#3B82F6`, or any blue for hover, focus, or active states.

Dark mode is handled automatically via `@media (prefers-color-scheme: dark)` overrides in `colors.css`. Never write manual dark mode overrides in component code — trust the tokens.

---

## Typography

Two fonts. That's it.

| Role | Family | When to use |
|---|---|---|
| `--font-display` | DM Serif Display | Wordmark, hero headings, section titles. Use sparingly. |
| `--font-body` | Inter | Everything else — all UI, labels, body copy, buttons. |

**The display font is kept rare.** If it appears on every screen it loses meaning. Use `--font-display` for the wordmark and one or two headline moments per page at most.

### Type scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-display` | 36px (28px mobile) | — (font-display) | Hero / page title |
| `--text-title` | 24px (22px mobile) | — (font-display) | Section heading |
| `--text-heading` | 16px | 500 | Card titles, modal headers |
| `--text-body` | 14px | 400 | Feed posts, descriptions |
| `--text-small` | 12px | 400 | Timestamps, metadata |
| `--text-label` | 11px | 500 | Eyebrows, section labels (always uppercase + tracked) |

Display and title sizes scale down on mobile automatically via `responsive.css`. No manual overrides needed.

Only two weights are used: **400 regular** and **500 medium**. Never use 600, 700, or bold.

---

## Spacing

Use the scale. Don't invent values.

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 12px |
| `--space-lg` | 20px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 72px |

---

## Border radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 4px | Badges, small tags |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 10px | Cards, panels |
| `--radius-xl` | 16px | Modals, bottom sheets |
| `--radius-pill` | 999px | Avatars, pill badges |

---

## Borders

All borders are **0.5px**. Never 1px. This is a system-wide rule.

```css
border: var(--border-default);  /* 0.5px solid --color-border */
border: var(--border-strong);   /* 0.5px solid --color-border-strong */
border: var(--border-accent);   /* 0.5px solid --color-accent */
border: var(--border-dashed);   /* 0.5px dashed --color-border-strong — empty states only */
```

Focus rings use box-shadow, not border:
```css
box-shadow: var(--focus-ring); /* 0 0 0 3px --color-accent-mist */
```

---

## Motion [NEW]

All animation flows through `motion.css` tokens. **Never hardcode `transition` durations or `animation` timing functions in component code.**

### Duration scale

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 50ms | Press states, toggle switches |
| `--duration-fast` | 120ms | Hover, focus ring, color transitions |
| `--duration-base` | 200ms | Dropdowns, tooltips, standard UI |
| `--duration-slow` | 320ms | Modals, command palette |
| `--duration-relaxed` | 480ms | Page choreography, entrance sequences |

### Easing curves

| Token | Curve | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default for most UI motion |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Elements arriving on screen |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving — start fast |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bottom sheets, playful moments |
| `--ease-linear` | `linear` | Spinners and progress bars only |

### Reduced motion

**Never write `@media (prefers-reduced-motion)` in component code.** The `motion.css` token file collapses all durations to `0ms` globally when the user requests reduced motion. Components automatically become instant — no per-component overrides required.

### Transition shorthands

```css
transition: var(--transition-colors);    /* color + bg + border + opacity */
transition: var(--transition-transform); /* transform only */
transition: var(--transition-all);       /* both combined */
```

### Keyframe utility classes

Apply to elements that enter the DOM:

```html
<div class="animate-fade-in">…</div>
<div class="animate-scale-in">…</div>
<div class="animate-slide-up">…</div>
<div class="animate-sheet-up">…</div> <!-- mobile bottom sheet -->
```

For exit animations, add `.is-exiting` before removing from DOM, then remove the element after `--duration-fast`:

```js
el.classList.add('is-exiting');
setTimeout(() => el.remove(), 120); // matches --duration-fast
```

---

## Responsive & mobile [NEW]

Grassroots is **mobile-first**. Base styles target mobile; breakpoints layer up.

### Breakpoints

| Token | Value | Intent |
|---|---|---|
| `--bp-sm` | 480px | Large phones, landscape |
| `--bp-md` | 768px | Tablets |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Wide desktop |

Use in media queries:
```css
/* Mobile first — base styles are mobile */
.component { … }

/* Tablet and up */
@media (min-width: 768px) { .component { … } }

/* Desktop and up */
@media (min-width: 1024px) { .component { … } }
```

### Touch targets

All interactive elements on mobile must meet **44×44px minimum** (WCAG 2.5.5). `responsive.css` enforces this on `.btn`, `.action-btn`, and `.input` automatically. The only intentional exception is `.btn-sm` in dense contexts (36px).

Never make a tappable element smaller than 44px on mobile, even if it looks small visually — use padding to expand the hit area.

### Mobile input rule

Inputs on mobile must have `font-size: 16px` minimum. `responsive.css` applies this automatically. If this is missing, iOS will zoom the viewport on focus — a critical UX bug.

### Navbar — top on desktop, bottom on mobile

The `.navbar` component changes layout automatically:

- **Desktop:** Sticky top bar with logo, links, and action buttons.
- **Mobile:** Fixed bottom tab bar with icon + label pairs. Logo hidden. Actions collapsed into profile tab.

On mobile, add icons to nav links:
```html
<!-- Desktop: text links work fine -->
<a href="/feed" class="navbar-link active">Feed</a>

<!-- Mobile: icon + label pair required -->
<a href="/feed" class="navbar-link active">
  <i class="ti ti-home" aria-hidden="true"></i>
  Feed
</a>
```

Add `padding-bottom` to `body` equal to `--mobile-nav-height + safe-area-inset-bottom` so the bottom nav never covers content. `responsive.css` handles this automatically.

### Feed layout

Use `.feed-layout` for the two-column desktop layout. It collapses to single column on tablet and below:

```html
<div class="feed-layout">
  <aside class="feed-sidebar">…</aside>
  <div class="feed-column">…</div>
</div>
```

On mobile, `.feed-card` goes full-bleed (no left/right border, border-radius removed). This is intentional — it's more content-native on small screens.

### Safe area insets

For notched/dynamic-island devices, use the safe area tokens:

```css
padding-bottom: calc(var(--space-lg) + var(--safe-bottom));
padding-top:    calc(var(--space-lg) + var(--safe-top));
```

These resolve to `env(safe-area-inset-*)` with `0px` fallbacks.

---

## Components

### Buttons

```html
<!-- Primary — one per view maximum -->
<button class="btn btn-primary">Follow</button>

<!-- Secondary — default for most actions -->
<button class="btn btn-secondary">Share</button>

<!-- Ghost — low-emphasis, tertiary actions -->
<button class="btn btn-ghost">Skip for now</button>

<!-- Danger — destructive only -->
<button class="btn btn-danger">Delete post</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Post</button>
<button class="btn btn-secondary btn-lg">Create account</button>

<!-- Icon only -->
<button class="btn btn-secondary btn-icon" aria-label="Notifications">
  <i class="ti ti-bell" aria-hidden="true"></i>
</button>
```

**Rules:**
- Sentence case always.
- Verb first: "Save changes", not "Changes saved".
- One `.btn-primary` per view. All siblings use `.btn-secondary` or `.btn-ghost`.
- Never disable a button unless there's a clear reason visible on screen.

---

### Tabs [NEW]

Two variants: **underline** (primary page navigation) and **pill** (filter rows).

Both scroll horizontally on mobile. Never wrap tabs onto two lines.

#### Underline tabs

```html
<div class="tabs">
  <div class="tab-list" role="tablist">
    <button class="tab active" role="tab" aria-selected="true">
      <i class="ti ti-home" aria-hidden="true"></i>
      Feed
    </button>
    <button class="tab" role="tab" aria-selected="false">
      Communities
      <span class="tab-badge">3</span>
    </button>
    <button class="tab" role="tab" aria-selected="false">Saved</button>
  </div>

  <div class="tab-panel" role="tabpanel">
    <!-- Active panel content -->
  </div>
</div>
```

Use `role="tablist"`, `role="tab"`, `role="tabpanel"`, and `aria-selected` for accessibility.

Tab badges show counts. The badge fills accent on active, subtle on inactive.

#### Pill tabs (filter row)

```html
<div class="tab-list-pill">
  <button class="tab-pill active">All</button>
  <button class="tab-pill">Design</button>
  <button class="tab-pill">Engineering</button>
  <button class="tab-pill">Community</button>
</div>
```

Pill tabs don't require `role="tablist"` if they function as filters rather than navigation.

---

### Dropdown menus [NEW]

```html
<div class="dropdown">
  <button class="btn btn-secondary" aria-haspopup="true" aria-expanded="false">
    Options <i class="ti ti-chevron-down" aria-hidden="true"></i>
  </button>

  <div class="dropdown-menu">
    <button class="dropdown-item">
      <i class="ti ti-edit" aria-hidden="true"></i>
      Edit post
    </button>
    <button class="dropdown-item">
      <i class="ti ti-bookmark" aria-hidden="true"></i>
      Save
    </button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item danger">
      <i class="ti ti-trash" aria-hidden="true"></i>
      Delete post
    </button>
  </div>
</div>
```

**Alignment modifiers:**
```html
<div class="dropdown-menu align-end">…</div>   <!-- right-aligned to trigger -->
<div class="dropdown-menu align-top">…</div>   <!-- opens upward -->
```

**With section labels:**
```html
<div class="dropdown-menu">
  <div class="dropdown-label">Account</div>
  <a href="/profile" class="dropdown-item">…</a>
  <div class="dropdown-divider"></div>
  <button class="dropdown-item danger">Sign out</button>
</div>
```

**Rules:**
- Always include an icon in dropdown items. It aids scanability.
- Danger items (destructive actions) always sit after a divider, at the bottom.
- Update `aria-expanded` on the trigger when the menu opens and closes.
- Close on outside click and on `Escape`.

---

### Tooltips [NEW]

Tooltips label icon-only controls. Never use them on elements that already have visible text.

```html
<div class="tooltip-wrapper">
  <button class="btn btn-secondary btn-icon" aria-label="Notifications">
    <i class="ti ti-bell" aria-hidden="true"></i>
  </button>
  <span class="tooltip">Notifications</span>
</div>
```

**Position variants:**

```html
<!-- Default: appears above -->
<span class="tooltip">Label</span>

<!-- Below the trigger -->
<span class="tooltip tooltip-bottom">Label</span>

<!-- Aligned to right edge -->
<span class="tooltip tooltip-end">Label</span>
```

**Rules:**
- Keep tooltip text to 3 words or fewer. It's a label, not a description.
- Include keyboard shortcuts in the tooltip when relevant: `"Search (⌘K)"`.
- Tooltip wrappers need `position: relative` — `.tooltip-wrapper` provides this.
- The `aria-label` on the button is the accessible name. The tooltip is visual reinforcement only.
- Dark mode: tooltips automatically invert to a light surface with border. No override needed.

---

### Search & command palette [NEW]

Triggered by `⌘K` (or `Ctrl+K`). Searches across people, communities, posts, and actions simultaneously.

```html
<!-- Backdrop — closes on outside click -->
<div class="command-backdrop" id="command-palette" role="dialog" aria-modal="true" aria-label="Search">

  <div class="command-palette">

    <!-- Search input -->
    <div class="command-input-row">
      <i class="ti ti-search" aria-hidden="true"></i>
      <input class="command-input" type="search" placeholder="Search people, communities, posts…" autofocus />
      <span class="command-shortcut-hint">esc</span>
    </div>

    <!-- Results -->
    <div class="command-results" role="listbox">

      <div class="command-section-label">Communities</div>

      <div class="command-item is-active" role="option" aria-selected="true">
        <div class="command-item-icon">
          <i class="ti ti-plant" aria-hidden="true"></i>
        </div>
        <div class="command-item-body">
          <div class="command-item-title">
            <span class="command-match">Des</span>ign Systems
          </div>
          <div class="command-item-subtitle">2.4k members · Following</div>
        </div>
      </div>

      <div class="command-section-label">Actions</div>

      <div class="command-item" role="option">
        <div class="command-item-icon"><i class="ti ti-pencil" aria-hidden="true"></i></div>
        <div class="command-item-body">
          <div class="command-item-title">New post</div>
        </div>
        <span class="command-item-shortcut">⌘N</span>
      </div>

    </div>

    <!-- Keyboard hints footer -->
    <div class="command-footer">
      <span class="command-footer-hint"><kbd>↑↓</kbd> navigate</span>
      <span class="command-footer-hint"><kbd>↵</kbd> open</span>
      <span class="command-footer-hint"><kbd>esc</kbd> close</span>
    </div>

  </div>
</div>
```

**Keyboard behaviour to implement:**
- `⌘K` / `Ctrl+K` — open
- `↑` / `↓` — move `.is-active` between items
- `Enter` — follow active item's action
- `Escape` — close
- `Tab` — should not cycle through results; use arrow keys

**Match highlighting:**
Wrap the matched portion of result text in `<span class="command-match">`.

**On mobile:**
The palette slides up as a bottom sheet automatically (handled by `responsive.css`). The keyboard hint footer is hidden. `autofocus` on the input triggers the software keyboard.

---

### Bottom sheet / modal [NEW]

A single component that behaves differently by breakpoint. Write it once, it adapts.

- **Mobile (< 768px):** Slides up from the bottom with spring easing. Has a drag handle.
- **Desktop (≥ 768px):** Renders as a centered modal with scale-in animation. Drag handle hidden.

```html
<!-- Backdrop — always present, closes on click -->
<div class="sheet-backdrop" role="dialog" aria-modal="true">

  <div class="sheet">
    <!-- Handle visible on mobile only -->
    <div class="sheet-handle" aria-hidden="true"></div>

    <div class="sheet-title">Share this post</div>

    <!-- Sheet content -->
    <div>…</div>

    <!-- Close action -->
    <button class="btn btn-secondary" style="width:100%;" onclick="closeSheet()">Cancel</button>
  </div>

</div>
```

**Rules:**
- Always include a close/cancel action inside the sheet — never rely on backdrop-click alone.
- Trap focus inside the sheet while open.
- On mobile, add `padding-bottom: calc(var(--space-lg) + var(--safe-bottom))` to `.sheet` for notched devices — `responsive.css` handles this.
- Sheets open with `gr-sheet-up` animation on mobile, `gr-scale-in` on desktop. Add `.is-exiting` before removing from DOM.

---

### Feed card

```html
<article class="feed-card">
  <header class="feed-card-header">
    <div class="avatar avatar-md">MR</div>
    <div class="feed-card-meta">
      <div class="feed-card-name">Maya Rodriguez</div>
      <div class="feed-card-time">
        2 hours ago · <a href="/c/design" style="color:var(--color-accent);">Community Design</a>
      </div>
    </div>
  </header>

  <div class="feed-card-body">
    Post content goes here.
  </div>

  <footer class="feed-card-actions">
    <button class="action-btn">
      <i class="ti ti-heart" aria-hidden="true"></i>
      48
    </button>
    <button class="action-btn">
      <i class="ti ti-message-circle" aria-hidden="true"></i>
      12
    </button>
    <button class="action-btn">
      <i class="ti ti-share" aria-hidden="true"></i>
      Share
    </button>
  </footer>
</article>
```

On mobile, feed cards go full-bleed automatically (no horizontal borders, no radius). This is intentional.

---

### Badges

```html
<span class="badge badge-default">General</span>
<span class="badge badge-accent">Following</span>
<span class="badge badge-warm">New</span>
<span class="badge badge-muted">Draft</span>
<span class="badge badge-danger">Removed</span>
```

---

### Inputs

```html
<!-- Basic input -->
<input class="input" type="text" placeholder="What's on your mind?" />

<!-- With field wrapper -->
<div class="field">
  <label class="field-label">Display name</label>
  <input class="input" type="text" placeholder="e.g. Maya Rodriguez" />
  <span class="field-hint">Shown on your profile and posts.</span>
</div>

<!-- Error state -->
<div class="field">
  <label class="field-label">Email</label>
  <input class="input input-error" type="email" />
  <span class="field-error">Enter a valid email address.</span>
</div>

<!-- Textarea -->
<textarea class="input" rows="4" placeholder="Share something…"></textarea>
```

On mobile, inputs automatically use `font-size: 16px` to prevent iOS viewport zoom.

---

### Avatars

```html
<div class="avatar avatar-sm">MR</div>
<div class="avatar avatar-md">MR</div>  <!-- Default -->
<div class="avatar avatar-lg">MR</div>
<div class="avatar avatar-xl">MR</div>

<!-- With image -->
<div class="avatar avatar-md">
  <img src="/user/maya.jpg" alt="Maya Rodriguez" />
</div>

<!-- Stacked group -->
<div class="avatar-group">
  <div class="avatar avatar-sm">MR</div>
  <div class="avatar avatar-sm">JK</div>
  <div class="avatar avatar-sm" style="background:var(--color-surface);color:var(--color-secondary);">+4</div>
</div>
```

---

### Navigation bar

```html
<nav class="navbar">
  <a href="/" class="navbar-logo">Grassroots</a>

  <ul class="navbar-links">
    <!-- Include icons — they appear on mobile bottom nav -->
    <li>
      <a href="/feed" class="navbar-link active">
        <i class="ti ti-home" aria-hidden="true"></i>
        Feed
      </a>
    </li>
    <li>
      <a href="/explore" class="navbar-link">
        <i class="ti ti-compass" aria-hidden="true"></i>
        Explore
      </a>
    </li>
    <li>
      <a href="/communities" class="navbar-link">
        <i class="ti ti-plant" aria-hidden="true"></i>
        Communities
      </a>
    </li>
  </ul>

  <div class="navbar-actions">
    <div class="tooltip-wrapper">
      <button class="btn btn-secondary btn-icon" aria-label="Search" onclick="openCommandPalette()">
        <i class="ti ti-search" aria-hidden="true"></i>
      </button>
      <span class="tooltip">Search (⌘K)</span>
    </div>
    <button class="btn btn-secondary btn-icon" aria-label="Notifications">
      <i class="ti ti-bell" aria-hidden="true"></i>
    </button>
    <div class="avatar avatar-sm">MR</div>
  </div>
</nav>
```

Icons on nav links are required — they're the only label visible on the mobile bottom tab bar.

---

### Empty states

```html
<div class="empty-state">
  <div class="empty-state-icon">
    <i class="ti ti-photo" aria-hidden="true"></i>
  </div>
  <div class="empty-state-title">Your feed is quiet</div>
  <div class="empty-state-body">
    Follow people and communities to see their posts here.
  </div>
  <button class="btn btn-primary btn-sm">Explore communities</button>
</div>
```

Empty states are invitations, not apologies. Title names the space. Body says what to do. CTA is a verb.

---

### Notifications

```html
<div class="notif">
  <div class="notif-dot"></div>
  <div>
    <div class="notif-text">
      <strong style="font-weight:500;">Jonah Kim</strong> liked your post.
    </div>
    <div class="notif-time">5 min ago</div>
  </div>
</div>

<div class="notif">
  <div class="notif-dot read"></div>
  <div>
    <div class="notif-text">3 people started following you.</div>
    <div class="notif-time">Yesterday</div>
  </div>
</div>
```

---

### Toasts

```html
<div class="toast">Post published.</div>
<div class="toast toast-success">Changes saved.</div>
<div class="toast toast-danger">Couldn't connect. Try again.</div>
```

Toasts are brief, past-tense, no punctuation unless needed. "Post published", not "Your post was published successfully!".

---

## Icons

This system uses [Tabler Icons](https://tabler.io/icons) (outline only).

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

<i class="ti ti-heart" aria-hidden="true"></i>
<i class="ti ti-message-circle" aria-hidden="true"></i>
<i class="ti ti-share" aria-hidden="true"></i>
<i class="ti ti-bell" aria-hidden="true"></i>
<i class="ti ti-search" aria-hidden="true"></i>
<i class="ti ti-home" aria-hidden="true"></i>
<i class="ti ti-compass" aria-hidden="true"></i>
<i class="ti ti-plant" aria-hidden="true"></i>
<i class="ti ti-settings" aria-hidden="true"></i>
<i class="ti ti-chevron-down" aria-hidden="true"></i>
<i class="ti ti-dots" aria-hidden="true"></i>
```

- Always **outline** variants. Never `-filled` suffixes.
- Decorative icons get `aria-hidden="true"`.
- Icon-only buttons get `aria-label` on the button element.
- Size via `font-size`: 14px inline, 16–20px standard UI, 24px max.

---

## Layout

```css
--feed-max-width:    640px;  /* Single-column feed container */
--sidebar-width:     240px;  /* Left nav / sidebar */
--content-max-width: 960px;  /* Outer page wrapper */
```

The feed is single-column, centered, max 640px. This is not negotiable.

**Standard two-column page shell (desktop):**

```html
<body>
  <nav class="navbar">…</nav>

  <div class="feed-layout">
    <aside class="feed-sidebar">
      <!-- Left sidebar: profile summary, suggested communities -->
    </aside>
    <div class="feed-column">
      <!-- Feed cards -->
    </div>
  </div>
</body>
```

`.feed-layout` handles the responsive collapse — sidebar disappears on tablet and below.

---

## Writing style

- **Sentence case everywhere.** Buttons, headings, labels, nav links. Never Title Case in UI.
- **Verb-first on CTAs.** "Create post", "Edit profile", "Follow community".
- **No "successfully".** "Post published", not "Your post was published successfully."
- **No "please".** "Enter a display name", not "Please enter a display name."
- **No exclamation marks** on system copy.
- **Errors say what happened and what to do.** "That username's taken. Try another."
- **Empty states are invitations.** "Your feed is quiet" + "Follow people to see their posts here."
- **Tooltip text is a label, not a sentence.** "Notifications", not "View your notifications".

---

## What not to do

| Don't | Do instead |
|---|---|
| Hardcode hex values | Use `--color-*` tokens |
| Use blue for interactive states | Use `--color-accent` (sage green) |
| Use `font-weight: 600` or `700` | Max is `500` |
| Add drop shadows to cards | Hairline borders only |
| Use `border: 1px` | Always `0.5px` |
| Use DM Serif Display for body text | Only for wordmark and display headings |
| Use more than one `.btn-primary` per view | Demote extras to `.btn-secondary` |
| Write "successfully" in toast copy | Just state what happened |
| Create new spacing values outside the scale | Use the closest `--space-*` token |
| Introduce a second accent color | Sage green is the only interactive color |
| Hardcode durations in transitions | Use `--duration-*` tokens |
| Write `@media (prefers-reduced-motion)` in components | Trust motion tokens — they collapse globally |
| Use `font-size` below 16px on mobile inputs | Causes iOS viewport zoom |
| Make touch targets smaller than 44px | Use padding to expand hit area |
| Tooltip text longer than ~3 words | It's a label, not a description |
| Show tooltips on elements with visible text | Tooltips are for icon-only controls only |
| Use dropdown without danger items after a divider | Group and order for safety |
| Wrap nav links to two rows on mobile | Enforce horizontal scroll instead |

---

## Checklist before shipping a screen

- [ ] All colors reference `--color-*` tokens
- [ ] No hardcoded hex, rgb, or rgba values
- [ ] All borders are 0.5px
- [ ] Focus states use `--focus-ring` box-shadow
- [ ] One `.btn-primary` maximum per view
- [ ] DM Serif Display used only for display/title roles
- [ ] All text is sentence case
- [ ] Icons have `aria-hidden="true"` or `aria-label` on parent
- [ ] Dark mode works (tokens flip automatically)
- [ ] Feed content constrained to `--feed-max-width` (640px)
- [ ] All transitions use `--duration-*` and `--ease-*` tokens
- [ ] No manual `@media (prefers-reduced-motion)` overrides in component code
- [ ] Mobile touch targets meet 44px minimum
- [ ] Text inputs use `font-size: 16px` minimum on mobile (prevents iOS zoom)
- [ ] Nav links include icons (required for mobile bottom tab bar)
- [ ] Tooltips only on icon-only controls, text ≤ 3 words
- [ ] Dropdown danger items sit after a divider, at the bottom
- [ ] Bottom sheets have an explicit close action inside (not backdrop-only)
- [ ] Safe area insets applied wherever content meets screen edges
