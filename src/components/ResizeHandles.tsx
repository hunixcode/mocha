import { getCurrentWindow } from "@tauri-apps/api/window";

type ResizeDir = "North" | "South" | "East" | "West" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest";

const CURSOR_MAP: Record<ResizeDir, string> = {
  North: "n-resize",
  South: "s-resize",
  East: "e-resize",
  West: "w-resize",
  NorthEast: "ne-resize",
  NorthWest: "nw-resize",
  SouthEast: "se-resize",
  SouthWest: "sw-resize",
};

function ResizeHandle({ dir, className }: { dir: ResizeDir; className?: string }) {
  return (
    <div
      className={`resize-handle ${className ?? ""}`}
      style={{ cursor: CURSOR_MAP[dir] }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        getCurrentWindow().startResizeDragging(dir);
      }}
    />
  );
}

export default function ResizeHandles() {
  return (
    <>
      <ResizeHandle dir="North" className="rh-top" />
      <ResizeHandle dir="South" className="rh-bottom" />
      <ResizeHandle dir="West" className="rh-left" />
      <ResizeHandle dir="East" className="rh-right" />
      <ResizeHandle dir="NorthWest" className="rh-tl" />
      <ResizeHandle dir="NorthEast" className="rh-tr" />
      <ResizeHandle dir="SouthWest" className="rh-bl" />
      <ResizeHandle dir="SouthEast" className="rh-br" />
    </>
  );
}
