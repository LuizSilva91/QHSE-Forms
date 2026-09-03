import { forms, getForm } from "./forms/registry.js";
import { $, $$, today, ukDate, ukDateTime, validUKDate, uid } from "./core/utils.js";
import { exportBackup, exportCsv, importBackup } from "./core/data-transfer.js";
import { openDB, configureStorage, all, put, del } from "./core/storage.js";

let db;
let dbReady;
let currentType;
let currentId;
let shareRecord;
let filter = "all";
let dialogConfirmAction = null;
let recordsCategory = null;

function show(which) {
  ["home", "editorView", "recordsView"].forEach(
    (x) => ($("#" + x).hidden = x !== which),
  );
  if (which === "home") { recordsCategory = null; $("#pageTitle").textContent = "Digital inspections"; }
  $("#backBtn").hidden = which === "home";
  $("#recordsBtn").hidden = which !== "home";
  $$(".bottom-nav button").forEach((b) =>
    b.classList.toggle(
      "active",
      (which === "recordsView" ? "records" : "home") === b.dataset.nav,
    ),
  );
  scrollTo(0, 0);
}
function field(label, name, val = "", full = false, type = "text") {
  const isDate = name === "date";
  return `<div class="field ${full ? "full" : ""}"><label class="${label.includes("*") ? "required" : ""}">${label.replace(" *", "")}</label><input name="${name}" type="${isDate ? "text" : type}" value="${val || ""}" ${isDate ? 'inputmode="numeric" placeholder="DD/MM/YYYY" maxlength="10" pattern="\\d{2}/\\d{2}/\\d{4}"' : ""} ${label.includes("*") ? "required" : ""}></div>`;
}
function currentForm() {
  const definition = getForm(currentType);
  if (!definition) throw new Error(`Unknown form type: ${currentType}`);
  return definition;
}
function start(type, data = {}) {
  const definition = getForm(type);
  if (!definition) return;
  currentType = type; currentId = data.id || uid();
  $("#pageTitle").textContent = definition.title;
  $("#formState").textContent = "Inspection";
  const optionalNotes = type === "rack" ? field("General comments", "notes", data.notes, true) : "";
  $("#editor").innerHTML = `<section class="section inspection-card"><div class="section-title"><span class="section-icon">✓</span><div><h2>Inspection details</h2><p class="section-note"><strong>EMG - Nestle</strong></p></div></div><div class="fields">${field("Inspection date *", "date", data.date || today(), false, "date")}${field("Name *", "inspector", data.inspector)}${optionalNotes}</div></section><section class="section"><div class="section-title"><span class="section-icon">${definition.icon}</span><div><h2>${definition.contentTitle}</h2><p class="section-note">${definition.contentIntro}</p></div></div><div id="formContent"></div></section><div class="form-actions single"><button>Save inspection</button></div>`;
  const dateInput=$("#editor").querySelector("[name=date]");
  dateInput.addEventListener("input",(event)=>{const numbers=event.target.value.replace(/\D/g,"").slice(0,8);event.target.value=numbers.length>4?`${numbers.slice(0,2)}/${numbers.slice(2,4)}/${numbers.slice(4)}`:numbers.length>2?`${numbers.slice(0,2)}/${numbers.slice(2)}`:numbers;event.target.setCustomValidity(event.target.value&&!validUKDate(event.target.value)?"Enter a valid date as DD/MM/YYYY":"");});
  $("#editor").onsubmit=(event)=>{event.preventDefault();const date=event.target.querySelector("[name=date]");date.setCustomValidity(validUKDate(date.value)?"":"Enter a valid date as DD/MM/YYYY");definition.validate($("#formContent"));if(event.target.reportValidity())save();};
  definition.render($("#formContent"),data,countRows);show("editorView");countRows();
}
function countRows() {
  if (!currentType) return;
  $("#rowCount").textContent = currentForm().countLabel($("#formContent"));
}
function collect(status) {
  const formData = new FormData($("#editor"));
  const base = {id:currentId,type:currentType,title:currentForm().title,status,date:formData.get("date"),inspector:formData.get("inspector"),site:"EMG - Nestle",notes:formData.get("notes"),submittedAt:status==="Submitted"?ukDateTime(new Date()):null,updated:new Date().toISOString()};
  return Object.assign(base, currentForm().collect($("#formContent")));
}
async function save() {
  const status = "Submitted";
  let r = collect(status);
  r.submittedAt = ukDateTime(new Date());
  await put(r);
  $("#formState").textContent = "Saved";
  await showSuccess(r.submittedAt);
  await records();
}
function showSuccess(time) {
  return new Promise((resolve) => {
    const o = $("#successOverlay");
    $("#successTime").textContent = `Submitted ${time}`;
    o.hidden = false;
    requestAnimationFrame(() => o.classList.add("show"));
    setTimeout(() => {
      o.classList.remove("show");
      setTimeout(() => {
        o.hidden = true;
        resolve();
      }, 240);
    }, 3200);
  });
}
async function records(category = recordsCategory) {
  const submitted = (await all())
    .filter((record) => record.status === "Submitted")
    .sort((left, right) =>
      (right.updated || "").localeCompare(left.updated || ""),
    );

  $("#recordCount").textContent = submitted.length;
  const list = $("#recordList");
  list.innerHTML = "";

  if (!category) {
    recordsCategory = null;
    $("#pageTitle").textContent = "Records";

    const categoryGrid = document.createElement("div");
    categoryGrid.className = "record-category-grid";

    forms.forEach((definition) => {
      const count = submitted.filter(
        (record) => record.type === definition.id,
      ).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "record-category";
      button.innerHTML = `
        <span class="record-category-icon">${definition.icon}</span>
        <span class="record-category-copy">
          <b>${definition.title}</b>
          <small>${count} ${count === 1 ? "submitted form" : "submitted forms"}</small>
        </span>
        <strong aria-label="${count} submitted">${count}</strong>
        <span class="record-category-chevron" aria-hidden="true">&rsaquo;</span>`;
      button.addEventListener("click", () => records(definition.id));
      categoryGrid.append(button);
    });

    list.append(categoryGrid);
    show("recordsView");
    return;
  }

  const definition = getForm(category);
  if (!definition) {
    recordsCategory = null;
    await records(null);
    return;
  }

  recordsCategory = category;
  $("#pageTitle").textContent = `${definition.title} records`;

  const categoryHeader = document.createElement("div");
  categoryHeader.className = "record-category-header";
  categoryHeader.innerHTML = `
    <button type="button" class="category-back">&lsaquo; All categories</button>
    <span>${submitted.filter((record) => record.type === category).length} submitted</span>`;
  categoryHeader.querySelector(".category-back").addEventListener("click", () => {
    recordsCategory = null;
    records();
  });
  list.append(categoryHeader);

  const categoryRecords = submitted.filter(
    (record) => record.type === category,
  );

  if (!categoryRecords.length) {
    const empty = document.createElement("div");
    empty.className = "records-empty";
    empty.innerHTML = `<b>No ${definition.title.toLowerCase()} records</b><small>Submitted forms in this category will appear here.</small>`;
    list.append(empty);
  }

  categoryRecords.forEach((record) => {
    const item = document.createElement("article");
    item.className = "record";
    item.innerHTML = `<div class="record-top"><div><h3>${record.title}</h3><p>${ukDate(record.date)} &middot; ${record.inspector || "No inspector"}</p><p>${record.submittedAt ? `Submitted ${record.submittedAt} &middot; ` : ""}EMG - Nestle &middot; ${definition.recordDescription(record) || ""}</p></div><span class="status ${record.status}">${record.status}</span></div><div class="record-actions"><button class="open">Open</button><button class="share">Send / share</button><button class="delete">&times;</button></div>`;

    item.querySelector(".open").onclick = () => start(record.type, record);
    item.querySelector(".share").onclick = () => openShare(record);
    item.querySelector(".delete").onclick = () => {
      showAppDialog(
        "Delete this record?",
        `${record.title} from ${ukDate(record.date)} will be permanently removed from this device.`,
        {
          variant: "danger",
          icon: "⚠",
          confirmText: "Delete record",
          cancelText: "Keep record",
          onConfirm: async () => {
            await del(record.id);
            toast("Record deleted from this device");
            await records(recordsCategory);
          },
        },
      );
    };
    list.append(item);
  });

  show("recordsView");
}
function summary(r) {
  const definition=getForm(r.type);
  const lines=[`QHSE inspection: ${r.title}`,`Reference: ${r.id}`,`Status: ${r.status}`,`Inspection date: ${ukDate(r.date)}`,`Submitted: ${r.submittedAt || "Not recorded"}`,`Inspector: ${r.inspector || ""}`,"Site: EMG - Nestle",definition?.recordDescription(r) || ""];
  if(r.notes)lines.push(`Notes: ${r.notes}`);
  lines.push("",...(definition?.summaryLines(r)||[]));
  return lines.join("\n");
}
function recordFile(r) {
  return new File([JSON.stringify(r, null, 2)], `${r.id}.json`, {
    type: "application/json",
  });
}
function openShare(r) {
  shareRecord = r;
  $("#sheetTitle").textContent = `Send ${r.title}`;
  $("#sheetText").textContent =
    "Use the phone or tablet share menu to select Outlook or another email application. A summary-only email is also available.";
  $("#sheet").hidden = false;
}
async function nativeShare() {
  const r = shareRecord,
    f = recordFile(r);
  try {
    if (navigator.canShare?.({ files: [f] })) {
      await navigator.share({
        title: `${r.title} - ${ukDate(r.date)}`,
        text: `EMG - Nestle\n${r.title}\n${r.date || ""}`,
        files: [f],
      });
    } else if (navigator.share) {
      await navigator.share({
        title: `${r.title} - ${ukDate(r.date)}`,
        text: summary(r),
      });
    } else {
      toast(
        "Native sharing is not supported here. Open the app on Android or iPhone through GitHub Pages.",
      );
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      console.error(e);
      toast("The device could not open the share menu.");
    }
  } finally {
    $("#sheet").hidden = true;
  }
}
function showAppDialog(title, message, options = {}) {
  const dialog = $("#appDialog");
  const confirmButton = $("#appDialogConfirm");
  const cancelButton = $("#appDialogCancel");
  const closeButton = $("#appDialogClose");
  const icon = $("#appDialogIcon");

  $("#appDialogTitle").textContent = title;
  $("#appDialogMessage").textContent = message;
  icon.textContent = options.icon || "!";
  dialog.dataset.variant = options.variant || "notice";
  dialogConfirmAction = options.onConfirm || null;

  const isConfirmation = typeof dialogConfirmAction === "function";
  confirmButton.hidden = !isConfirmation;
  cancelButton.hidden = !isConfirmation;
  closeButton.hidden = isConfirmation;

  if (isConfirmation) {
    confirmButton.textContent = options.confirmText || "Confirm";
    cancelButton.textContent = options.cancelText || "Cancel";
  } else {
    closeButton.textContent = options.closeText || "Got it";
  }

  dialog.hidden = false;
  document.body.classList.add("dialog-open");

  requestAnimationFrame(() => {
    dialog.classList.add("show");
    (isConfirmation ? cancelButton : closeButton).focus();
  });
}

