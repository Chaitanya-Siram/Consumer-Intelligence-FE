import { useState, useEffect } from "react";
import { resolvePexelsMedia, resolvePexelsVideoUrl, isColorRequest, parseCssColor } from "../api/pexels.js";

const cardStyleOverrides = new Map();
const chartColorOverrides = new Map();
let storyboardBgOverride = null;

function isVideoUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.includes("pexels.com/download/video") ||
    lower.includes("pexels.com/video") ||
    lower.includes("video_files") ||
    lower.includes("/video/")
  );
}

function applyDomCardStyles(chart_title_or_id, styleData) {
  if (typeof document === "undefined") return;
  const { background_color, border_color, text_color, video_url, image_url, background_type } =
    styleData || {};
  const actualVideoUrl =
    video_url || (isVideoUrl(background_color) ? background_color : null);
  const actualImageUrl = image_url || (background_type === "image" ? background_color : null);

  setTimeout(() => {
    try {
      const cards = document.querySelectorAll(
        ".chartcard, .t4-card, .chart-card, [class*='card']",
      );
      cards.forEach((cardEl) => {
        const titleEl = cardEl.querySelector(
          "h3, .chartcard__title, .t4-card-title, [class*='title']",
        );
        const titleText = titleEl?.textContent || "";
        if (titleText) {
          const cleanTitle = titleText.toLowerCase().trim();
          const cleanTarget = String(chart_title_or_id).toLowerCase().trim();
          const cleanTargetAlpha = cleanTarget.replace(/[^a-z0-9]/g, "");
          const cleanTitleAlpha = cleanTitle.replace(/[^a-z0-9]/g, "");

          if (
            cleanTarget === "all" ||
            cleanTitle.includes(cleanTarget) ||
            cleanTarget.includes(cleanTitle) ||
            (cleanTargetAlpha &&
              cleanTitleAlpha.includes(cleanTargetAlpha)) ||
            (cleanTargetAlpha && cleanTargetAlpha.includes(cleanTitleAlpha))
          ) {
            cardEl.style.setProperty("position", "relative", "important");
            cardEl.style.setProperty("overflow", "hidden", "important");

            // Clear legacy background layers
            const existingVideo = cardEl.querySelector(".card-bg-video");
            if (existingVideo) existingVideo.remove();
            cardEl.style.removeProperty("background-image");

            if (actualVideoUrl || background_type === "video") {
              cardEl.style.setProperty(
                "background",
                "rgba(15, 23, 42, 0.8)",
                "important",
              );
              if (actualVideoUrl) {
                const vid = document.createElement("video");
                vid.className = "card-bg-video";
                vid.autoplay = true;
                vid.loop = true;
                vid.muted = true;
                vid.playsInline = true;
                vid.src = actualVideoUrl;
                vid.style.cssText =
                  "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.45;pointer-events:none;z-index:0;filter:brightness(0.75) contrast(1.1);";
                cardEl.insertBefore(vid, cardEl.firstChild);
              }
            } else if (actualImageUrl || background_type === "image") {
              const bgImg = actualImageUrl || background_color;
              if (bgImg && typeof bgImg === "string" && bgImg.startsWith("http")) {
                cardEl.style.setProperty("background-image", `url("${bgImg}")`, "important");
                cardEl.style.setProperty("background-size", "cover", "important");
                cardEl.style.setProperty("background-position", "center", "important");
              }
            } else if (background_color) {
              const parsedColor = parseCssColor(background_color);
              cardEl.style.setProperty(
                "background",
                parsedColor,
                "important",
              );
            }

            if (text_color) {
              const parsedTextColor = parseCssColor(text_color, true);
              cardEl.style.setProperty("color", parsedTextColor, "important");
              cardEl
                .querySelectorAll("h3, p, span, div, button, text, tspan")
                .forEach((el) => {
                  el.style.setProperty("color", parsedTextColor, "important");
                  if (el.tagName === "text" || el.tagName === "tspan") {
                    el.setAttribute("fill", parsedTextColor);
                    el.style.setProperty("fill", parsedTextColor, "important");
                  }
                });
            }

            if (border_color) {
              cardEl.style.setProperty(
                "border-color",
                border_color,
                "important",
              );
            }
          }
        }
      });
    } catch (err) {
      console.warn("[designAgent] DOM direct style error:", err);
    }
  }, 50);
}

