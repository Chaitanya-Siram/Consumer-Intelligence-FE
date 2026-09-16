import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { easeOut } from "@/components/motion/motion-primitives";
import { initialsColor } from "@/lib/initials-color";
import { MiniCalendar } from "./mini-calendar";

const fmtDate = (iso: string) => {
  if (!iso) return "dd/mm/yyyy";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const DATA_TYPES = [
  "Traditional",
  "Social",
  "Reviews",
  "Blogs",
  "Forums",
  "News",
  "Podcasts",
  "Video",
];
const TIMELINES = [
  "Past 1 week",
  "Past 1 month",
  "Past 3 months",
  "Past 6 months",
  "Past 1 year",
  "Custom",
];
const LOCATIONS = [
  "Global",
  "North America",
  "Europe",
  "APAC",
  "LATAM",
  "Middle East & Africa",
];

type PanelId = "data" | "timeline" | "location" | "api" | null;

/**
 * Builder nav rail. Tile 1 returns to dashboards; tiles 2–4 are master
 * settings — data sources, timeline and location — each opening a floating
 * popover. Selections are mock state the chat would use to scope analysis.
 */
export function BuilderNav({
  onExit,
  logo,
  monogram,
}: {
  onExit: () => void;
  logo?: string;
  monogram?: string;
}) {
  const [open, setOpen] = useState<PanelId>(null);
  const [dataTypes, setDataTypes] = useState<string[]>([
    "Traditional",
    "Social",
  ]);
  const [timeline, setTimeline] = useState("Past 1 month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [calField, setCalField] = useState<"start" | "end" | null>(null);
  const [locations, setLocations] = useState<string[]>(["Global"]);

  const toggle = (id: PanelId) => setOpen((o) => (o === id ? null : id));

  const toggleIn = (
    value: string,
    list: string[],
    set: (v: string[]) => void,
  ) =>
    set(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );

  return (
    <nav
      className={cn(
        "relative",
        "flex",
        "w-[var(--sense-nav-w)]",
        "shrink-0",
        "flex-col",
        "items-center",
        "justify-between",
        "py-[12px]",
      )}
    >
      {/* backdrop closes any open panel */}
      {open && (
        <button
          aria-label="Close settings"
          className={cn("fixed", "inset-0", "z-30", "cursor-default")}
          onClick={() => setOpen(null)}
        />
      )}

      {/* top: home + master settings */}
      <div className={cn("flex", "flex-col", "gap-[10px]")}>
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to dashboards"
          className={cn(
            "flex",
            "size-[40px]",
            "items-center",
            "justify-center",
            "overflow-hidden",
            "rounded-[6px]",
            "transition-transform",
            "hover:scale-105",
          )}
        >
          {logo ? (
            <img
              src={logo}
              alt=""
              className={cn("size-[40px]", "object-cover")}
            />
          ) : monogram ? (
            <span
              className={cn(
                "flex",
                "size-[40px]",
                "items-center",
                "justify-center",
                "rounded-[6px]",
                "text-[13px]",
                "font-semibold",
                "text-white",
              )}
              style={{ backgroundColor: initialsColor(monogram) }}
            >
              {monogram}
            </span>
          ) : (
            <img src="/ivlAlpha.gif" alt="" className="size-[40px]" />
          )}
        </button>

        <NavTile
          icon="database"
          label="Data type"
          active={open === "data"}
          onClick={() => toggle("data")}
        >
          <FilterPanel
            title="Data type"
            subtitle="Which content types the chat analyses"
            options={DATA_TYPES}
            values={dataTypes}
            multi
            onSelect={(v) => toggleIn(v, dataTypes, setDataTypes)}
          />
        </NavTile>

        <NavTile
          icon="date_range"
          label="Timeline"
          active={open === "timeline"}
          onClick={() => toggle("timeline")}
        >
          <FilterPanel
            title="Master timeline"
            subtitle="Window applied across all data"
            options={TIMELINES}
            values={[timeline]}
            onSelect={(v) => {
              setTimeline(v);
              if (v !== "Custom") setOpen(null);
            }}
            extra={
              timeline === "Custom" ? (
                <div
                  className={cn(
                    "mt-1",
                    "flex",
                    "flex-col",
                    "gap-2",
                    "border-t",
                    "px-2",
                    "pb-1",
                    "pt-3",
                  )}
                  style={{ borderColor: "var(--sense-hairline)" }}
                >
                  <DateField
                    label="Start"
                    value={customStart}
                    open={calField === "start"}
                    onToggle={() =>
                      setCalField((f) => (f === "start" ? null : "start"))
                    }
                  />
                  {calField === "start" && (
                    <MiniCalendar
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(iso) => {
                        setCustomStart(iso);
                        setCalField(null);
                      }}
                    />
                  )}

                  <DateField
                    label="End"
                    value={customEnd}
                    open={calField === "end"}
                    onToggle={() =>
                      setCalField((f) => (f === "end" ? null : "end"))
                    }
                  />
                  {calField === "end" && (
                    <MiniCalendar
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(iso) => {
                        setCustomEnd(iso);
                        setCalField(null);
                      }}
                    />
                  )}

                  <button
                    type="button"
                    disabled={!customStart || !customEnd}
                    onClick={() => setOpen(null)}
                    className={cn(
                      "mt-1",
                      "rounded-[8px]",
                      "bg-primary",
                      "px-3",
                      "py-2",
                      "type-caption",
                      "font-medium",
                      "text-primary-foreground",
                      "transition-colors",
                      "hover:bg-primary/90",
                      "disabled:opacity-40",
                    )}
                  >
                    Apply range
                  </button>
                </div>
              ) : null
            }
          />
        </NavTile>

        <NavTile
          icon="public"
          label="Location"
          active={open === "location"}
          onClick={() => toggle("location")}
        >
          <FilterPanel
            title="Location"
            subtitle="Filter data sources by region"
            options={LOCATIONS}
            values={locations}
            multi
            onSelect={(v) => toggleIn(v, locations, setLocations)}
          />
        </NavTile>
      </div>

      {/* bottom: utility + AI */}
      <div className={cn("flex", "flex-col", "gap-[10px]")}>
        <span
          aria-hidden
          className={cn(
            "flex",
            "size-[40px]",
            "items-center",
            "justify-center",
            "rounded-[6px]",
            "border",
            "border-[#f7f7f7]",
            "text-[#1c1c1c]",
          )}
        >
          <Icon name="forward" size={24} />
        </span>
        <span
          aria-hidden
          className={cn(
            "flex",
            "size-[40px]",
            "items-center",
            "justify-center",
            "rounded-[6px]",
            "border",
            "border-[#f7f7f7]",
            "text-[#1c1c1c]",
          )}
        >
          <Icon name="download" size={24} />
        </span>
        <div className="relative">
          <button
            type="button"
            aria-label="Data & API config"
            aria-expanded={open === "api"}
            onClick={() => toggle("api")}
            className={cn(
              "flex size-[40px] items-center justify-center rounded-[6px] border border-[#f7f7f7] text-[#1c1c1c] transition-colors hover:bg-[#f4f4f5]",
              open === "api" && "bg-[#f4f4f5]",
            )}
          >
            <Icon name="folder_managed" size={24} />
          </button>

          <AnimatePresence>
            {open === "api" && (
              <motion.div
                initial={{ opacity: 0, x: -6, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: easeOut }}
                className={cn(
                  "absolute",
                  "bottom-0",
                  "left-[calc(100%+12px)]",
                  "z-40",
                )}
              >
                <ApiPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

function NavTile({
  icon,
  label,
  active,
  onClick,
  children,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={active}
        onClick={onClick}
        className={cn(
          "flex size-[40px] items-center justify-center rounded-[6px] text-[#1c1c1c] transition-colors hover:bg-[#f4f4f5] hover:text-black",
          active ? "bg-[#f4f4f5]" : "bg-[var(--sense-tile)]",
        )}
      >
        <Icon name={icon} size={22} />
      </button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: easeOut }}
            className={cn(
              "absolute",
              "left-[calc(100%+12px)]",
              "top-0",
              "z-40",
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApiPanel() {
  const [sources, setSources] = useState<
    { id: string; name: string; icon: string; on: boolean; path?: string }[]
  >([
    { id: "alpha", name: "AlphaMetricx Data API", icon: "database", on: true },
    { id: "own", name: "Own Data Source API", icon: "database", on: true },
    {
      id: "folder",
      name: "Local Folder",
      icon: "folder",
      on: true,
      path: "~/InfoVision/tesla-media",
    },
  ]);
  const toggle = (id: string) =>
    setSources((s) => s.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  const remove = (id: string) =>
    setSources((s) => s.filter((x) => x.id !== id));
  const [menuId, setMenuId] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "w-80",
        "rounded-[14px]",
        "border",
        "bg-white",
        "p-2",
        "shadow-xl",
      )}
      style={{ borderColor: "var(--sense-hairline)" }}
    >
      <div className={cn("px-2", "pb-2", "pt-1")}>
        <p className={cn("type-caption", "font-semibold", "text-foreground")}>
          Data sources
        </p>
        <p className={cn("type-caption", "text-muted-foreground")}>
          Connected sources the chat pulls from
        </p>
      </div>
      <ul className={cn("flex", "flex-col")}>
        {sources.map((s) => (
          <li
            key={s.id}
            className={cn(
              "group",
              "flex",
              "items-center",
              "gap-1.5",
              "rounded-[8px]",
              "px-2",
              "py-2",
            )}
          >
            {/* leading icon swaps to a settings gear on hover (slide L→R) */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Configure ${s.name}`}
                onClick={() => setMenuId((m) => (m === s.id ? null : s.id))}
                className={cn(
                  "relative",
                  "flex",
                  "size-5",
                  "items-center",
                  "justify-center",
                  "overflow-hidden",
                )}
              >
                {/* source icon — slides out to the right */}
                <span
                  className={cn(
                    "absolute flex text-foreground transition-all duration-200",
                    menuId === s.id
                      ? "translate-x-2 opacity-0"
                      : "opacity-100 group-hover:translate-x-2 group-hover:opacity-0",
                  )}
                >
                  <Icon name={s.icon} size={16} />
                </span>
                {/* settings gear — slides in from the left */}
                <span
                  className={cn(
                    "absolute flex text-[#5b21b6] transition-all duration-200",
                    menuId === s.id
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  <Icon name="settings_applications" size={18} />
                </span>
              </button>

              <AnimatePresence>
                {menuId === s.id && (
                  <>
                    <button
                      aria-label="Close menu"
                      className={cn(
                        "fixed",
                        "inset-0",
                        "z-10",
                        "cursor-default",
                      )}
                      onClick={() => setMenuId(null)}
                    />
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.13 }}
                      className={cn(
                        "absolute",
                        "left-0",
                        "top-full",
                        "z-20",
                        "mt-1",
                        "w-44",
                        "overflow-hidden",
                        "rounded-[10px]",
                        "border",
                        "bg-white",
                        "p-1",
                        "shadow-lg",
                      )}
                      style={{ borderColor: "var(--sense-hairline)" }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setMenuId(null)}
                        className={cn(
                          "flex",
                          "w-full",
                          "items-center",
                          "gap-2",
                          "rounded-[8px]",
                          "px-2.5",
                          "py-2",
                          "type-caption",
                          "text-foreground",
                          "transition-colors",
                          "hover:bg-muted",
                        )}
                      >
                        <Icon name="tune" size={16} />
                        Reconfigure
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          remove(s.id);
                          setMenuId(null);
                        }}
                        className={cn(
                          "flex",
                          "w-full",
                          "items-center",
                          "gap-2",
                          "rounded-[8px]",
                          "px-2.5",
                          "py-2",
                          "type-caption",
                          "text-foreground",
                          "transition-colors",
                          "hover:bg-muted",
                        )}
                      >
                        <Icon
                          name={s.icon === "folder" ? "link_off" : "delete"}
                          size={16}
                        />
                        {s.icon === "folder"
                          ? "Remove access"
                          : "Delete connection"}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <span
              className={cn(
                "flex min-w-0 flex-1 flex-col transition-opacity",
                !s.on && "opacity-40",
              )}
            >
              <span
                className={cn("truncate", "type-caption", "text-foreground")}
              >
                {s.name}
              </span>
              {s.path && (
                <span
                  className={cn(
                    "truncate",
                    "type-caption",
                    "text-muted-foreground",
                  )}
                >
                  {s.path}
                </span>
              )}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={s.on}
              aria-label={`${s.on ? "Disconnect" : "Connect"} ${s.name}`}
              onClick={() => toggle(s.id)}
              className={cn(
                "flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors",
                s.on
                  ? "justify-end bg-[#16a34a]"
                  : "justify-start bg-muted-foreground/30",
              )}
            >
              <span
                className={cn(
                  "size-4",
                  "rounded-full",
                  "bg-white",
                  "shadow-sm",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={cn(
          "mt-0.5",
          "flex",
          "w-full",
          "items-center",
          "gap-2",
          "rounded-[8px]",
          "px-2",
          "py-2",
          "type-caption",
          "font-medium",
          "text-[var(--sense-violet,#6952c1)]",
          "transition-colors",
          "hover:bg-muted",
        )}
      >
        <Icon name="add" size={16} />
        Connect new API
      </button>
      <button
        type="button"
        className={cn(
          "flex",
          "w-full",
          "items-center",
          "gap-2",
          "rounded-[8px]",
          "px-2",
          "py-2",
          "type-caption",
          "font-medium",
          "text-[var(--sense-violet,#6952c1)]",
          "transition-colors",
          "hover:bg-muted",
        )}
      >
        <Icon name="create_new_folder" size={16} />
        Connect to folder
      </button>
    </div>
  );
}

function DateField({
  label,
  value,
  open,
  onToggle,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn("flex", "flex-col", "gap-1")}>
      <span className={cn("type-caption", "text-muted-foreground")}>
        {label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex items-center justify-between rounded-[8px] border px-2 py-1.5 type-caption transition-colors hover:bg-muted",
          value ? "text-foreground" : "text-muted-foreground",
        )}
        style={{
          borderColor: open
            ? "var(--sense-violet, #6952c1)"
            : "var(--sense-hairline)",
        }}
      >
        <span>{fmtDate(value)}</span>
        <Icon name="calendar_today" size={14} />
      </button>
    </div>
  );
}

function FilterPanel({
  title,
  subtitle,
  options,
  values,
  multi = false,
  onSelect,
  extra,
}: {
  title: string;
  subtitle: string;
  options: string[];
  values: string[];
  multi?: boolean;
  onSelect: (value: string) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-56",
        "rounded-[14px]",
        "border",
        "bg-white",
        "p-2",
        "shadow-xl",
      )}
      style={{ borderColor: "var(--sense-hairline)" }}
    >
      <div className={cn("px-2", "pb-2", "pt-1")}>
        <p className={cn("type-caption", "font-semibold", "text-foreground")}>
          {title}
        </p>
        <p className={cn("type-caption", "text-muted-foreground")}>
          {subtitle}
        </p>
      </div>
      <ul className={cn("flex", "flex-col")}>
        {options.map((opt) => {
          const selected = values.includes(opt);
          return (
            <li key={opt}>
              <button
                type="button"
                onClick={() => onSelect(opt)}
                className={cn(
                  "flex",
                  "w-full",
                  "items-center",
                  "justify-between",
                  "rounded-[8px]",
                  "px-2",
                  "py-2",
                  "type-caption",
                  "text-foreground",
                  "transition-colors",
                  "hover:bg-muted",
                )}
              >
                <span className={cn("flex", "items-center", "gap-2")}>
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-[5px] border",
                      multi ? "" : "rounded-full",
                      selected
                        ? "border-transparent bg-[var(--sense-violet,#6952c1)] text-white"
                        : "border-[color:var(--sense-hairline)]",
                    )}
                  >
                    {selected && <Icon name="check" size={12} />}
                  </span>
                  {opt}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {extra}
    </div>
  );
}
