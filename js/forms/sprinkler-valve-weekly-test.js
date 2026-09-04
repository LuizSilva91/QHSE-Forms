const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function choice(name, label, value, required = true) {
  return `<div class="sprinkler-check"><label>${label}${required ? ' <span aria-hidden="true">*</span>' : ""}</label><select data-k="${name}" ${required ? "required" : ""}><option value="">Select</option><option value="Yes" ${value === "Yes" ? "selected" : ""}>Yes</option><option value="No" ${value === "No" ? "selected" : ""}>No</option><option value="N/A" ${value === "N/A" ? "selected" : ""}>N/A</option></select></div>`;
}
function input(name, label, value, options = {}) {
  return `<div class="sprinkler-field ${options.full ? "full" : ""}"><label>${label}${options.required ? ' <span aria-hidden="true">*</span>' : ""}</label><input data-k="${name}" type="${options.type || "text"}" value="${escapeHtml(value)}" ${options.step ? `step="${options.step}"` : ""} ${options.required ? "required" : ""} placeholder="${options.placeholder || ""}"></div>`;
}
function showFailures(container) {
  const failures = [...container.querySelectorAll("select[data-k]")].filter((field) => field.value === "No");
  const comments = container.querySelector('[data-k="comments"]');
  comments.required = failures.length > 0;
  comments.setCustomValidity(failures.length && !comments.value.trim() ? "Explain each failed check or corrective action." : "");
  const status = container.querySelector(".sprinkler-status");
  status.dataset.status = failures.length ? "Action" : "Pass";
  status.querySelector("b").textContent = failures.length ? "Action required" : "Checks acceptable";
  status.querySelector("small").textContent = failures.length ? `${failures.length} check(s) marked No. Add details below.` : "No inspection checks are currently marked No.";
}
function read(container, key) { return container.querySelector(`[data-k="${key}"]`)?.value ?? ""; }

