import { emergencyLightingTestForm } from "./emergency-lighting-test.js";
import { meterReadingsForm } from "./meter-readings.js";
import { rackingInspectionForm } from "./racking-inspection.js";

export const forms = [
  meterReadingsForm,
  rackingInspectionForm,
  emergencyLightingTestForm,
];

export const getForm = (id) => forms.find((form) => form.id === id);
