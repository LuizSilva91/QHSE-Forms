const defects = {
  "Front upright": ["Damage", "Twist", "Floor fixing missing / damaged", "Loose floor fixing", "Footplate damage", "Footplate fixing", "Shim incorrect / twisted"],
  "Rear upright": ["Damage", "Twist", "Floor fixing missing / damaged", "Loose floor fixing", "Footplate damage", "Footplate fixing", "Shim incorrect / twisted"],
  "Frame bracing": ["Bottom horizontal", "First diagonal", "Second diagonal", "Third diagonal", "Fourth diagonal", "Fifth diagonal", "Sixth diagonal", "Seventh diagonal", "Top horizontal", "Loose fixing"],
  Beam: ["Damage", "Dislodged beam", "Missing locking pin", "Beam deflection"],
  "Secondary components": ["Deck missing / damaged", "Anti-collapse damaged", "Upright guard damaged", "Upright guard loose", "Barrier damaged", "Barrier loose", "Load sign missing"],
};

function renumberAreas(container) {
  [...container.querySelectorAll(".area-card")].forEach((area, index) => area.querySelector(".area-number").textContent = `Area ${index + 1}`);
}
function renumberLocations(container) {
  [...container.querySelectorAll(".location-card")].forEach((location, index) => location.querySelector(".location-head b").textContent = `Location reference ${index + 1}`);
}
function renumberDefects(container) {
  [...container.querySelectorAll(".defect-card")].forEach((card, index) => card.querySelector(".defect-head b").textContent = `Defect ${index + 1}`);
}
function updateDefectCount(location) {
  const count = location.querySelectorAll(".defect-card").length;
  location.querySelector(".defect-count").textContent = `${count} ${count === 1 ? "defect" : "defects"}`;
}

function addDefect(container, defectData = {}, onChange) {
  const card = document.createElement("div");
  card.className = "defect-card";
  card.innerHTML = `<div class="defect-head"><b>Defect</b><button type="button" class="remove remove-defect">Remove defect</button></div>
    <div class="defect-grid">
      <div class="control-group"><label>Component <span aria-hidden="true">*</span></label><select class="defect-component" required><option value="">Select component</option>${Object.keys(defects).map((component) => `<option ${defectData.component === component ? "selected" : ""}>${component}</option>`).join("")}</select></div>
      <div class="control-group"><label>Defect <span aria-hidden="true">*</span></label><select class="defect-type" required></select></div>
      <div class="control-group full"><label>Comments</label><textarea class="defect-comments" rows="3" placeholder="Add details for this defect">${defectData.comments || ""}</textarea></div>
      <div class="control-group full risk-group"><label>Risk rating <span aria-hidden="true">*</span></label><div class="risk-choice">${["Red","Amber","Green"].map((risk) => `<button type="button" data-risk="${risk}" class="${defectData.risk === risk ? "active" : ""}">${risk}</button>`).join("")}</div><input class="defect-risk" type="hidden" value="${defectData.risk || ""}"></div>
    </div>`;
  const component = card.querySelector(".defect-component");
  const defect = card.querySelector(".defect-type");
  const loadDefects = () => defect.innerHTML = '<option value="">Select defect</option>' + (defects[component.value] || []).map((item) => `<option ${defectData.defect === item ? "selected" : ""}>${item}</option>`).join("");
  component.onchange = () => { defectData.defect = ""; loadDefects(); };
  loadDefects();
  card.querySelectorAll("[data-risk]").forEach((button) => button.onclick = () => {
    card.querySelectorAll("[data-risk]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active"); card.querySelector(".defect-risk").value = button.dataset.risk; component.setCustomValidity("");
  });
  card.querySelector(".remove-defect").onclick = () => { const location=container.closest(".location-card"); card.remove(); renumberDefects(container); updateDefectCount(location); onChange(); };
  container.append(card); renumberDefects(container); updateDefectCount(container.closest(".location-card")); onChange();
}

function addLocation(container, locationData = {}, onChange) {
  const storedDefects = locationData.defects?.length ? locationData.defects : locationData.component ? [{component:locationData.component,defect:locationData.defect,risk:locationData.risk,comments:locationData.comments}] : [];
  const location=document.createElement("article"); location.className="location-card";
  location.innerHTML=`<div class="location-head"><b>Location reference</b><button type="button" class="remove remove-location">Remove</button></div>
    <div class="control-group full"><label>Location reference <span aria-hidden="true">*</span></label><input class="location-reference" required placeholder="e.g. BC 047" value="${locationData.locationReference || locationData.location || ""}"></div>
    <div class="defects-section"><div class="defects-heading"><div><b>Defects identified</b><small>Add each component and defect separately.</small></div><span class="defect-count">0 defects</span></div><div class="defects-list"></div><button type="button" class="add-defect">＋ Add another defect</button></div>`;
  const list=location.querySelector(".defects-list");
  location.querySelector(".add-defect").onclick=()=>addDefect(list,{},onChange);
  location.querySelector(".remove-location").onclick=()=>{location.remove();renumberLocations(container);onChange();};
  (storedDefects.length?storedDefects:[{}]).forEach((defect)=>addDefect(list,defect,onChange));
  container.append(location);renumberLocations(container);updateDefectCount(location);onChange();
}