if (typeof window !== "undefined") {
  // 1. Chart card container / background style
  window.addEventListener("update_chart_card_style", async (e) => {
    const detail = e.detail || {};
    const { chart_title_or_id, background_color, text_color, video_url, image_url, background_type } =
      detail;

    const rawTarget =
      image_url ||
      video_url ||
      background_color ||
      detail.query ||
      detail.explanation ||
      "";

    let mediaType = background_type || "auto";

    if (
      !video_url &&
      !image_url &&
      rawTarget &&
      typeof rawTarget === "string"
    ) {
      const media = await resolvePexelsMedia(rawTarget, mediaType);
      if (media.type === "color" && media.url) {
        detail.background_color = media.url;
        detail.background_type = "color";
        delete detail.video_url;
        delete detail.image_url;
      } else if (media.type === "video" && media.url) {
        detail.video_url = media.url;
        detail.background_type = "video";
      } else if (media.type === "image" && media.url) {
        detail.image_url = media.url;
        detail.background_type = "image";
      }
    }

    if (chart_title_or_id) {
      const existing = cardStyleOverrides.get(String(chart_title_or_id).toLowerCase().trim()) || {};
      const mergedDetail = { ...existing, ...detail };
      if (text_color) mergedDetail.text_color = parseCssColor(text_color, true);

      const targets =
        String(chart_title_or_id).toLowerCase() === "all"
          ? ["all"]
          : [
              String(chart_title_or_id).toLowerCase().trim(),
              String(chart_title_or_id)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, ""),
            ];

      targets.forEach((k) => cardStyleOverrides.set(k, mergedDetail));
      window.dispatchEvent(new Event("design_agent_updated"));

      applyDomCardStyles(chart_title_or_id, mergedDetail);
    }
  });

  // 2. Inner chart series / line / bar color
  window.addEventListener("update_chart_style", (e) => {
    const { chart_title_or_id, color } = e.detail || {};
    if (chart_title_or_id && color) {
      const targets =
        String(chart_title_or_id).toLowerCase() === "all"
          ? ["all"]
          : [
              String(chart_title_or_id).toLowerCase().trim(),
              String(chart_title_or_id)
                .toLowerCase()
                .replace(/[^a-z0-9]/g, ""),
            ];
      targets.forEach((k) => chartColorOverrides.set(k, color));
      window.dispatchEvent(new Event("design_agent_updated"));
    }
  });

  // 3. Storyboard / dashboard page background (color, gradient, image, video)
  window.addEventListener("update_storyboard_background", async (e) => {
    const detail = e.detail || {};
    if (
      detail.background_type === "video" ||
      detail.image_or_video_url?.includes("pexels")
    ) {
      const directVideo = await resolvePexelsVideoUrl(
        detail.image_or_video_url || "business technology",
      );
      if (directVideo) detail.image_or_video_url = directVideo;
    }
    storyboardBgOverride = detail;
    window.dispatchEvent(new Event("design_agent_updated"));
  });
}

export function useDesignAgentUpdate() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("design_agent_updated", handler);
    return () => window.removeEventListener("design_agent_updated", handler);
  }, []);
}

export function getCardStyleOverride(titleOrId) {
  if (!titleOrId) return cardStyleOverrides.get("all") || null;
  const key = String(titleOrId).toLowerCase().trim();
  const cleanKey = key.replace(/[^a-z0-9]/g, "");

  if (cardStyleOverrides.has(key)) return cardStyleOverrides.get(key);
  if (cardStyleOverrides.has(cleanKey)) return cardStyleOverrides.get(cleanKey);

  for (const [mapKey, overrideVal] of cardStyleOverrides.entries()) {
    if (mapKey === "all") continue;
    if (
      key.includes(mapKey) ||
      mapKey.includes(key) ||
      cleanKey.includes(mapKey) ||
      mapKey.includes(cleanKey)
    ) {
      return overrideVal;
    }
  }

  return cardStyleOverrides.get("all") || null;
}

export function getChartColorOverride(titleOrId) {
  if (!titleOrId) return chartColorOverrides.get("all") || null;
  const key = String(titleOrId).toLowerCase().trim();
  const cleanKey = key.replace(/[^a-z0-9]/g, "");

  if (chartColorOverrides.has(key)) return chartColorOverrides.get(key);
  if (chartColorOverrides.has(cleanKey)) return chartColorOverrides.get(cleanKey);

  for (const [mapKey, colorVal] of chartColorOverrides.entries()) {
    if (mapKey === "all") continue;
    if (
      key.includes(mapKey) ||
      mapKey.includes(key) ||
      cleanKey.includes(mapKey) ||
      mapKey.includes(cleanKey)
    ) {
      return colorVal;
    }
  }

  return chartColorOverrides.get("all") || null;
}

export function getStoryboardBgOverride() {
  return storyboardBgOverride;
}
