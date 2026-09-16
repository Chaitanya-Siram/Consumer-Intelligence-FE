import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export default function ProviderSelectDropdown({
  activeProviders = {},
  activeSources = [],
  onChangeSources,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const providerEntries = Object.entries(activeProviders);
  const totalProviders = providerEntries.length;
  const allSourceIds = providerEntries.map(([, sourceId]) => sourceId);

  // Check if all available providers are selected
  const allSelected =
    totalProviders > 0 &&
    allSourceIds.every((id) => activeSources.includes(id));

  const someSelected =
    activeSources.length > 0 && !allSelected;

  const handleToggleSource = (sourceId) => {
    let newSources;
    if (activeSources.includes(sourceId)) {
      newSources = activeSources.filter((s) => s !== sourceId);
    } else {
      newSources = [...activeSources, sourceId];
    }
    onChangeSources(newSources);
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      // Deselect all
      onChangeSources([]);
    } else {
      // Select all unique source IDs from activeProviders
      const uniqueSources = Array.from(
        new Set([...activeSources, ...allSourceIds])
      );
      onChangeSources(uniqueSources);
    }
  };

  // Label text for trigger button
  const getTriggerLabel = () => {
    if (activeSources.length === 0) {
      return "Select Data Provider...";
    }
    if (allSelected && totalProviders > 1) {
      return `All Data Providers Selected (${activeSources.length})`;
    }
    if (activeSources.length === 1) {
      const match = providerEntries.find(([, id]) => id === activeSources[0]);
      return match ? match[0] : "1 Data Provider Selected";
    }
    return `${activeSources.length} Data Providers Selected`;
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={cn(
          "wfinput flex items-center justify-between w-full cursor-pointer select-none transition-all duration-150 text-left",
          isOpen &&
            "border-[var(--accent-a)] ring-2 ring-[color-mix(in_srgb,var(--accent-a)_15%,transparent)]"
        )}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="truncate font-medium text-[13.5px]">
            {getTriggerLabel()}
          </span>
          {activeSources.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[color-mix(in_srgb,var(--accent-a)_15%,transparent)] text-[var(--accent-a)] border border-[color-mix(in_srgb,var(--accent-a)_30%,transparent)]">
              {activeSources.length}
            </span>
          )}
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-[var(--text-soft)] transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180 text-[var(--accent-a)]"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--panel)_95%,transparent)] backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            boxShadow:
              "0 12px 32px -4px rgba(0,0,0,0.25), 0 4px 12px -2px rgba(0,0,0,0.15)",
          }}
        >
          {/* Select All Option Header (Shown if totalProviders > 1) */}
          {totalProviders > 1 && (
            <div className="p-2 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-2)_40%,transparent)]">
              <button
                type="button"
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--accent-a)_10%,transparent)] transition-colors cursor-pointer select-none"
                onClick={handleSelectAllToggle}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-4 h-4 rounded flex items-center justify-center border transition-all duration-150",
                      allSelected
                        ? "bg-[var(--accent-a)] border-[var(--accent-a)] text-white shadow-sm"
                        : someSelected
                        ? "bg-[color-mix(in_srgb,var(--accent-a)_20%,transparent)] border-[var(--accent-a)] text-[var(--accent-a)]"
                        : "border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)]"
                    )}
                  >
                    {allSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {someSelected && !allSelected && (
                      <div className="w-2 h-0.5 bg-[var(--accent-a)] rounded-full" />
                    )}
                  </div>
                  <span>{allSelected ? "Deselect All" : "Select All"}</span>
                </div>
                <span className="text-[11px] text-[var(--text-soft)] font-normal">
                  {activeSources.length} of {totalProviders} selected
                </span>
              </button>
            </div>
          )}

          {/* List of Data Provider Options */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {providerEntries.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--text-soft)] text-center italic">
                No data providers available
              </div>
            ) : (
              providerEntries.map(([displayName, sourceId]) => {
                const isSelected = activeSources.includes(sourceId);
                return (
                  <label
                    key={sourceId}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors select-none",
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--accent-a)_12%,transparent)] text-[var(--text)] font-semibold"
                        : "text-[var(--text-soft)] hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)] hover:text-[var(--text)]"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleSource(sourceId);
                    }}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={cn(
                          "w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 shrink-0",
                          isSelected
                            ? "bg-[var(--accent-a)] border-[var(--accent-a)] text-white shadow-sm"
                            : "border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface-2)_80%,transparent)]"
                        )}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{displayName}</span>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--accent-a)_20%,transparent)] text-[var(--accent-a)]">
                        Selected
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>

          {/* Quick Actions Footer (e.g. Clear selection) */}
          {activeSources.length > 0 && (
            <div className="p-1.5 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-2)_20%,transparent)] flex justify-end">
              <button
                type="button"
                className="px-2 py-1 text-[11px] font-medium text-[var(--text-soft)] hover:text-[var(--neg)] hover:bg-[color-mix(in_srgb,var(--neg)_10%,transparent)] rounded transition-colors"
                onClick={() => onChangeSources([])}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
