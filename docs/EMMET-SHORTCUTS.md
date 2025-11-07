# Emmet Shortcuts for HTX Development

Quick reference for using Emmet abbreviations in `.htx` files.

## What is Emmet?

Emmet is a productivity toolkit that lets you write HTML **super fast** using CSS-like abbreviations. It's built into Cursor/VSCode and now works in `.htx` files!

## Basic Syntax

### Elements and Classes

| Shortcut | Hit Tab → Result |
|----------|------------------|
| `div` | `<div></div>` |
| `div.panel` | `<div class="panel"></div>` |
| `div#app` | `<div id="app"></div>` |
| `div.panel.mb-3` | `<div class="panel mb-3"></div>` |
| `button.btn-primary` | `<button class="btn-primary"></button>` |
| `section.panel.mb-4` | `<section class="panel mb-4"></section>` |

### Nesting Operators

| Operator | Meaning | Example | Result |
|----------|---------|---------|--------|
| `>` | Child | `div>p` | `<div><p></p></div>` |
| `+` | Sibling | `h2+p` | `<h2></h2><p></p>` |
| `^` | Climb up | `div>p^h2` | `<div><p></p></div><h2></h2>` |
| `*` | Multiply | `li*3` | `<li></li><li></li><li></li>` |

### Attributes

| Shortcut | Result |
|----------|--------|
| `a[href="#"]` | `<a href="#"></a>` |
| `a[href="#" target="bunz"]` | `<a href="#" target="bunz"></a>` |
| `input[type="email" required]` | `<input type="email" required>` |
| `button[data-action="submit"]` | `<button data-action="submit"></button>` |

### Text Content

| Shortcut | Result |
|----------|--------|
| `h1{Welcome}` | `<h1>Welcome</h1>` |
| `p{Click here}` | `<p>Click here</p>` |
| `a{Home}[href="/"]` | `<a href="/">Home</a>` |

### Numbering

| Shortcut | Result |
|----------|--------|
| `ul>li.item$*3` | `<ul><li class="item1"></li><li class="item2"></li><li class="item3"></li></ul>` |
| `div.video-$*2` | `<div class="video-1"></div><div class="video-2"></div>` |

## BUNZ-Specific Examples

### Video Grid

**Type:**
```
section.panel>div.video-grid>div.video-container.local>video+div.video-label
```

**Get:**
```html
<section class="panel">
    <div class="video-grid">
        <div class="video-container local">
            <video></video>
            <div class="video-label"></div>
        </div>
    </div>
</section>
```

### Form with Validation

**Type:**
```
form>div.form-group>label[for="email"]+input#email[type="email" required data-i18n="auth.email"]
```

**Get:**
```html
<form action="">
    <div class="form-group">
        <label for="email"></label>
        <input type="email" id="email" required data-i18n="auth.email">
    </div>
</form>
```

### Button Group

**Type:**
```
div.flex.gap-md>(button.btn-primary{Start}+button.btn-secondary{Stop}+button.btn-danger{End})
```

**Get:**
```html
<div class="flex gap-md">
    <button class="btn-primary">Start</button>
    <button class="btn-secondary">Stop</button>
    <button class="btn-danger">End</button>
</div>
```

### Navigation Bar

**Type:**
```
nav.navbar>div.navbar-container>div.navbar-brand{BUNZ}+div.navbar-links>a[href="/" target="bunz"]{Home}+a[href="/dashboard" target="bunz"]{Dashboard}
```

**Get:**
```html
<nav class="navbar">
    <div class="navbar-container">
        <div class="navbar-brand">BUNZ</div>
        <div class="navbar-links">
            <a href="/" target="bunz">Home</a>
            <a href="/dashboard" target="bunz">Dashboard</a>
        </div>
    </div>
</nav>
```

### Modal Content

**Type:**
```
div.modal-content>div.modal-header>h2{Settings}^^div.modal-body>p{Configure your preferences}
```

**Get:**
```html
<div class="modal-content">
    <div class="modal-header">
        <h2>Settings</h2>
    </div>
    <div class="modal-body">
        <p>Configure your preferences</p>
    </div>
</div>
```

### Telemetry Dashboard

