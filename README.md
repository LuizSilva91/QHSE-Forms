# GXO QHSE Forms

A dependency-free modular web application suitable for GitHub Pages.

## Project structure

```text
index.html
css/main.css
js/main.js
js/app-controller.js
js/core/storage.js
js/core/utils.js
js/core/data-transfer.js
js/forms/registry.js
js/forms/meter-readings.js
js/forms/racking-inspection.js
```

## Responsibilities

- `app-controller.js` handles navigation, shared screens, dialogs and user messages.
- `storage.js` is the single IndexedDB data-access module.
- `data-transfer.js` is the single implementation for JSON backup, JSON import and CSV file export.
- `registry.js` registers the available forms.
- Each form module owns only its fields, rendering, validation, record collection, display summary and CSV row mapping.

## Shared import and export

Forms do not create files and do not parse backup files. `data-transfer.js` performs those operations once for the entire application.

A form only implements `toCsvRows(record)` because different record structures need different mappings into the shared CSV columns. This is a data adapter, not a duplicated export function.

JSON backup and import require no form-specific code because the complete saved record is serialised and restored by the shared service.

## Adding another form

1. Create a file under `js/forms/`.
2. Implement the standard form interface used by the existing modules.
3. Add a `toCsvRows(record)` adapter if the form needs CSV output.
4. Register the form in `js/forms/registry.js`.
5. Add its tile to `index.html`.

Run through an HTTP server such as VS Code Live Server. All paths are relative for deployment under a GitHub Pages repository path.
