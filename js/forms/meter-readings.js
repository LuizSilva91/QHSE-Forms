function control(label, key, value = "") {
  return `<div class="control-group"><label>${label}</label><input data-k="${key}" value="${value || ""}"></div>`;
}

export const meterReadingsForm = {
  id: "meters",
  title: "Meter readings",
  icon: "⌁",
  contentTitle: "Meter readings",
  contentIntro: "Enter the four readings for this inspection.",

  render(container, data, onChange) {
    const value = data.items?.[0] || {};
    container.className = "entries";
    container.innerHTML = `<article class="entry meter-entry">
      <div class="entry-head meter-head"><b>Current readings</b><span class="complete-mark">4 meters</span></div>
      <div class="entry-grid meter-grid">
        ${control("Gas meter", "gas", value.gas)}
        ${control("Water meter", "water", value.water)}
        ${control("Electric 1", "electric1", value.electric1)}
        ${control("Electric 2", "electric2", value.electric2)}
      </div>
    </article>`;
    onChange();
  },

  validate() {},

  collect(container) {
    return {
      items: [...container.querySelectorAll(".meter-entry")].map((entry) =>
        Object.fromEntries([...entry.querySelectorAll("[data-k]")].map((field) => [field.dataset.k, field.value])),
      ),
    };
  },

  countLabel() { return "4 readings"; },

  recordDescription(record) {
    return `${(record.items || []).length} entries`;
  },

  summaryLines(record) {
    return (record.items || []).map((item, index) =>
      `${index + 1}. ${Object.entries(item).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(" | ")}`,
    );
  },

  toCsvRows(record) {
    return (record.items?.length ? record.items : [{}]).map((item) => ["", "", "", "", "", "", `Gas: ${item.gas || ""} | Water: ${item.water || ""} | Electric 1: ${item.electric1 || ""} | Electric 2: ${item.electric2 || ""}`]);
  },
};