export const sprinklerValveWeeklyTestForm = {
  id: "sprinkler-valve-weekly-test",
  title: "Sprinkler valve weekly test",
  icon: "🚒",
  contentTitle: "Weekly sprinkler valve test",
  contentIntro: "Complete the inspection, bell test, water storage and heating checks.",

  render(container, data, onChange) {
    const v = data.test || {};
    container.className = "sprinkler-test-form";
    container.innerHTML = `
      <div class="sprinkler-guidance"><b>Weekly test record</b><small>Record N/A where a pressure tank, heating check or system feature is not installed.</small></div>
      <section class="sprinkler-group"><h3>Inspection</h3><div class="sprinkler-check-grid">
        ${choice("mainStopValveSecured", "Main stop valve secured open by padlock and strap", v.mainStopValveSecured)}
        ${choice("otherStopValvesSecured", "Other property stop valves secured open or closed as appropriate", v.otherStopValvesSecured)}
        ${choice("spareSprinklerHeads", "Correct number of spare sprinkler heads available", v.spareSprinklerHeads)}
        ${choice("systemOperational", "System accelerator or exhauster operational, if fitted", v.systemOperational)}
        ${choice("waterTurnedOff", "Water turned off at any time", v.waterTurnedOff)}
        ${input("waterTurnedOffReason", "Reason if water was turned off", v.waterTurnedOffReason, {full:true,placeholder:"Required when water was turned off"})}
      </div></section>
      <section class="sprinkler-group"><h3>Pressure tank</h3><div class="sprinkler-check-grid">
        ${choice("tankCorrectLevel", "Tank filled to correct level", v.tankCorrectLevel, false)}
        ${choice("airPressureCorrect", "Air pressure correct", v.airPressureCorrect, false)}
      </div></section>
      <section class="sprinkler-group"><h3>Bell test</h3><div class="sprinkler-reading-grid">
        ${input("pressureBefore", "Gauge pressure before test", v.pressureBefore, {type:"number",step:"0.1",required:true,placeholder:"e.g. 12.6"})}
        ${input("timeToAlarm", "Time to ring alarm (seconds)", v.timeToAlarm, {type:"number",step:"1",required:true,placeholder:"e.g. 12"})}
        ${input("pressureAfter", "Gauge pressure after test", v.pressureAfter, {type:"number",step:"0.1",required:true,placeholder:"e.g. 12.5"})}
      </div></section>
      <section class="sprinkler-group"><h3>Water storage and heating</h3><div class="sprinkler-check-grid">
        ${choice("waterStorageInOrder", "Pump suction tank, gravity tank, elevated reservoir, jackwells, priming tanks and ball valves in order", v.waterStorageInOrder)}
      </div><div class="sprinkler-reading-grid">
        ${input("pumpHouseTemperature", "Minimum pump house temperature (C)", v.pumpHouseTemperature, {type:"number",step:"0.1",placeholder:"e.g. 15"})}
      </div></section>
      <section class="sprinkler-group"><h3>Comments and exceptions</h3><div class="sprinkler-reading-grid">
        <div class="sprinkler-field full"><label>Comments or corrective action</label><textarea data-k="comments" rows="4" placeholder="Add failures, observations or actions">${escapeHtml(v.comments)}</textarea></div>
      </div></section>
      <div class="sprinkler-status" data-status="Pass"><b>Checks acceptable</b><small>No inspection checks are currently marked No.</small></div>`;
    const waterOff = container.querySelector('[data-k="waterTurnedOff"]');
    const reason = container.querySelector('[data-k="waterTurnedOffReason"]');
    const update = () => { reason.required = waterOff.value === "Yes"; reason.setCustomValidity(reason.required && !reason.value.trim() ? "Explain why the water was turned off." : ""); showFailures(container); onChange(); };
    container.querySelectorAll("input, select, textarea").forEach((field) => { field.addEventListener("input", update); field.addEventListener("change", update); });
    update();
  },
  validate(container) { showFailures(container); const reason=container.querySelector('[data-k="waterTurnedOffReason"]'); reason.setCustomValidity(read(container,"waterTurnedOff")==="Yes"&&!reason.value.trim()?"Explain why the water was turned off.":""); },
  collect(container) {
    const keys=["mainStopValveSecured","otherStopValvesSecured","spareSprinklerHeads","systemOperational","waterTurnedOff","tankCorrectLevel","airPressureCorrect","pressureBefore","timeToAlarm","pressureAfter","waterStorageInOrder","pumpHouseTemperature","waterTurnedOffReason","comments"];
    return { test:Object.fromEntries(keys.map((key)=>[key,read(container,key)])) };
  },
  countLabel() { return "1 weekly test"; },
  recordDescription(record) { const t=record.test||{}; const checks=[t.mainStopValveSecured,t.otherStopValvesSecured,t.spareSprinklerHeads,t.systemOperational,t.waterStorageInOrder]; const failures=checks.filter((x)=>x==="No").length; return `${failures} checks requiring action | Alarm ${t.timeToAlarm || "-"} sec`; },
  summaryLines(record) { const t=record.test||{}; return [
    `Main stop valve secured: ${t.mainStopValveSecured||""}`, `Other stop valves secured: ${t.otherStopValvesSecured||""}`, `Spare sprinkler heads: ${t.spareSprinklerHeads||""}`, `System operational: ${t.systemOperational||""}`, `Water turned off: ${t.waterTurnedOff||""}${t.waterTurnedOffReason?` | ${t.waterTurnedOffReason}`:""}`, `Pressure tank level: ${t.tankCorrectLevel||""}`, `Air pressure correct: ${t.airPressureCorrect||""}`, `Bell test: before ${t.pressureBefore||""} | alarm ${t.timeToAlarm||""} sec | after ${t.pressureAfter||""}`, `Water storage in order: ${t.waterStorageInOrder||""}`, `Pump house temperature: ${t.pumpHouseTemperature||""} C`, `Comments: ${t.comments||""}` ]; },
  toCsvRows(record) { const t=record.test||{}; return [["Sprinkler valve weekly test","",1,"Sprinkler system",`Before: ${t.pressureBefore||""} | Alarm: ${t.timeToAlarm||""} sec | After: ${t.pressureAfter||""}`, [t.mainStopValveSecured,t.otherStopValvesSecured,t.spareSprinklerHeads,t.systemOperational,t.waterStorageInOrder].includes("No")?"Red":"Green", JSON.stringify(t)]]; },
};
