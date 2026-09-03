# GXO QHSE Digital Inspections

A mobile-first, modular web application for completing and managing QHSE inspections on phones, tablets, and desktop browsers.

The application is dependency-free, stores completed inspections in the browser using IndexedDB, and is designed for static deployment through GitHub Pages.

## Live application

[Open GXO QHSE Digital Inspections](https://luizsilva91.github.io/QHSE-Forms/)

## Available forms

### Meter readings

Records the following utility readings:

- Gas meter
- Water meter
- Electricity meter 1
- Electricity meter 2

### Racking inspection

Supports detailed warehouse-racking inspections with:

- Multiple inspection areas
- Multiple location references per area
- Multiple defects per location
- Component-specific defect options
- Red, Amber, and Green risk ratings
- Comments and corrective-action details

### Emergency lighting test

Supports monthly and annual emergency-lighting inspections with:

- Test month
- Monthly function test or annual duration test
- Automatically numbered lights
- Location ID
- Test switch or circuit number
- Lamp type
- Maintained or non-maintained operating mode
- Standard result codes
- Comments and corrective actions

Emergency-lighting result codes:

- `OK`: Functioning properly
- `X`: Failed
- `BT`: Battery failed
- `NC`: Not charging
- `LED`: LED failed
- `LC`: Lamp changed
- `BL`: Ballast needs changing
- `R`: Repaired

## Main features

- Mobile-first inspection forms
- Fixed header showing the current page or form
- Separate, self-contained form modules
- Browser-based IndexedDB storage
- Records grouped by form category
- Submitted-record counter for each category
- Open, edit, share, and delete saved records
- JSON backup and restore
- Shared CSV export
- Native device sharing where supported
- UK date formatting using `DD/MM/YYYY`
- GitHub Pages-compatible relative paths
- No build process or package installation required

## Project structure

```text
QHSE-Forms/
├── index.html
├── README.md
│
├── assets/
│   ├── favicon.svg
│   ├── favicon-192.png
│   ├── favicon-512.png
│   ├── apple-touch-icon.png
│
├── css/
│   └── main.css
│
└── js/
    ├── main.js
    ├── app-controller.js
    │
    ├── core/
    │   ├── storage.js
    │   ├── utils.js
    │   └── data-transfer.js
    │
    └── forms/
        ├── registry.js
        ├── meter-readings.js
        ├── racking-inspection.js
        └── emergency-lighting-test.js
```

## Architecture

### Application entry point

`js/main.js` starts the application after the DOM is ready.

### Application controller

`js/app-controller.js` contains shared interface behaviour, including:

- Screen navigation
- Header updates
- Form startup
- Shared inspection details
- Saving inspections
- Records category navigation
- Record opening and deletion
- Dialogs and notifications
- Native sharing
- Import and export controls

Form-specific field logic should not be added to the controller.

### Form registry

`js/forms/registry.js` is the central list of available forms.

```javascript
import { emergencyLightingTestForm } from "./emergency-lighting-test.js";
import { meterReadingsForm } from "./meter-readings.js";
import { rackingInspectionForm } from "./racking-inspection.js";

export const forms = [
  meterReadingsForm,
  rackingInspectionForm,
  emergencyLightingTestForm,
];

export const getForm = (id) => forms.find((form) => form.id === id);
```

The Records page uses this registry to create its form categories automatically.

### Form modules

Each form is implemented in its own file under `js/forms/`.

A form module owns:

- Form ID and title
- Form icon
- Form-specific rendering
- Validation
- Data collection
- Entry counter text
- Records description
- Sharing summary lines
- CSV row mapping

A typical form module follows this interface:

```javascript
export const exampleForm = {
  id: "example",
  title: "Example inspection",
  icon: "&#128203;",
  contentTitle: "Checks",
  contentIntro: "Complete the inspection checks.",

  render(container, data, onChange) {},
  validate(container) {},
  collect(container) {},
  countLabel(container) {},
  recordDescription(record) {},
  summaryLines(record) {},
  toCsvRows(record) {},
};
```

### Storage

`js/core/storage.js` provides the shared IndexedDB data-access layer.

All forms use the same `records` object store. A saved record contains a `type` value that identifies the form module responsible for opening and displaying it.

Records are stored on the current browser and device. They are not automatically synchronised to another browser or device.

### Shared import and export

`js/core/data-transfer.js` contains the reusable transfer services:

- `exportBackup()`
- `importBackup(file)`
- `exportCsv(getForm)`

Forms do not create downloads and do not parse backup files.

Each form only implements `toCsvRows(record)` because each form has a different internal data structure. The shared transfer module creates the actual CSV file, applies common columns, and starts the download.

### Shared utilities

`js/core/utils.js` contains reusable helpers for:

- DOM selection
- UK date formatting
- Date validation
- Unique inspection IDs
- File downloads
- CSV escaping

## Running locally

The application uses browser ES modules and must be served over HTTP. Do not open `index.html` directly using a `file://` address.

### VS Code Live Server

1. Open the repository folder in VS Code.
2. Install the **Live Server** extension if required.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

A local address similar to the following will open:

```text
http://127.0.0.1:5500/
```

## Adding another form

### 1. Create the form module

Create a new file under:

```text
js/forms/
```

For example:

```text
js/forms/fire-door-inspection.js
```

Implement the standard form interface shown above.

### 2. Register the form

Import the module into `js/forms/registry.js` and add it to the `forms` array.

```javascript
import { fireDoorInspectionForm } from "./fire-door-inspection.js";

export const forms = [
  meterReadingsForm,
  rackingInspectionForm,
  emergencyLightingTestForm,
  fireDoorInspectionForm,
];
```

### 3. Add the Home tile

Add a button to the `.form-grid` section in `index.html`.

The `data-start` value must match the form module's `id`.

```html
<button class="form-tile" data-start="fire-doors">
  <span class="tile-icon">&#128682;</span>
  <span>
    <b>Fire door inspection</b>
    <small>Door condition and safety checks</small>
  </span>
  <i>&rsaquo;</i>
</button>
```

### 4. Add form-specific styles

Add only the styles unique to the new form to `css/main.css`. Reuse existing shared classes wherever possible.

### 5. Test the complete workflow

Before publishing, verify that the new form can:

1. Open from the Home screen.
2. Validate required fields.
3. Save successfully.
4. Appear in Records as its own category.
5. Display the correct submitted counter.
6. Reopen an existing record.
7. Export through the shared CSV service.
8. Export and restore through JSON backup.
9. Share through the device share menu where supported.
10. Delete a record and refresh the category counter.

## Records workflow

The Records page is grouped by registered form category.

Each category displays:

- Form icon
- Form name
- Number of submitted records

Selecting a category displays only records belonging to that form. From the category list, users can open, share, or delete individual records.

Only records with a `Submitted` status are included in the category counters and lists.

## Backup and restore

### JSON backup

Use **Back up all** from the Records page to download all saved records as JSON.

The backup contains complete records and can restore all supported form types.

### JSON import

Use **Import JSON backup** and select a valid QHSE backup file. Existing records with the same ID are updated because IndexedDB stores records by their unique inspection ID.

### CSV export

Use **Export CSV** to produce a combined spreadsheet-friendly export. Every form maps its own fields through `toCsvRows(record)`, while the shared export service handles file generation.

## Publishing through GitHub Pages

The application uses relative paths and can run from a repository subdirectory.

GitHub Pages configuration:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the `main` branch.
5. Select the `/ (root)` folder.
6. Save the configuration.

After pushing changes, GitHub Pages redeploys the application automatically.

## Git workflow in VS Code

1. Open **Source Control** with `Ctrl+Shift+G`.
2. Review changed files.
3. Stage the intended changes.
4. Enter a clear commit message.
5. Select **Commit**.
6. Select **Sync Changes** or **Push**.

Example commit messages:

```text
Add emergency lighting inspection
Group records by form category
Update project documentation
```

## Browser data and limitations

- Records are stored in the browser, not in the GitHub repository.
- Clearing browser site data can remove saved inspections.
- Different browsers maintain separate records.
- Different devices maintain separate records.
- Regular JSON backups are recommended.
- Native sharing availability depends on the browser and device.
- The application does not currently use a service worker or web app manifest.
- The application is not currently designed for automatic offline installation.

## Development principles

When extending the application:

- Keep each form self-contained.
- Keep storage and file transfer shared.
- Register forms centrally.
- Avoid duplicating import and export implementations.
- Preserve existing saved-record compatibility.
- Use relative paths for GitHub Pages.
- Test on both mobile and desktop layouts.
- Prefer HTML entities or well-supported emoji where character encoding may vary.

## Repository

[LuizSilva91/QHSE-Forms](https://github.com/LuizSilva91/QHSE-Forms)