function addArea(container, areaData = {}, onChange) {
  const area=document.createElement("article"); area.className="area-card";
  area.innerHTML=`<div class="area-head"><div class="area-number">Area</div><button type="button" class="remove remove-area">Remove area</button></div><div class="area-name-field"><label>Area <span aria-hidden="true">*</span></label><input class="area-name" type="text" placeholder="e.g. Aisles A-M" value="${areaData.area || ""}" required></div><div class="locations-list"></div><button type="button" class="add-location">＋ Add location reference</button>`;
  const locations=area.querySelector(".locations-list");
  area.querySelector(".add-location").onclick=()=>addLocation(locations,{},onChange);
  area.querySelector(".remove-area").onclick=()=>{area.remove();renumberAreas(container);onChange();};
  (areaData.locations?.length?areaData.locations:[{}]).forEach((location)=>addLocation(locations,location,onChange));
  container.append(area);renumberAreas(container);onChange();
}

export const rackingInspectionForm = {
  id:"rack", title:"Racking inspection", icon:"▦", contentTitle:"Areas checked",
  contentIntro:"Add each area, then add location references and all defects found at each location.",
  render(container,data,onChange){
    container.className="entries area-list";
    let areas=data.areas;
    if(!areas?.length&&data.items?.length) areas=[{area:"",locations:data.items.map((item)=>({locationReference:item.location||"",defects:[{component:item.component,defect:item.defect,risk:item.risk,comments:item.comments}]}))}];
    (areas?.length?areas:[{area:"",locations:[{}]}]).forEach((area)=>addArea(container,area,onChange));
    const add=document.createElement("button");add.type="button";add.className="add-btn";add.textContent="＋ Add another area";add.onclick=()=>addArea(container,{},onChange);container.after(add);onChange();
  },
  validate(container){
    container.querySelectorAll(".location-card").forEach((location)=>{const reference=location.querySelector(".location-reference");const cards=[...location.querySelectorAll(".defect-card")];reference.setCustomValidity(cards.length?"":"Add at least one defect for this location.");cards.forEach((card)=>{const component=card.querySelector(".defect-component");component.setCustomValidity(card.querySelector(".defect-risk").value?"":"Select a risk rating for this defect.");});});
  },
  collect(container) {
    const areas = [...container.querySelectorAll(".area-card")].map((area) => {
      const locations = [
        ...area.querySelectorAll(":scope > .locations-list > .location-card"),
      ].map((location) => {
        const defectsFound = [...location.querySelectorAll(".defect-card")].map(
          (card) => ({
            component: card.querySelector(".defect-component").value,
            defect: card.querySelector(".defect-type").value,
            risk: card.querySelector(".defect-risk").value,
            comments: card.querySelector(".defect-comments").value,
          }),
        );

        return {
          locationReference: location.querySelector(".location-reference").value,
          defects: defectsFound,
        };
      });

      return {
        area: area.querySelector(".area-name").value,
        locations,
      };
    });

    return { areas };
  },

  countLabel(container){const a=container.querySelectorAll(".area-card").length,l=container.querySelectorAll(".location-card").length,d=container.querySelectorAll(".defect-card").length;return `${a} ${a===1?"area":"areas"} · ${l} ${l===1?"location":"locations"} · ${d} ${d===1?"defect":"defects"}`;},
  recordDescription(record){const locations=(record.areas||[]).reduce((n,a)=>n+(a.locations||[]).length,0);return `${(record.areas||[]).length} areas · ${locations} location references`;},
  summaryLines(record){const lines=[];(record.areas||[]).forEach((area,ai)=>{lines.push(`Area ${ai+1}: ${area.area}`);(area.locations||[]).forEach((location,li)=>{lines.push(`  Location ${li+1}: ${location.locationReference||location.location||""}`);(location.defects||[]).forEach((defect,di)=>lines.push(`    Defect ${di+1}: ${defect.component} | ${defect.defect} | ${defect.risk}${defect.comments?` | ${defect.comments}`:""}`));});});return lines;},
  toCsvRows(record){const rows=[];(record.areas||[]).forEach((area)=>(area.locations||[]).forEach((location)=>(location.defects||[]).forEach((defect,index)=>rows.push([area.area,location.locationReference||location.location||"",index+1,defect.component,defect.defect,defect.risk,defect.comments]))));return rows;},
};
