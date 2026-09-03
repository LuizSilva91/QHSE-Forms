const RESULT_OPTIONS = [
  ["OK", "Functioning properly"],
  ["X", "Failed"],
  ["BT", "Battery failed"],
  ["NC", "Not charging"],
  ["LED", "LED failed"],
  ["LC", "Lamp changed"],
  ["BL", "Ballast needs changing"],
  ["R", "Repaired"],
];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function options(values, selected, placeholder) {
  return `<option value="">${placeholder}</option>${values.map((value) =>
    `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(value)}</option>`,
  ).join("")}`;
}

function resultOptions(selected) {
  return `<option value="">Select result</option>${RESULT_OPTIONS.map(([code, label]) =>
    `<option value="${code}" ${selected === code ? "selected" : ""}>${code} - ${label}</option>`,
  ).join("")}`;
}

function renumber(container) {
  [...container.querySelectorAll(".emergency-light-card")].forEach((card, index) => {
    const number = index + 1;
    card.dataset.lightId = String(number);
    card.querySelector(".emergency-light-number").textContent = `Light ${number}`;
  });
}

function addLight(container, value = {}, onChange) {
  const card = document.createElement("article");
  card.className = "emergency-light-card";
  card.innerHTML = `
    <div class="emergency-light-head">
      <span class="emergency-light-number">Light</span>
      <button type="button" class="remove remove-emergency-light">Remove</button>
    </div>
    <div class="emergency-light-grid">
      <div class="control-group">
        <label>Location ID <span aria-hidden="true">*</span></label>
        <input class="light-location" required placeholder="e.g. Reception" value="${escapeHtml(value.locationId)}">
      </div>
      <div class="control-group">
        <label>Test switch or circuit number</label>
        <input class="light-circuit" placeholder="Optional" value="${escapeHtml(value.circuitNumber)}">
      </div>
      <div class="control-group">
        <label>Lamp type</label>
        <input class="light-lamp-type" placeholder="e.g. Bulkhead, 600 x 600, 6FT" value="${escapeHtml(value.lampType)}">
      </div>
      <div class="control-group">
        <label>Operating mode <span aria-hidden="true">*</span></label>
        <select class="light-mode" required>
          ${options(["Maintained", "Non-maintained"], value.operatingMode, "Select mode")}
        </select>
      </div>
      <div class="control-group full">
        <label>Test result <span aria-hidden="true">*</span></label>
        <select class="light-result" required>${resultOptions(value.result)}</select>
      </div>
      <div class="control-group full">
        <label>Comments or corrective action</label>
        <textarea class="light-comments" rows="3" placeholder="Add details, repairs or follow-up required">${escapeHtml(value.comments)}</textarea>
      </div>
    </div>`;

  card.querySelector(".remove-emergency-light").onclick = () => {
    card.remove();
    renumber(container);
    onChange();
  };

  card.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", onChange);
    field.addEventListener("change", onChange);
  });

  container.append(card);
  renumber(container);
  onChange();
}

function resultLabel(code) {
  const match = RESULT_OPTIONS.find(([value]) => value === code);
  return match ? `${match[0]} - ${match[1]}` : code || "No result";
}

export const emergencyLightingTestForm = {
  id: "emergency-lighting",
  title: "Emergency lighting test",
  icon: "&#128161;",
  contentTitle: "Emergency lights tested",
  contentIntro: "Record the test type and result for each emergency light.",

  render(container, data, onChange) {
    container.className = "emergency-lighting-form";
    container.innerHTML = `
      <div class="emergency-test-details">
        <div class="control-group">
          <label>Test type <span aria-hidden="true">*</span></label>
          <select class="emergency-test-type" required>
            ${options(["Monthly function test", "Annual duration test"], data.testType || "Monthly function test", "Select test type")}
          </select>
        </div>
      </div>
      <div class="emergency-key">
        <b>Result key</b>
        <small>OK Functioning | X Failed | BT Battery failed | NC Not charging | LED LED failed | LC Lamp changed | BL Ballast | R Repaired</small>
      </div>
      <div class="emergency-light-list"></div>
      <button type="button" class="add-btn add-emergency-light">+ Add another light</button>`;

    const list = container.querySelector(".emergency-light-list");
    const items = data.items?.length ? data.items : [{}];
    items.forEach((item) => addLight(list, item, onChange));
    container.querySelector(".add-emergency-light").onclick = () => addLight(list, {}, onChange);
    container.querySelectorAll(".emergency-test-details select").forEach((field) => {
      field.addEventListener("change", onChange);
    });
    onChange();
  },

  validate(container) {
    const cards = [...container.querySelectorAll(".emergency-light-card")];
    const testType = container.querySelector(".emergency-test-type");
    testType.setCustomValidity(cards.length ? "" : "Add at least one emergency light.");
  },

  collect(container) {
    const items = [...container.querySelectorAll(".emergency-light-card")].map((card, index) => ({
      idNumber: index + 1,
      circuitNumber: card.querySelector(".light-circuit").value.trim(),
      lampType: card.querySelector(".light-lamp-type").value.trim(),
      operatingMode: card.querySelector(".light-mode").value,
      locationId: card.querySelector(".light-location").value.trim(),
      result: card.querySelector(".light-result").value,
      comments: card.querySelector(".light-comments").value.trim(),
    }));

    return {
      testType: container.querySelector(".emergency-test-type").value,
      items,
    };
  },

  countLabel(container) {
    const count = container.querySelectorAll(".emergency-light-card").length;
    return `${count} ${count === 1 ? "light" : "lights"}`;
  },

  recordDescription(record) {
    const failed = (record.items || []).filter((item) => item.result !== "OK").length;
    return `${record.testType || "No test type"} | ${(record.items || []).length} lights | ${failed} requiring attention`;
  },

  summaryLines(record) {
    const lines = [
      `Test type: ${record.testType || ""}`,
    ];
    (record.items || []).forEach((item, index) => {
      lines.push(`${index + 1}. Light ${index + 1} | ${item.locationId || ""} | ${item.lampType || ""} | ${item.operatingMode || ""} | ${resultLabel(item.result)}${item.comments ? ` | ${item.comments}` : ""}`);
    });
    return lines;
  },

  toCsvRows(record) {
    return (record.items?.length ? record.items : [{}]).map((item, index) => [
      record.testType || "",
      item.locationId || "",
      index + 1,
      item.lampType || "",
      resultLabel(item.result),
      item.result === "OK" ? "Green" : "Red",
      [
        item.circuitNumber ? `Circuit: ${item.circuitNumber}` : "",
        item.operatingMode ? `Mode: ${item.operatingMode}` : "",
        item.comments || "",
      ].filter(Boolean).join(" | "),
    ]);
  },
};


