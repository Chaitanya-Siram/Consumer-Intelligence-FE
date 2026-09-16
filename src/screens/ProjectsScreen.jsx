import { useCallback, useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../api/projects.js";
import ProjectCard from "../components/ProjectCard.jsx";
import AddProjectModal from "../components/AddProjectModal.jsx";
import EditProjectModal from "../components/EditProjectModal.jsx";
import { PlusIcon, SearchIcon } from "../components/Icons.jsx";
import { useNavigate } from "react-router-dom";
import { useThemes } from "../store/useThemes.js";
import { toast } from "react-hot-toast";
import NetworkBg from "../components/backgrounds/NetworkBg.jsx";
import PaintVideoBg from "../components/backgrounds/PaintVideoBg.jsx";
import ShaderBg from "../components/backgrounds/ShaderBg.jsx";
import { cn } from "../lib/utils";

const Icons = {
  Plus: PlusIcon,
  Search: SearchIcon,
};

const VIDEO_SRC = {
  "paint-water":
    "https://videos.pexels.com/video-files/7565817/7565817-hd_2048_1080_25fps.mp4",
  "abstract-art":
    "https://videos.pexels.com/video-files/4153410/4153410-hd_1920_1080_25fps.mp4",
  "paint-underwater":
    "https://videos.pexels.com/video-files/7565833/7565833-hd_2048_1080_25fps.mp4",
};

const BG_THEMES = [
  { id: "gallery", label: "Profile Gallery (Default)" },
  { id: "shader", label: "Signal Grid" },
  { id: "network", label: "Network Intelligence" },
  { id: "aurora", label: "Aurora Mesh" },
  { id: "paint-water", label: "Paint in Water" },
  { id: "abstract-art", label: "Abstract Art" },
  { id: "paint-underwater", label: "Paint Underwater" },
];

export default function ProjectsScreen({ onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [bgTheme, setBgTheme] = useState(() => {
    if (typeof window === "undefined") return "gallery";
    return localStorage.getItem("projects_bg_theme") || "gallery";
  });
  const navigate = useNavigate();
  const { dark } = useThemes();

  useEffect(() => {
    localStorage.setItem("projects_bg_theme", bgTheme);
  }, [bgTheme]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    const created = await createProject(payload);
    setProjects((prev) => [created, ...prev]);
    setModalOpen(false);
  }

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);

  function handleDeleteClick(project) {
    setProjectToDelete(project);
  }

  function handleEditClick(project) {
    setProjectToEdit(project);
  }

  async function handleEditSubmit(id, { name, description }) {
    try {
      const updated = await updateProject(id, { name, description });
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(`Project "${updated.name}" updated.`);
      setProjectToEdit(null);
    } catch (err) {
      toast.error(`Could not update project: ${err.message}`);
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (!projectToDelete) return;
    const prev = projects;
    setProjects((p) => p.filter((x) => x.id !== projectToDelete.id));
    try {
      await deleteProject(projectToDelete.id);
      toast.success(`Project "${projectToDelete.name}" deleted.`);
    } catch (err) {
      setProjects(prev);
      toast.error(`Could not delete project: ${err.message}`);
    } finally {
      setProjectToDelete(null);
    }
  }

  const filteredProjects = projects.filter((project) =>
    (project.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen bg-transparent" data-bgtheme={bgTheme}>
      {/* Dynamic Background */}
      {bgTheme === "gallery" && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/gallery-bg.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <img
            src="/gradient-bar.png"
            alt=""
            className="absolute bottom-0 left-0 w-full z-[1]"
          />
        </div>
      )}
      {bgTheme === "shader" && (
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-white via-purple-50 to-indigo-50">
          <ShaderBg intensity={150} speed={0.4} dark={false} />
        </div>
      )}
      {bgTheme === "network" && <NetworkBg />}
      {bgTheme === "aurora" && (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-100 via-purple-100 to-teal-50" />
      )}
      {VIDEO_SRC[bgTheme] && <PaintVideoBg src={VIDEO_SRC[bgTheme]} />}

      {/* Main Foreground Container */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 py-8">
        {/* Header Title & Controls Toolbar */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/20 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Workspace Projects
            </h1>
            <p className="mt-2 inline-block rounded-full border border-white/80 bg-white/60 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-md">
              Deploy and run intelligence dashboards or import new datasets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input Field */}
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Icons.Search size={14} color="#64748b" />
              </span>
              <input
                className="h-9 w-60 rounded-full border border-white/80 bg-white/70 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs backdrop-blur-md outline-none transition-all hover:bg-white focus:w-68 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Workflow Studio Button */}
            <button
              className="flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("/workflow-studio")}
              title="Open AI Agent Workflow Studio"
            >
              <span>✨ Workflow Studio</span>
            </button>

            {/* New Project Action Button */}
            <button
              className="flex h-9 items-center gap-2 rounded-full bg-indigo-600 px-4 text-xs font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-indigo-700 active:scale-[0.98]"
              onClick={() => navigate("/new/workflow")}
            >
              <Icons.Plus size={14} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading && <GridSkeleton />}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center backdrop-blur-md">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              className="mt-4 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-hover hover:bg-red-700"
              onClick={load}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/80 bg-white/60 p-12 text-center shadow-sm backdrop-blur-md">
            <p className="text-base font-semibold text-slate-700">
              No projects yet. Create your first one to get started.
            </p>
            <button
              className="mt-4 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700"
              onClick={() => navigate("/new/workflow")}
            >
              <PlusIcon width={16} height={16} />
              <span>Add New Project</span>
            </button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onOpen={onOpenProject}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
              />
            ))}

            {/* Add New Project Card */}
            <button
              className="group flex min-h-[210px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300/80 bg-white/40 p-6 backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500 hover:bg-white/70 hover:shadow-md"
              onClick={() => navigate("/new/workflow")}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-xs transition-transform group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white">
                <PlusIcon width={20} height={20} />
              </span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                Add New Project
              </span>
            </button>
          </div>
        )}

        {/* Footer info line */}
        {!loading && !error && (
          <footer className="mt-12 flex items-center justify-between border-t border-slate-200/40 pt-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                WORKSPACE
              </span>
              <span>
                {projects.length} projects · synced with AlphaMetricx API
              </span>
            </div>
          </footer>
        )}

        {modalOpen && (
          <AddProjectModal
            onClose={() => setModalOpen(false)}
            onCreate={handleCreate}
          />
        )}
        {projectToEdit && (
          <EditProjectModal
            project={projectToEdit}
            onClose={() => setProjectToEdit(null)}
            onSubmit={handleEditSubmit}
          />
        )}
        {projectToDelete && (
          <ConfirmDeleteModal
            project={projectToDelete}
            onClose={() => setProjectToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[210px] animate-pulse rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md"
        />
      ))}
    </div>
  );
}

function ConfirmDeleteModal({ project, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">
          Delete Project?
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">{project.name}</strong>? This
          action cannot be undone.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
