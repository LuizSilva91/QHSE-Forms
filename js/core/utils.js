export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => [...document.querySelectorAll(selector)];

export const today = () => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "2-digit", year: "numeric",
}).format(new Date());

export const ukDate = (value) => value || "No date";

export const ukDateTime = (date) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
}).format(date).replace(",", "");

export function validUKDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const date = new Date(+match[3], +match[2] - 1, +match[1]);
  return date.getFullYear() === +match[3]
    && date.getMonth() === +match[2] - 1
    && date.getDate() === +match[1];
}

export const uid = () => `INS-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

export function download(name, content, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 500);
}

export const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
