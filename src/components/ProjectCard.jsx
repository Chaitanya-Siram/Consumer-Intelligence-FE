import { ArrowRightIcon, TrashIcon, tileFor, EditIcon } from "./Icons.jsx";

export default function ProjectCard({ project, index, onOpen, onDelete, onEdit }) {
  const { bg, fg, Icon } = tileFor(index);
  const number = String(index + 1).padStart(2, "0");

  return (
    <article
      className="group relative flex flex-col justify-between rounded-2xl bg-white/80 hover:bg-white/95 border border-white/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer min-h-[210px]"
      onClick={() => onOpen?.(project)}
      role="button"
      tabIndex={index}
      id={`project-card-${index}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(project);
        }
      }}
    >
      <div>
        <header className="flex items-center justify-between mb-4">
          <span
            className="flex size-10 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: bg, color: fg }}
          >
            <Icon width={18} height={18} />
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold tracking-wider text-slate-400/80 mr-1">
              {number}
            </span>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-lg bg-white/70 hover:bg-white text-slate-500 hover:text-slate-900 border border-slate-200/50 shadow-xs transition-colors"
              aria-label={`Edit ${project.name}`}
              title="Edit project"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(project);
              }}
            >
              <EditIcon width={13} height={13} />
            </button>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-lg bg-white/70 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200/50 shadow-xs transition-colors"
              aria-label={`Delete ${project.name}`}
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(project);
              }}
            >
              <TrashIcon width={13} height={13} />
            </button>
          </div>
        </header>

        <div className="space-y-1.5">
          <h3 className="text-[16px] font-bold tracking-tight text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
            {project.name}
          </h3>
          <p className="text-[13px] leading-relaxed text-slate-600 line-clamp-2 font-normal">
            {project.description || "No description provided"}
          </p>
        </div>
      </div>

      <footer className="mt-5 flex items-center justify-between border-t border-slate-200/60 pt-3.5">
        <span className="text-[13px] font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
          Open project
        </span>
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200 transform group-hover:translate-x-0.5">
          <ArrowRightIcon width={14} height={14} />
        </span>
      </footer>
    </article>
  );
}
