import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export type ListActionsItem = {
  label: string;
  onClick: () => void;
  variant?: "danger" | "normal";
};

type Props = {
  items: ListActionsItem[];
  id?: string;
};

/**
 * Actions dropdown for list tables. Renders the menu in a portal so it stays
 * visible when the table is inside a horizontal scroll container.
 */
export default function ListActionsDropdown({ items, id }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom,
      left: rect.left,
    });
  };

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    updatePosition();
    const scrollEl = triggerRef.current.closest(".list-page-table-scroll");
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    if (scrollEl) scrollEl.addEventListener("scroll", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (scrollEl) scrollEl.removeEventListener("scroll", onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const menu = document.getElementById(id || "list-actions-menu");
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, [open, id]);

  const menuId = id || "list-actions-menu";

  return (
    <>
      <div className="dropdown">
        <button
          ref={triggerRef}
          type="button"
          className="btn btn-sm btn-outline-secondary dropdown-toggle"
          onClick={() => {
            setOpen((prev) => {
              if (!prev) updatePosition();
              return !prev;
            });
          }}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls={menuId}
        >
          Actions
        </button>
      </div>

      {open &&
        position &&
        createPortal(
          <ul
            id={menuId}
            className="dropdown-menu show list-actions-dropdown-menu"
            role="menu"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 1055,
              minWidth: "8rem",
            }}
          >
            {items.map((item, i) => (
              <li key={i} role="none">
                <button
                  type="button"
                  className={`dropdown-item ${item.variant === "danger" ? "text-danger" : ""}`}
                  role="menuitem"
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}
