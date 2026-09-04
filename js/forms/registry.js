import { emergencyLightingTestForm } from "./emergency-lighting-test.js";
import { meterReadingsForm } from "./meter-readings.js";
import { rackingInspectionForm } from "./racking-inspection.js";
import { waterTemperatureChecksForm } from "./water-temperature-checks.js";
import { weeklyOutletFlushingForm } from "./weekly-outlet-flushing.js";

export const forms = [
  meterReadingsForm,
  rackingInspectionForm,
  emergencyLightingTestForm,
  waterTemperatureChecksForm,
  weeklyOutletFlushingForm,
];

export const getForm = (id) => forms.find((form) => form.id === id);
