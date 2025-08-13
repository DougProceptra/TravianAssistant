const key = "tla.overlay";
const el = document.getElementById("overlay") as HTMLInputElement;

chrome.storage.sync.get([key]).then(v => {
  if (el) el.checked = !!v[key];
});

el?.addEventListener("change", () => {
  chrome.storage.sync.set({ [key]: el.checked });
});
