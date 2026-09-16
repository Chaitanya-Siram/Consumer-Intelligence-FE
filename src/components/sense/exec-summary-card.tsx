import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@/components/ui/icon";
import { staggerItem } from "@/components/motion/motion-primitives";
import { Rich } from "@/utils/text.jsx";
import { cn } from "../../lib/utils";

/**
 * Executive Summary panel — #6952c1, 12px radius, fills its section height,
 * capped at 320px wide by the parent. Title 16px, body 13px, expand button.
 */
export function ExecSummaryCard({
  summary,
  bgImage,
  title = "Executive Summary",
}: {
  summary: string;
  bgImage?: string;
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const coverBg =
    bgImage ||
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80";

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = summary ? summary.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <motion.section
        variants={staggerItem}
        className={cn(
          "relative",
          "flex",
          "h-full",
          "flex-col",
          "justify-center",
          "gap-[16px]",
          "overflow-hidden",
          "rounded-[var(--sense-radius)]",
          "px-[20px]",
          "py-[32px]",
          "text-white",
          "transition-all",
          "shadow-sm",
          "hover:shadow-md",
          "group",
        )}
        style={{
          backgroundColor: "var(--sense-violet)",
        }}
      >
        <div className={cn("flex", "items-center", "justify-between")}>
          <h3 className={cn("type-title", "text-white", "font-bold")}>
            {title}
          </h3>
        </div>
        <div
          className={cn(
            "type-caption",
            "text-white/95",
            "text-xs",
            "leading-relaxed",
            "line-clamp-6",
            "overflow-hidden",
            "pr-1",
          )}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 6,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <Rich text={summary} lineHeight="1.8" />
        </div>
        <button
          type="button"
          aria-label="Expand summary"
          onClick={() => setIsOpen(true)}
          className={cn(
            "absolute",
            "bottom-[10px]",
            "right-[10px]",
            "flex",
            "items-center",
            "justify-center",
            "rounded-[8px]",
            "bg-white",
            "p-[8px]",
            "text-[var(--sense-violet)]",
            "transition-all",
            "hover:scale-110",
            "hover:shadow-lg",
            "active:scale-95",
            "cursor-pointer",
          )}
        >
          <Icon name="expand_content" size={20} />
        </button>
      </motion.section>

      {/* Bright, Modern Summary Popup Modal (Matching Reference Image 2) */}
      <AnimatePresence>
        {isOpen && (
          <div
            className={cn(
              "fixed",
              "inset-0",
              "z-50",
              "flex",
              "items-center",
              "justify-center",
              "p-4",
              "md:p-6",
              "sm:p-4",
            )}
          >
            {/* Light Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className={cn(
                "absolute",
                "inset-0",
                "bg-slate-900/40",
                "backdrop-blur-md",
              )}
            />

            {/* Bright White Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "relative",
                "z-10",
                "w-full",
                "max-w-2xl",
                "overflow-hidden",
                "rounded-2xl",
                "bg-white",
                "text-slate-900",
                "shadow-2xl",
                "border",
                "border-slate-100",
              )}
            >
              {/* Top Close Button on White Frame */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "absolute",
                  "top-4",
                  "right-4",
                  "z-20",
                  "p-1",
                  "w-6",
                  "h-6",
                  "text-slate-400",
                  "hover:text-slate-700",
                  "rounded-full",
                  "bg-white/90",
                  "hover:bg-white",
                  "shadow-sm",
                  "border",
                  "border-slate-100",
                  "transition-all",
                  // "active:scale-95",
                  "cursor-pointer",
                  "text-center",
                )}
                aria-label="Close modal"
              >
                <Icon name="close" size={14} />
              </button>

              {/* Top Hero Media Banner (Image 2 style purple/violet background with HD image) */}
              <div
                className={cn(
                  "relative",
                  "h-44",
                  "md:h-52",
                  "w-full",
                  "overflow-hidden",
                  "flex",
                  "items-center",
                  "justify-center",
                  "p-6",
                )}
                style={{ background: "var(--sense-overlay" }}
              >
                <div
                  className={cn(
                    "absolute",
                    "inset-0",
                    "bg-cover",
                    "bg-center",
                    "opacity-40",
                    "mix-blend-overlay",
                    "transition-transform",
                    "duration-700",
                    "hover:scale-105",
                  )}
                  style={{ backgroundImage: `url("${coverBg}")` }}
                />
                <div
                  className={cn(
                    "absolute",
                    "inset-0",
                    "bg-gradient-to-t",
                    "from-black/40",
                    "via-transparent",
                    "to-black/10",
                  )}
                />

                {/* Hero Banner Header Badge & Overlay Title */}
                <div
                  className={cn(
                    "relative",
                    "z-10",
                    "text-center",
                    "flex",
                    "flex-col",
                    "items-center",
                    "gap-2",
                    "max-w-lg",
                  )}
                >
                  {/* <span className={cn('px-3', 'py-1', 'text-xs', 'font-black', 'uppercase', 'tracking-wider', 'rounded-full', 'bg-white/20', 'backdrop-blur-md', 'text-white', 'border', 'border-white/30', 'shadow-sm', 'flex', 'items-center', 'gap-1.5')}>
                    <span className={cn('w-2', 'h-2', 'rounded-full', 'bg-emerald-400', 'animate-pulse')} />
                    Executive Briefing
                  </span> */}
                  <h2
                    className={cn(
                      "text-2xl",
                      "md:text-3xl",
                      "font-black",
                      "text-white",
                      "drop-shadow-md",
                      "tracking-tight",
                    )}
                  >
                    {title}
                  </h2>
                  <div
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-3",
                      "text-xs",
                      "text-white/90",
                      "font-medium",
                    )}
                  >
                    <span>⏱ {readTime} min read</span>
                    <span>•</span>
                    <span>{wordCount} words</span>
                  </div>
                </div>
              </div>

              {/* Bottom Bright Content Area */}
              <div
                className={cn(
                  "p-6",
                  "md:p-8",
                  "flex",
                  "flex-col",
                  "gap-6",
                  "bg-white",
                )}
              >
                {/* Summary Body */}
                <div
                  className={cn(
                    "max-h-[45vh]",
                    "overflow-y-auto",
                    "pr-2",
                    "text-slate-700",
                    "text-sm",
                    "leading-relaxed",
                    "font-normal",
                    "space-y-3",
                    "custom-scrollbar",
                  )}
                >
                  <Rich text={summary} />
                </div>

                {/* Action Footer matching Image 2 */}
                <div
                  className={cn(
                    "flex",
                    "flex-col",
                    "sm:flex-row",
                    "items-center",
                    "justify-between",
                    "gap-3",
                    "border-t",
                    "border-slate-100",
                    "pt-5",
                  )}
                >
                  <div
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2",
                      "text-xs",
                      "text-slate-500",
                      "font-medium",
                    )}
                  >
                    <Icon
                      name="auto_awesome"
                      size={18}
                      className="text-violet-600"
                    />
                    <span>Real-time Strategic Insights</span>
                  </div>

                  <div
                    className={cn(
                      "flex",
                      "items-center",
                      "gap-2.5",
                      "w-full",
                      "sm:w-auto",
                    )}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={cn(
                        "flex-1",
                        "sm:flex-initial",
                        "px-4",
                        "py-2.5",
                        "text-xs",
                        "font-bold",
                        "rounded-xl",
                        "bg-slate-100",
                        "hover:bg-slate-200",
                        "text-slate-700",
                        "transition-all",
                        "flex",
                        "items-center",
                        "justify-center",
                        "gap-1.5",
                        "active:scale-95",
                        "cursor-pointer",
                      )}
                    >
                      <Icon
                        name={copied ? "check" : "content_copy"}
                        size={16}
                      />
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex-1",
                        "sm:flex-initial",
                        "px-6",
                        "py-2.5",
                        "text-xs",
                        "font-extrabold",
                        "rounded-xl",
                        "bg-violet-600",
                        "hover:bg-violet-700",
                        "text-white",
                        "transition-all",
                        "shadow-md",
                        "hover:shadow-lg",
                        "active:scale-95",
                        "cursor-pointer",
                      )}
                    >
                      Close Summary
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
