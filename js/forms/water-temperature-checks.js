const OUTLET_TYPES = ["Hot / Cold", "TMV"];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function inputValue(value) {
  return value === null || value === undefined ? "" : escapeHtml(value);
}

function formatTemperature(value) {
  const number = toNumber(value);
  return number === null ? "Not tested" : `${number.toFixed(1)} C`;
}

function normaliseOutletType(value, outlet = {}) {
  if (value === "TMV") return "TMV";
  if (value === "Hot / Cold" || value === "Hot" || value === "Cold") {
    return "Hot / Cold";
  }
  if (toNumber(outlet.tmvTemperature ?? outlet.mixedTemperature) !== null) {
    return "TMV";
  }
  return "";
}

function typeOptions(selected = "") {
  return `<option value="">Select outlet type</option>${OUTLET_TYPES.map((type) =>
    `<option value="${type}" ${selected === type ? "selected" : ""}>${type}</option>`,
  ).join("")}`;
}

function remedialOptions(selected = "") {
  return `
    <option value="">Select</option>
    <option value="No" ${selected === "No" ? "selected" : ""}>No</option>
    <option value="Yes" ${selected === "Yes" ? "selected" : ""}>Yes</option>`;
}

function readCard(card) {
  return {
    outletNumber: Number(card.dataset.outletNumber || 0),
    outletLocation: card.querySelector(".water-location").value.trim(),
    outletType: card.querySelector(".water-outlet-type").value,
    hotTemperature: card.querySelector(".water-hot-temperature").value,
    coldTemperature: card.querySelector(".water-cold-temperature").value,
    tmvTemperature: card.querySelector(".water-tmv-temperature").value,
    remedialRequired: card.querySelector(".water-remedial").value,
    remedialAction: card.querySelector(".water-remedial-action").value.trim(),
  };
}

function assessLocation(location) {
  const type = normaliseOutletType(location.outletType, location);
  const hot = toNumber(location.hotTemperature);
  const cold = toNumber(location.coldTemperature);
  const tmv = toNumber(location.tmvTemperature ?? location.mixedTemperature);

  if (!type) {
    return {
      status: "Incomplete",
      remedialRequired: "",
      message: "Select the outlet type.",
    };
  }

  if (type === "Hot / Cold") {
    if (hot === null && cold === null) {
      return {
        status: "Incomplete",
        remedialRequired: "",
        message: "Enter at least one Hot or Cold temperature.",
      };
    }

    const messages = [];
    let actionRequired = false;

    if (hot !== null) {
      const pass = hot > 50;
      actionRequired ||= !pass;
      messages.push(
        pass
          ? `Hot ${hot.toFixed(1)} C: pass, above 50 C.`
          : `Hot ${hot.toFixed(1)} C: action required, not above 50 C.`,
      );
    }

    if (cold !== null) {
      const pass = cold < 20;
      actionRequired ||= !pass;
      messages.push(
        pass
          ? `Cold ${cold.toFixed(1)} C: pass, below 20 C.`
          : `Cold ${cold.toFixed(1)} C: action required, not below 20 C.`,
      );
    }

    return {
      status: actionRequired ? "Action" : "Pass",
      remedialRequired: actionRequired ? "Yes" : "No",
      message: messages.join(" "),
    };
  }

  if (hot === null && cold === null && tmv === null) {
    return {
      status: "Incomplete",
      remedialRequired: "",
      message: "Enter at least one Hot, Cold, or TMV mixed temperature.",
    };
  }

  const messages = [];
  let actionRequired = false;

  if (hot !== null) {
    const pass = hot > 50;
    actionRequired ||= !pass;
    messages.push(
      pass
        ? `Hot ${hot.toFixed(1)} C: pass, above 50 C.`
        : `Hot ${hot.toFixed(1)} C: action required, not above 50 C.`,
    );
  }

  if (cold !== null) {
    const pass = cold < 20;
    actionRequired ||= !pass;
    messages.push(
      pass
        ? `Cold ${cold.toFixed(1)} C: pass, below 20 C.`
        : `Cold ${cold.toFixed(1)} C: action required, not below 20 C.`,
    );
  }

  if (tmv !== null) {
    messages.push(`TMV mixed ${tmv.toFixed(1)} C: recorded for manual review.`);
  }

  if (actionRequired) {
    return {
      status: "Action",
      remedialRequired: "Yes",
      message: messages.join(" "),
    };
  }

  if (!location.remedialRequired) {
    return {
      status: "Review",
      remedialRequired: "",
      message: `${messages.join(" ")} Select whether remedial action is required.`,
    };
  }

  return {
    status: location.remedialRequired === "Yes" ? "Action" : "Recorded",
    remedialRequired: location.remedialRequired,
    message: messages.join(" "),
  };
}

