
const BAR_ID = "__tla_bar__";

export function ensureBar() {
  let el = document.getElementById(BAR_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = BAR_ID;
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.right = "8px";
    el.style.padding = "6px 10px";
    el.style.background = "rgba(0,0,0,.7)";
    el.style.color = "white";
    el.style.font = "12px/1.2 system-ui, sans-serif";
    el.style.borderRadius = "8px";
    el.style.zIndex = "2147483647";
    el.textContent = "TLA overlay";
    document.body.appendChild(el);
  }
  return el;
}