function closeAppDialog() {
  const dialog = $("#appDialog");
  dialog.classList.remove("show");
  document.body.classList.remove("dialog-open");
  dialogConfirmAction = null;

  setTimeout(() => {
    dialog.hidden = true;
    dialog.removeAttribute("data-variant");
  }, 220);
}

async function confirmAppDialog() {
  const action = dialogConfirmAction;
  closeAppDialog();
  if (action) await action();
}

async function exportAll() {
  const result = await exportBackup();
  if (!result.exported) {
    showAppDialog("Nothing to back up", "Complete and save an inspection first.");
  }
}

async function exportCSV() {
  const result = await exportCsv(getForm);
  if (!result.exported) {
    showAppDialog(
      "Nothing to export",
      "Complete and save an inspection before exporting a CSV file.",
    );
  }
}

async function importJSON(file) {
  if (!file) return;
  try {
    const result = await importBackup(file);
    if (result.imported) {
      toast(`${result.count} record(s) imported`);
      await records();
    }
  } catch (error) {
    console.error("Import failed", error);
    showAppDialog(
      "Invalid backup file",
      "Select a valid QHSE JSON backup file.",
    );
  }
}

function toast(s) {
  let t = $("#toast");
  t.textContent = s;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 2200);
}
function pressEffect(node) {
  node.classList.remove("tap-animate");
  void node.offsetWidth;
  node.classList.add("tap-animate");
  setTimeout(() => node.classList.remove("tap-animate"), 430);
}
function bindUI() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      const target = e.target.closest(
        ".form-tile,.form-actions button,.add-btn,.record-actions button,.bottom-nav button,.summary button",
      );
      if (target) {
        const r = target.getBoundingClientRect();
        target.style.setProperty("--tap-x", `${e.clientX - r.left}px`);
        target.style.setProperty("--tap-y", `${e.clientY - r.top}px`);
        pressEffect(target);
      }
    },
    { passive: true },
  );
  $$("[data-start]").forEach((x) =>
    x.addEventListener("click", () => start(x.dataset.start)),
  );
  $("#recordsBtn").addEventListener("click", () => { recordsCategory = null; records(); });
  $("#backBtn").addEventListener("click", () => { if (!$("#recordsView").hidden && recordsCategory) { recordsCategory = null; records(); } else { show("home"); } });
  $$("[data-nav]").forEach((x) =>
    x.addEventListener("click", () =>
      x.dataset.nav === "records" ? (recordsCategory = null, records()) : show("home"),
    ),
  );
  $("#exportAll").addEventListener("click", exportAll);
  $("#appDialogClose").addEventListener("click", closeAppDialog);
  $("#appDialogCancel").addEventListener("click", closeAppDialog);
  $("#appDialogConfirm").addEventListener("click", confirmAppDialog);
  $("#appDialog").addEventListener("click", (event) => {
    if (event.target === $("#appDialog")) closeAppDialog();
  });
  $("#csvAll").addEventListener("click", exportCSV);
  $("#importFile").addEventListener("change", (e) =>
    importJSON(e.target.files[0]),
  );
  $("#nativeShare").addEventListener("click", nativeShare);
  $("#closeSheet").addEventListener("click", () => {
    $("#sheet").hidden = true;
  });
  $("#sheet").addEventListener("click", (e) => {
    if (e.target === $("#sheet")) $("#sheet").hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $("#sheet").hidden = true;
      if (!$("#appDialog").hidden) closeAppDialog();
    }
  });
}

export function initialiseApplication() {
  bindUI();
  dbReady = openDB()
    .then((database) => {
      db = database;
      configureStorage(database);
      return database;
    })
    .catch((err) => {
      console.error("Storage unavailable", err);
      toast("Device storage is unavailable in this mode. Use localhost or GitHub Pages.");
      throw err;
    });
}

