const ID = "__tla_bar__";
export function ensureBar(): HTMLDivElement {
  let el = document.getElementById(ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = ID;
    Object.assign(el.style, {
      position: "fixed",
      top: "8px",
      right: "8px",
      padding: "6px 10px",
      background: "rgba(0,0,0,.75)",
      color: "white",
      font: "12px/1.3 system-ui, sans-serif",
      borderRadius: "8px",
      zIndex: "2147483647",
      maxWidth: "45vw",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      cursor: "pointer"
    });
    el.title = "TLA HUD";
    document.body.appendChild(el);
  }
  return el;
}
