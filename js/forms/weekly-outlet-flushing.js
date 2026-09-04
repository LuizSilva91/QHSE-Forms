const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function renumber(container) {
  [...container.querySelectorAll(".flushing-location-card")].forEach((card, index) => {
    const number = index + 1;
    card.dataset.locationNumber = String(number);
    card.querySelector(".flushing-location-number").textContent = `Location ${number}`;
  });
}

function addLocation(container, value = {}, onChange) {
  const card = document.createElement("article");
  card.className = "flushing-location-card";
  card.innerHTML = `
    <div class="flushing-location-head">
      <span class="flushing-location-number">Location</span>
      <button type="button" class="remove flushing-remove-location">Remove</button>
    </div>
    <div class="flushing-location-grid">
      <div class="control-group full">
        <label>Location <span aria-hidden="true">*</span></label>
        <input class="flushing-location" required placeholder="e.g. Reception 1st aid room" value="${escapeHtml(value.location)}">
      </div>
      <div class="control-group">
        <label>Outlet flushed <span aria-hidden="true">*</span></label>
        <input class="flushing-outlet" required placeholder="e.g. Tap, shower or Tap x 2" value="${escapeHtml(value.outletFlushed)}">
      </div>
      <div class="control-group">
        <label>Flushing completed <span aria-hidden="true">*</span></label>
        <select class="flushing-completed" required>
          <option value="">Select</option>
          <option value="Yes" ${value.completed === "Yes" || !value.completed ? "selected" : ""}>Yes</option>
          <option value="No" ${value.completed === "No" ? "selected" : ""}>No</option>
          <option value="Unable to access" ${value.completed === "Unable to access" ? "selected" : ""}>Unable to access</option>
        </select>
      </div>
      <div class="control-group full">
        <label>Comments</label>
        <textarea class="flushing-comments" rows="3" placeholder="Add details or explain why flushing was not completed">${escapeHtml(value.comments)}</textarea>
      </div>
    </div>`;

  const completed = card.querySelector(".flushing-completed");
  const comments = card.querySelector(".flushing-comments");
  const updateRequirements = () => {
    comments.required = completed.value !== "Yes";
    comments.setCustomValidity(
      completed.value !== "Yes" && !comments.value.trim()
        ? "Add a comment explaining why flushing was not completed."
        : "",
    );
    onChange();
  };

  card.querySelector(".flushing-remove-location").onclick = () => {
    card.remove();
    renumber(container);
    onChange();
  };
  card.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", updateRequirements);
    field.addEventListener("change", updateRequirements);
  });
  container.append(card);
  renumber(container);
  updateRequirements();
}

export const weeklyOutletFlushingForm = {
  id: "weekly-outlet-flushing",
  title: "Weekly outlet flushing",
  icon: "🚿",
  contentTitle: "Low use outlets",
  contentIntro: "Record each low use outlet flushed during the weekly check.",

  render(container, data, onChange) {
    container.className = "weekly-flushing-form";
    container.innerHTML = `
      <div class="flushing-guidance">
        <b>Standard check</b>
        <small>Low use outlets, including showers, should be flushed for several minutes every week.</small>
      </div>
      <div class="flushing-location-list"></div>
      <button type="button" class="add-btn flushing-add-location">+ Add another location</button>`;

    const list = container.querySelector(".flushing-location-list");
    const locations = data.locations?.length ? data.locations : [{}];
    locations.forEach((location) => addLocation(list, location, onChange));
    container.querySelector(".flushing-add-location").onclick = () => addLocation(list, {}, onChange);
    onChange();
  },

  validate(container) {
    [...container.querySelectorAll(".flushing-location-card")].forEach((card) => {
      const completed = card.querySelector(".flushing-completed");
      const comments = card.querySelector(".flushing-comments");
      comments.setCustomValidity(
        completed.value !== "Yes" && !comments.value.trim()
          ? "Add a comment explaining why flushing was not completed."
          : "",
      );
    });
  },

  collect(container) {
    return {
      locations: [...container.querySelectorAll(".flushing-location-card")].map((card, index) => ({
        locationNumber: index + 1,
        location: card.querySelector(".flushing-location").value.trim(),
        outletFlushed: card.querySelector(".flushing-outlet").value.trim(),
        completed: card.querySelector(".flushing-completed").value,
        comments: card.querySelector(".flushing-comments").value.trim(),
      })),
    };
  },

  countLabel(container) {
    const count = container.querySelectorAll(".flushing-location-card").length;
    return `${count} ${count === 1 ? "location" : "locations"}`;
  },

  recordDescription(record) {
    const locations = record.locations || [];
    const incomplete = locations.filter((location) => location.completed !== "Yes").length;
    return `${locations.length} locations | ${incomplete} not completed`;
  },

  summaryLines(record) {
    return (record.locations || []).map((location, index) =>
      `${index + 1}. ${location.location || "No location"} | ${location.outletFlushed || "No outlet"} | Completed: ${location.completed || "Not recorded"}${location.comments ? ` | ${location.comments}` : ""}`,
    );
  },

  toCsvRows(record) {
    return (record.locations?.length ? record.locations : [{}]).map((location, index) => [
      "Weekly outlet flushing",
      location.location || "",
      location.locationNumber || index + 1,
      location.outletFlushed || "",
      location.completed || "",
      location.completed === "Yes" ? "Green" : "Red",
      location.comments || "",
    ]);
  },
};