**Type:**
```
div.metrics-grid>(section.panel.metric-card>h3{System}+div.metric-row*3)*3
```

**Get:**
```html
<div class="metrics-grid">
    <section class="panel metric-card">
        <h3>System</h3>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
    </section>
    <section class="panel metric-card">
        <h3>System</h3>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
    </section>
    <section class="panel metric-card">
        <h3>System</h3>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
        <div class="metric-row"></div>
    </section>
</div>
```

## Advanced Techniques

### Grouping with Parentheses

**Type:**
```
div.panel>(header>h2+p)+(main>section*2)+(footer>button)
```

**Get:**
```html
<div class="panel">
    <header>
        <h2></h2>
        <p></p>
    </header>
    <main>
        <section></section>
        <section></section>
    </main>
    <footer>
        <button></button>
    </footer>
</div>
```

### Item Numbering with Padding

**Type:**
```
ul>li.step-$$$*5
```

**Get:**
```html
<ul>
    <li class="step-001"></li>
    <li class="step-002"></li>
    <li class="step-003"></li>
    <li class="step-004"></li>
    <li class="step-005"></li>
</ul>
```

### Complex Nested Structure

**Type:**
```
div.room-page-container>div.room-header+div.room-content-wrapper>(div.room-content>section.video-section>div.video-grid)+(aside.presenter-panel>div.presenter-header+div.presenter-container)
```

**Get:**
```html
<div class="room-page-container">
    <div class="room-header"></div>
    <div class="room-content-wrapper">
        <div class="room-content">
            <section class="video-section">
                <div class="video-grid"></div>
            </section>
        </div>
        <aside class="presenter-panel">
            <div class="presenter-header"></div>
            <div class="presenter-container"></div>
        </aside>
    </div>
</div>
```

## CSS Emmet

Emmet also works in `<style>` blocks within HTX files!

| Shortcut | Expands To |
|----------|------------|
| `m10` | `margin: 10px;` |
| `p20` | `padding: 20px;` |
| `w100p` | `width: 100%;` |
| `h50vh` | `height: 50vh;` |
| `df` | `display: flex;` |
| `fdc` | `flex-direction: column;` |
| `jcc` | `justify-content: center;` |
| `aic` | `align-items: center;` |
| `bgc#000` | `background-color: #000;` |
| `c#fff` | `color: #fff;` |
| `br5` | `border-radius: 5px;` |

## Common BUNZ Patterns

### Room/Meeting Page Structure
```
div.room-page-container>div.room-header>div.flex.flex-between>div>h2+(div.flex.gap-md>button.btn-sm*3)
```

### Dashboard Cards
```
div.grid>(div.card>h3+p.text-muted+a.btn-primary)*3
```

### Form Layout
```
form>(div.form-group>label+input)*3+button.btn-primary{Submit}
```

### Control Bar
```
section.panel>div.flex.gap-sm>(button.btn-primary+button.btn-secondary.disabled+button.btn-danger.disabled)
```

## Pro Tips

1. **Type abbreviation, hit Tab** - Expands immediately
2. **Use in selection**: Select text, `Cmd+Shift+P` → "Emmet: Wrap with Abbreviation"
3. **Multiple cursors**: Works with multi-cursor editing
4. **Incremental expansion**: Keep hitting Tab to jump between placeholders
5. **Lorem text**: `lorem` generates Lorem Ipsum, `lorem5` generates 5 words

## Keyboard Shortcuts

- **Expand Abbreviation**: `Tab`
- **Wrap with Abbreviation**: `Cmd+Shift+A` (or Cmd+Shift+P → search "Emmet: Wrap")
- **Remove Tag**: `Cmd+Shift+K`
- **Update Tag**: Position cursor on tag, type new tag name
- **Balance Outward**: `Ctrl+D` (select parent tag)

## Try It Now!

Open any `.htx` file and try these:
1. Type `div.panel.mb-3>h2{My Title}+p.text-muted{Subtitle}`
2. Hit **Tab**
3. 🎉 Instant HTML!

This is how you can write HTX components **10x faster**! ⚡

---

**Reference**: [Emmet Documentation](https://docs.emmet.io/)

