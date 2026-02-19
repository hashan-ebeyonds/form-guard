# FormGuard.js

**Advanced JavaScript Form Validation Library with i18n Support**

Version 2.1.0 · MIT License · No dependencies

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [File Structure](#file-structure)
4. [Installation](#installation)
5. [Basic Usage](#basic-usage)
6. [Schema Rules](#schema-rules)
7. [Bind Options](#bind-options)
8. [Locale / i18n](#locale--i18n)
9. [Custom Rules](#custom-rules)
10. [Headless Validation](#headless-validation)
11. [Instance Methods](#instance-methods)
12. [Static API](#static-api)
13. [Error Message Customization](#error-message-customization)
14. [CSS Reference](#css-reference)
15. [Recommended HTML Structure](#recommended-html-structure)
16. [Common Mistakes](#common-mistakes)
17. [Changelog](#changelog)

---

## Overview

FormGuard is a lightweight, framework-agnostic form validation library that works with plain HTML forms. It supports:

- **25+ built-in validation rules** — email, URL, phone, credit card, password strength, and more
- **Full i18n** — English built-in, additional languages loaded as separate files
- **DOM binding** — attach to any `<form>` and errors appear automatically
- **Headless validation** — validate plain objects without any DOM
- **Async rules** — return a `Promise` for API-backed checks
- **UMD module** — works in browsers (script tag), Node.js (require), and AMD

---

## Getting Started

```html
<!-- 1. Load the core (English only) -->
<script src="FormGuard.js"></script>

<!-- 2. Optionally load extra languages -->
<script src="locales/fr.js"></script>

<!-- 3. Bind to your form -->
<script>
  const guard = FormGuard.create({ locale: 'fr' });

  guard.bind('#my-form', {
    email:    { required: true, email: true },
    password: { required: true, minLength: 8 },
  }, {
    validateOn: 'blur',
    onSuccess: (data) => console.log('Valid!', data),
    onError:   (errors) => console.log('Errors:', errors),
  });
</script>
```

---

## File Structure

```
your-project/
├── index.html
├── FormGuard.js          ← core library (English only)
└── locales/
    ├── es.js             ← Spanish
    ├── fr.js             ← French
    ├── de.js             ← German
    ├── ar.js             ← Arabic (RTL)
    ├── zh.js             ← Chinese Simplified
    ├── pt.js             ← Portuguese
    ├── ja.js             ← Japanese
    └── it.js             ← Italian
```

> **Important:** The filename is case-sensitive. Use `FormGuard.js` exactly — not `form-guard.js`, `formguard.js`, or `form-gurd.js`.

---

## Installation

### Script Tag (Browser)

```html
<script src="FormGuard.js"></script>
```

### CommonJS (Node.js)

```js
const FormGuard = require('./FormGuard');
require('./locales/fr');  // self-registers
```

### Loading Locale Files

**Static** — include the `<script>` tag before your code:

```html
<script src="FormGuard.js"></script>
<script src="locales/de.js"></script>  <!-- loads German -->
<script src="locales/ar.js"></script>  <!-- loads Arabic -->

<script>
  const guard = FormGuard.create({ locale: 'de' });
</script>
```

**Dynamic** — load a locale at runtime without a page reload:

```js
async function switchLocale(lang) {
  // Already registered? Just switch.
  if (guard.hasLocale(lang)) {
    guard.setLocale(lang);
    return;
  }

  // Inject the locale script on demand
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src    = `locales/${lang}.js`;
    script.onload  = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  guard.setLocale(lang);
}

// Example: switch to Japanese
await switchLocale('ja');
```

---

## Basic Usage

### 1. Prepare your HTML

```html
<form id="my-form" novalidate autocomplete="off">
  <div class="form-group">
    <label for="email">Email *</label>
    <input type="email" id="email" name="email" />
  </div>

  <div class="form-group">
    <label for="password">Password *</label>
    <input type="password" id="password" name="password" />
  </div>

  <button type="submit">Submit</button>
</form>
```

> **`novalidate`** is required. It disables the browser's built-in validation bubbles so FormGuard can fully control error display.

### 2. Bind FormGuard

```js
const guard = FormGuard.create();

guard.bind('#my-form', {
  email:    { required: true, email: true },
  password: { required: true, minLength: 8, strongPassword: true },
}, {
  validateOn: 'blur',
});
```

### 3. Add CSS

```css
input.fg-error  { border-color: red; }
input.fg-valid  { border-color: green; }

.fg-error-message { margin-top: 4px; }
.fg-error-item    { font-size: 0.8rem; color: red; display: flex; gap: 4px; }
.fg-error-item::before { content: '✕'; }
```

---

## Schema Rules

The schema is a plain object where each key is a form field `name` and the value is a set of rules.

```js
const schema = {
  fieldName: {
    ruleName: ruleParam,
    // ...
  }
};
```

### All Built-in Rules

| Rule | Parameter | Description |
|------|-----------|-------------|
| `required` | `true` | Field must not be empty |
| `minLength` | `number` | Minimum string length |
| `maxLength` | `number` | Maximum string length |
| `min` | `number` | Minimum numeric value |
| `max` | `number` | Maximum numeric value |
| `email` | `true` | Valid email format |
| `url` | `true` | Valid URL (must include protocol) |
| `pattern` | `RegExp` or `string` | Custom regular expression |
| `numeric` | `true` | Must be a number |
| `integer` | `true` | Must be a whole number |
| `alpha` | `true` | Letters only (unicode-aware) |
| `alphanumeric` | `true` | Letters and numbers only |
| `phone` | `true` | Valid phone number format |
| `date` | `true` | Valid date string |
| `dateMin` | `date string` | Date must be on or after |
| `dateMax` | `date string` | Date must be on or before |
| `equalTo` | `field name` | Must equal another field's value |
| `notEqualTo` | `field name` | Must differ from another field's value |
| `in` | `array` or `string` | Value must be in the list |
| `notIn` | `array` or `string` | Value must not be in the list |
| `fileSize` | `bytes` | Max file size for file inputs |
| `fileType` | `array` or `string` | Allowed file extensions or MIME types |
| `creditCard` | `true` | Valid credit card number (Luhn algorithm) |
| `strongPassword` | `true` | Requires uppercase, lowercase, number, and special character |
| `hexColor` | `true` | Valid `#RGB` or `#RRGGBB` hex color |
| `ipv4` | `true` | Valid IPv4 address |
| `ipv6` | `true` | Valid IPv6 address |
| `json` | `true` | Valid JSON string |

### Examples

```js
const schema = {
  // Text rules
  username: { required: true, minLength: 3, maxLength: 20, alphanumeric: true },
  email:    { required: true, email: true },
  website:  { url: true },
  bio:      { maxLength: 500 },

  // Number rules
  age:   { required: true, integer: true, min: 18, max: 120 },
  price: { numeric: true, min: 0 },

  // Password
  password:        { required: true, strongPassword: true },
  confirmPassword: { required: true, equalTo: 'password' },

  // Date
  birthDate: { date: true, dateMin: '1900-01-01', dateMax: '2006-01-01' },

  // Select / radio — must pick one of these values
  role: { required: true, in: ['admin', 'editor', 'viewer'] },

  // File upload
  avatar: { fileSize: 2097152, fileType: ['jpg', 'png', 'gif'] }, // 2MB max

  // Custom regex
  zipCode: { pattern: /^\d{5}(-\d{4})?$/ },

  // Advanced
  cardNumber: { creditCard: true },
  color:      { hexColor: true },
  serverIp:   { ipv4: true },
  config:     { json: true },
};
```

---

## Bind Options

The third argument to `guard.bind()` configures how the form behaves.

```js
guard.bind('#my-form', schema, {
  validateOn:               'blur',    // when to validate
  debounce:                 300,       // ms delay for 'input' mode
  showErrors:               true,      // auto-render error messages in DOM
  errorClass:               'fg-error',
  validClass:               'fg-valid',
  errorContainerClass:      'fg-error-message',
  scrollToError:            true,      // scroll to first error on submit
  revalidateOnLocaleChange: false,     // re-run validation when locale switches

  onSuccess:      (data, result) => {},
  onError:        (errors, result) => {},
  onFieldValid:   (fieldName) => {},
  onFieldInvalid: (fieldName, errors) => {},
});
```

### `validateOn` Options

| Value | Behaviour |
|-------|-----------|
| `'submit'` | Validate only when the form is submitted *(default)* |
| `'blur'` | Validate each field when the user leaves it *(recommended)* |
| `'input'` | Validate while the user types (debounced) |
| `'change'` | Validate when the field value changes |

> **Note:** `'blur'` internally uses the `focusout` DOM event (which bubbles), while `'input'` applies the debounce delay. You always write `validateOn: 'blur'` — FormGuard handles the browser difference automatically.

---

## Locale / i18n

### Built-in Languages

| Key | Language |
|-----|----------|
| `en` | English *(built-in, always available)* |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `ar` | Arabic *(RTL)* |
| `zh` | Chinese Simplified |
| `pt` | Portuguese |
| `ja` | Japanese |
| `it` | Italian |

### Setting the Locale

```js
// At creation time
const guard = FormGuard.create({ locale: 'fr' });

// At runtime
guard.setLocale('de');

// Check what's available
guard.getLocales();    // ['en', 'fr', 'de', ...]
guard.hasLocale('ja'); // true / false
```

### Writing a Custom Locale File

```js
// locales/ko.js — Korean example
(function (global) {
  var FG = typeof module !== 'undefined'
    ? require('../FormGuard')
    : global.FormGuard;

  FG.registerLocale('ko', {
    required:  '이 필드는 필수입니다.',
    email:     '유효한 이메일 주소를 입력하세요.',
    minLength: '{min}자 이상 입력해주세요.',
    // Any keys not provided fall back to English automatically
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
```

Then load it:

```html
<script src="FormGuard.js"></script>
<script src="locales/ko.js"></script>
```

### Arabic (RTL)

When using the `ar` locale, set the document direction:

```js
guard.setLocale('ar');
document.documentElement.dir = 'rtl';
```

---

## Custom Rules

### Synchronous Rule

```js
guard.addRule(
  'noSpaces',
  (value) => !value.includes(' '),
  'No spaces allowed.'
);

// Use in schema
const schema = {
  tag: { required: true, noSpaces: true }
};
```

### Async Rule (e.g. API check)

```js
guard.addRule(
  'uniqueEmail',
  async (value) => {
    const res  = await fetch(`/api/check-email?email=${value}`);
    const json = await res.json();
    return json.available;
  },
  'This email is already registered.'
);
```

### Multilingual Custom Rule Messages

```js
guard.addRule(
  'uniqueUsername',
  async (value) => { /* ... */ },
  {
    en: 'Username is already taken.',
    es: 'El nombre de usuario ya está en uso.',
    fr: "Ce nom d'utilisateur est déjà pris.",
    de: 'Dieser Benutzername ist bereits vergeben.',
  }
);
```

### Rule Function Signature

```js
function myRule(value, param, allValues) {
  // value     — the current field value
  // param     — the rule parameter from the schema (e.g. true, a number, a string)
  // allValues — all form values (useful for cross-field rules)
  return true; // valid
  return false; // invalid
  return Promise.resolve(false); // async invalid
}
```

---

## Headless Validation

Validate plain data objects without any DOM — useful for Node.js, React, Vue, or testing.

### Synchronous

```js
const guard = FormGuard.create();

const result = guard.validate({
  email: { required: true, email: true },
  age:   { required: true, integer: true, min: 18 },
}, {
  email: 'not-an-email',
  age:   15,
});

console.log(result.valid);
// false

console.log(result.errors);
// {
//   email: [{ rule: 'email', message: 'Please enter a valid email address.' }],
//   age:   [{ rule: 'min',   message: 'Must be at least 18.' }]
// }
```

### Async

```js
const result = await guard.validateAsync(schema, data);
```

### Accessing Error Messages

```js
if (!result.valid) {
  Object.entries(result.errors).forEach(([field, errors]) => {
    console.log(`${field}: ${errors[0].message}`);
  });
}
```

---

## Instance Methods

These are methods on the object returned by `guard.bind()`.

```js
const formInst = guard.bind('#my-form', schema, options);
```

| Method | Description |
|--------|-------------|
| `formInst.validate()` | Programmatically run full validation. Returns `Promise<result>`. |
| `formInst.reset()` | Clear all validation state and reset the native form. |
| `formInst.destroy()` | Remove all event listeners (call before re-binding). |

```js
// Trigger validation without a submit click
const result = await formInst.validate();
if (result.valid) { /* ... */ }

// Clear all errors and form values
formInst.reset();

// Clean up when done
formInst.destroy();
```

---

## Static API

Methods on the `FormGuard` class itself.

| Method | Description |
|--------|-------------|
| `FormGuard.create(options)` | Shorthand for `new FormGuard(options)` |
| `FormGuard.registerLocale(lang, messages, extend?)` | Register a locale globally. Called automatically by locale files. If `extend` is `true` (default), missing keys fall back to English. |
| `FormGuard.localeRegistry` | Raw reference to the shared locale map |
| `FormGuard.validators` | Built-in validator functions — add to this to extend globally |
| `FormGuard.utils` | Utility helpers (`isEmpty`, `debounce`, `formatBytes`, etc.) |

### Instance Methods (on the guard object)

| Method | Returns | Description |
|--------|---------|-------------|
| `guard.setLocale(lang)` | `this` | Switch active locale. Throws if not registered. |
| `guard.hasLocale(lang)` | `boolean` | Check if a locale is available |
| `guard.getLocales()` | `string[]` | All registered locale keys |
| `guard.addRule(name, fn, msg)` | `this` | Register a custom rule |
| `guard.validate(schema, data)` | `Result` | Synchronous headless validation |
| `guard.validateAsync(schema, data)` | `Promise<Result>` | Async headless validation |
| `guard.bind(form, schema, opts)` | `FormInstance` | Bind to a DOM form |
| `guard.unbind(form)` | `void` | Remove all listeners from a bound form |

---

## Error Message Customization

### Inline Override (per field)

Add a `{ruleName}Message` key next to any rule in the schema:

```js
const schema = {
  email: {
    required:        true,
    requiredMessage: 'We need your email to create your account.',
    email:           true,
    emailMessage:    "That doesn't look like a valid email address.",
  },
  password: {
    required:   true,
    minLength:  8,
    minLengthMessage: 'Password must be at least 8 characters for security.',
  },
};
```

### Instance-level Override

Override messages for specific rules across the whole instance:

```js
const guard = FormGuard.create({
  messages: {
    required: 'You must fill in this field.',
    email:    'Check your email — something looks off.',
  }
});
```

### Global Locale Override

```js
FormGuard.registerLocale('en', {
  required: 'This cannot be empty.',
  // Other keys fall back to the default English values
});
```

---

## CSS Reference

FormGuard adds and removes these classes automatically:

| Class | Applied to | When |
|-------|------------|------|
| `fg-error` | `input`, `select`, `textarea` | Field fails validation |
| `fg-valid` | `input`, `select`, `textarea` | Field passes validation |
| `fg-error-message` | Injected `<div>` | Error container after the field |
| `fg-error-item` | Injected `<span>` | Each individual error message |

### Injected HTML Structure

When a field fails, FormGuard inserts this immediately after the `<input>`:

```html
<div class="fg-error-message" data-fg-errors="fieldName" role="alert">
  <span class="fg-error-item">Must be at least 3 characters.</span>
</div>
```

- `role="alert"` ensures screen readers announce the error immediately
- `data-fg-errors` is used internally to find and clean up messages

### Recommended CSS

```css
/* Field state */
input.fg-error,
select.fg-error,
textarea.fg-error {
  border-color: #e53e3e;
  box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15);
}

input.fg-valid,
select.fg-valid,
textarea.fg-valid {
  border-color: #38a169;
}

/* Error messages */
.fg-error-message {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}

.fg-error-item {
  font-size: 0.8rem;
  color: #e53e3e;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.fg-error-item::before {
  content: '✕';
  font-size: 0.7rem;
  margin-top: 1px;
  flex-shrink: 0;
}
```

---

## Recommended HTML Structure

### Single Field

```html
<div class="form-group">
  <label for="email">Email <span aria-hidden="true">*</span></label>
  <input type="email" id="email" name="email" />
  <!-- FormGuard injects the error div here automatically -->
</div>
```

### Field with Hint Text

```html
<div class="form-group">
  <label for="username">Username <span aria-hidden="true">*</span></label>
  <input
    type="text"
    id="username"
    name="username"
    placeholder="3–20 characters"
    aria-describedby="username-hint"
  />
  <!-- Error div is injected here, between input and hint -->
  <span id="username-hint" class="field-hint">Letters and numbers only</span>
</div>
```

### Two Columns

```html
<div class="form-row">
  <div class="form-group">
    <label for="firstName">First Name <span aria-hidden="true">*</span></label>
    <input type="text" id="firstName" name="firstName" />
  </div>
  <div class="form-group">
    <label for="lastName">Last Name <span aria-hidden="true">*</span></label>
    <input type="text" id="lastName" name="lastName" />
  </div>
</div>
```

### Full Form Example

```html
<form id="my-form" novalidate autocomplete="off">

  <div class="form-row">
    <div class="form-group">
      <label for="firstName">First Name <span aria-hidden="true">*</span></label>
      <input type="text" id="firstName" name="firstName" />
    </div>
    <div class="form-group">
      <label for="lastName">Last Name <span aria-hidden="true">*</span></label>
      <input type="text" id="lastName" name="lastName" />
    </div>
  </div>

  <div class="form-group">
    <label for="email">Email <span aria-hidden="true">*</span></label>
    <input type="email" id="email" name="email" />
  </div>

  <div class="form-group">
    <label for="role">Role <span aria-hidden="true">*</span></label>
    <select id="role" name="role">
      <option value="">— select —</option>
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
    </select>
  </div>

  <div class="form-group">
    <label for="bio">Bio</label>
    <textarea id="bio" name="bio" rows="4"></textarea>
  </div>

  <div class="form-group form-group--check">
    <input type="checkbox" id="agree" name="agree" />
    <label for="agree">I agree to the terms <span aria-hidden="true">*</span></label>
  </div>

  <div class="form-actions">
    <button type="submit">Submit</button>
    <button type="reset">Cancel</button>
  </div>

</form>
```

### Layout CSS

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group--check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

label       { font-size: 0.875rem; font-weight: 600; }
.field-hint { font-size: 0.75rem; color: #888; }

input, select, textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}
```

---

## Common Mistakes

### ❌ Script filename typo

```html
<!-- Wrong -->
<script src="./form-gurd.js"></script>
<script src="./formguard.js"></script>
<script src="./form-guard.js"></script>

<!-- Correct -->
<script src="./FormGuard.js"></script>
```

### ❌ `validateOn` inside the schema

```js
// Wrong — validateOn is not a rule, it goes in bind options
guard.bind('#form', {
  username: { required: true, validateOn: 'blur' }  // ✗
});

// Correct
guard.bind('#form', {
  username: { required: true }
}, {
  validateOn: 'blur'  // ✓ third argument
});
```

### ❌ Missing `novalidate` on the form

```html
<!-- Wrong — browser shows its own validation popups -->
<form id="my-form">

<!-- Correct -->
<form id="my-form" novalidate>
```

### ❌ Missing `name` attribute on inputs

```html
<!-- Wrong — FormGuard can't match this to the schema -->
<input type="text" id="username" />

<!-- Correct -->
<input type="text" id="username" name="username" />
```

### ❌ Setting locale before loading the locale file

```html
<!-- Wrong — 'fr' not registered yet -->
<script>
  const guard = FormGuard.create({ locale: 'fr' });  // throws
</script>
<script src="locales/fr.js"></script>

<!-- Correct — load locale file first -->
<script src="FormGuard.js"></script>
<script src="locales/fr.js"></script>
<script>
  const guard = FormGuard.create({ locale: 'fr' });  // works
</script>
```

### ❌ Field in schema but not in HTML

```js
// If 'email' is in the schema but the form has no input named "email",
// FormGuard silently skips it. Make sure name attributes match exactly.
guard.bind('#form', {
  email: { required: true }   // needs <input name="email"> in the form
});
```

---

## Changelog

### v2.1.0
- **Fixed:** `validateOn: 'blur'` now works correctly
  - Root cause 1: `blur` does not bubble in the DOM — FormGuard now internally attaches `focusout` (the bubbling equivalent) when `validateOn: 'blur'` is set
  - Root cause 2: `debounce` was being applied to `blur`/`focusout`, causing the handler to be delayed or silently dropped when focus moved quickly. Blur now fires immediately with no debounce. Debounce is still applied to `'input'` mode.

### v2.0.0
- Locale system redesigned — English only in core, all other languages as separate loadable files
- Added `FormGuard.registerLocale()` static method
- Added `hasLocale()`, `getLocales()` instance methods
- Added `revalidateOnLocaleChange` bind option
- Added `ipv6` validator

### v1.0.0
- Initial release
- 25 built-in validators
- DOM binding with `bind()` / `unbind()`
- Headless validation with `validate()` / `validateAsync()`
- Custom rule support via `addRule()`
- Built-in locales: `en`, `es`, `fr`, `de`, `ar`, `zh`

---

*FormGuard.js · MIT License*