function renumber(container) {
  [...container.querySelectorAll(".water-outlet-card")].forEach((card, index) => {
    card.dataset.outletNumber = String(index + 1);
    card.querySelector(".water-outlet-number").textContent = `Location ${index + 1}`;
  });
}

function updateCard(card, onChange) {
  const type = card.querySelector(".water-outlet-type").value;
  const hotColdFields = card.querySelector(".water-hot-cold-fields");
  const tmvField = card.querySelector(".water-tmv-field");
  const remedialGroup = card.querySelector(".water-remedial-group");
  const remedialSelect = card.querySelector(".water-remedial");
  const remedialAction = card.querySelector(".water-remedial-action");

  hotColdFields.hidden = type !== "Hot / Cold" && type !== "TMV";
  tmvField.hidden = type !== "TMV";
  remedialGroup.hidden = type !== "TMV";

  if (type === "Hot / Cold") {
    card.querySelector(".water-tmv-temperature").value = "";
  }

  const location = readCard(card);
  const assessment = assessLocation(location);

  if (type === "Hot / Cold") {
    remedialSelect.value = assessment.remedialRequired;
  }

  remedialSelect.required = type === "TMV";
  remedialAction.required = assessment.status === "Action";

  const result = card.querySelector(".water-compliance");
  result.dataset.status = assessment.status;
  result.querySelector("b").textContent = assessment.status;
  result.querySelector("small").textContent = assessment.message;
  onChange();
}

function addLocation(container, storedValue = {}, onChange) {
  const value = {
    ...storedValue,
    outletType: normaliseOutletType(storedValue.outletType, storedValue),
    tmvTemperature: storedValue.tmvTemperature ?? storedValue.mixedTemperature,
  };
  const card = document.createElement("article");
  card.className = "water-outlet-card";
  card.innerHTML = `
    <div class="water-outlet-head">
      <span class="water-outlet-number">Location</span>
      <button type="button" class="remove water-remove-outlet">Remove</button>
    </div>
    <div class="water-outlet-grid">
      <div class="control-group full">
        <label>Outlet location <span aria-hidden="true">*</span></label>
        <input class="water-location" required placeholder="e.g. Reception or 1F kitchen" value="${escapeHtml(value.outletLocation)}">
      </div>
      <div class="control-group full">
        <label>Outlet type <span aria-hidden="true">*</span></label>
        <select class="water-outlet-type" required>
          ${typeOptions(value.outletType)}
        </select>
      </div>
      <div class="water-hot-cold-fields full" hidden>
        <div class="control-group water-temperature-group hot">
          <label>Hot temperature C</label>
          <input class="water-hot-temperature" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="Optional" value="${inputValue(value.hotTemperature)}">
          <small>Target: above 50 C.</small>
        </div>
        <div class="control-group water-temperature-group cold">
          <label>Cold temperature C</label>
          <input class="water-cold-temperature" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="Optional" value="${inputValue(value.coldTemperature)}">
          <small>Target: below 20 C.</small>
        </div>
      </div>
      <div class="control-group water-temperature-group tmv water-tmv-field full" hidden>
        <label>TMV mixed temperature C</label>
        <input class="water-tmv-temperature" type="number" inputmode="decimal" step="0.1" min="0" max="100" placeholder="Optional" value="${inputValue(value.tmvTemperature)}">
        <small>Recorded for manual review.</small>
      </div>
      <div class="control-group water-remedial-group full" hidden>
        <label>Remedial action required <span aria-hidden="true">*</span></label>
        <select class="water-remedial">
          ${remedialOptions(value.remedialRequired)}
        </select>
      </div>
      <div class="water-compliance full" data-status="Incomplete">
        <b>Incomplete</b>
        <small>Select the outlet type.</small>
      </div>
      <div class="control-group full">
        <label>Remedial action or comments</label>
        <textarea class="water-remedial-action" rows="3" placeholder="Required when remedial action is needed">${escapeHtml(value.remedialAction)}</textarea>
      </div>
    </div>`;

  card.querySelector(".water-remove-outlet").onclick = () => {
    card.remove();
    renumber(container);
    onChange();
  };

  card.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => updateCard(card, onChange));
    field.addEventListener("change", () => updateCard(card, onChange));
  });

  container.append(card);
  renumber(container);
  updateCard(card, onChange);
}

