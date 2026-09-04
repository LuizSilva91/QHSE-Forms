import { emergencyLightingTestForm } from "./emergency-lighting-test.js";
import { meterReadingsForm } from "./meter-readings.js";
import { rackingInspectionForm } from "./racking-inspection.js";
import { waterTemperatureChecksForm } from "./water-temperature-checks.js";
import { weeklyOutletFlushingForm } from "./weekly-outlet-flushing.js";
import { sprinklerValveWeeklyTestForm } from "./sprinkler-valve-weekly-test.js";

export const forms = [
  meterReadingsForm,
  rackingInspectionForm,
  emergencyLightingTestForm,
  waterTemperatureChecksForm,
  weeklyOutletFlushingForm,
  sprinklerValveWeeklyTestForm,
];

export const getForm = (id) => forms.find((form) => form.id === id);