export const waterTemperatureChecksForm = {
  id: "water-temperature-checks",
  title: "Water temperature checks",
  icon: "🚰",
  contentTitle: "Hot, cold and TMV locations",
  contentIntro: "Select Hot / Cold or TMV, then enter any readings taken. At least one temperature is required.",

  render(container, data, onChange) {
    container.className = "water-temperature-form";
    container.innerHTML = `
      <div class="water-guidance">
        <b>Temperature guidance</b>
        <small>Hot / Cold outlets may have either or both readings. TMV locations may have Hot, Cold, and Mixed readings. At least one reading is required. Hot should be above 50 C and Cold below 20 C.</small>
      </div>
      <div class="water-outlet-list"></div>
      <button type="button" class="add-btn water-add-outlet">+ Add another location</button>`;

    const list = container.querySelector(".water-outlet-list");
    const locations = data.outlets?.length
      ? data.outlets
      : data.locations?.length
        ? data.locations
        : [{}];
    locations.forEach((location) => addLocation(list, location, onChange));
    container.querySelector(".water-add-outlet").onclick = () =>
      addLocation(list, {}, onChange);
    onChange();
  },

  validate(container) {
    [...container.querySelectorAll(".water-outlet-card")].forEach((card) => {
      updateCard(card, () => {});
      const location = readCard(card);
      const assessment = assessLocation(location);
      const validationTarget = card.querySelector(".water-hot-temperature");
      const remedialAction = card.querySelector(".water-remedial-action");

      validationTarget.setCustomValidity(
        assessment.status === "Incomplete"
          ? assessment.message
          : "",
      );
      remedialAction.setCustomValidity(
        assessment.status === "Action" && !location.remedialAction
          ? "Describe the remedial action required."
          : "",
      );
    });
  },

  collect(container) {
    const outlets = [...container.querySelectorAll(".water-outlet-card")].map(
      (card, index) => {
        const location = readCard(card);
        const assessment = assessLocation(location);
        return {
          outletNumber: index + 1,
          outletLocation: location.outletLocation,
          outletType: location.outletType,
          hotTemperature: toNumber(location.hotTemperature),
          coldTemperature: toNumber(location.coldTemperature),
          tmvTemperature:
            location.outletType === "TMV"
              ? toNumber(location.tmvTemperature)
              : null,
          remedialRequired:
            assessment.remedialRequired || location.remedialRequired,
          remedialAction: location.remedialAction,
          complianceStatus: assessment.status,
        };
      },
    );
    return { outlets };
  },

  countLabel(container) {
    const count = container.querySelectorAll(".water-outlet-card").length;
    return `${count} ${count === 1 ? "location" : "locations"}`;
  },

  recordDescription(record) {
    const outlets = record.outlets || record.locations || [];
    const actions = outlets.filter(
      (outlet) =>
        outlet.remedialRequired === "Yes" ||
        assessLocation(outlet).status === "Action",
    ).length;
    return `${outlets.length} locations | ${actions} requiring action`;
  },

  summaryLines(record) {
    return (record.outlets || record.locations || []).map((outlet, index) => {
      const type = normaliseOutletType(outlet.outletType, outlet) || "No type";
      return `${index + 1}. ${outlet.outletLocation || "No location"} | ${type} | Hot: ${formatTemperature(outlet.hotTemperature)} | Cold: ${formatTemperature(outlet.coldTemperature)} | TMV: ${formatTemperature(outlet.tmvTemperature ?? outlet.mixedTemperature)} | Remedial: ${outlet.remedialRequired || "Not selected"}${outlet.remedialAction ? ` | ${outlet.remedialAction}` : ""}`;
    });
  },

  toCsvRows(record) {
    const outlets = record.outlets?.length
      ? record.outlets
      : record.locations?.length
        ? record.locations
        : [{}];
    return outlets.map((outlet, index) => {
      const type = normaliseOutletType(outlet.outletType, outlet);
      return [
        "Water temperature checks",
        outlet.outletLocation || "",
        outlet.outletNumber || index + 1,
        type,
        [
          outlet.hotTemperature !== null && outlet.hotTemperature !== undefined
            ? `Hot: ${outlet.hotTemperature} C`
            : "",
          outlet.coldTemperature !== null && outlet.coldTemperature !== undefined
            ? `Cold: ${outlet.coldTemperature} C`
            : "",
          type === "TMV" && (outlet.tmvTemperature ?? outlet.mixedTemperature) !== null && (outlet.tmvTemperature ?? outlet.mixedTemperature) !== undefined
            ? `TMV: ${outlet.tmvTemperature ?? outlet.mixedTemperature} C`
            : "",
        ].filter(Boolean).join(" | "),
        outlet.remedialRequired === "Yes" ? "Red" : "Green",
        [
          `Compliance: ${outlet.complianceStatus || assessLocation(outlet).status}`,
          `Remedial required: ${outlet.remedialRequired || ""}`,
          outlet.remedialAction || "",
        ].filter(Boolean).join(" | "),
      ];
    });
  },
};
