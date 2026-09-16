/**
 * Brand logos and platform/domain favicons on Chart.js labels — every chart, once.
 *
 * DOM lists render a <BrandLogo>/<PlatformIcon> next to a name, but a Chart.js
 * chart paints its category labels and legend as canvas text, so no <img> can
 * ever appear there: "Channel Distribution", share-of-voice bars, the leaders
 * legend all showed bare names. Rather than patching each chart, this plugin is
 * registered globally: for any category-axis label or bar legend entry it
 * resolves an icon — a brand logo from the charts payload the Create Dashboard
 * step already resolved (see `registerBrandLogos`, fed by nav.js's seedCharts),
 * or a platform/domain favicon via PlatformIcon's resolver — and draws it beside
 * the text. Charts opt out with `plugins: { axisIcons: false }` or supply their
 * own map with `plugins: { axisIcons: { logos } }`.
 *
 * Labels that get an icon are padded (two em spaces on a vertical axis, an
 * empty first line on a horizontal one) so the icon sits in space Chart.js has
 * already laid out — no scale-size hacking. Registered against `chart.js/auto`'s
 * Chart, which is the same instance react-chartjs-2 draws with.
 */
import Chart from "chart.js/auto";
import { platformLogoUrl } from "./PlatformIcon.jsx";

const PAD = "  ";
const MAX_ICON = 16;

const brandLogos = new Map();

/** Register every `meta.logos` map in a charts payload (any lens). */
export function registerBrandLogos(chartsData) {
  if (!chartsData || typeof chartsData !== "object") return;
  for (const story of Object.values(chartsData)) {
    const logos = story?.meta?.logos;
    if (!logos || typeof logos !== "object") continue;
    for (const [brand, url] of Object.entries(logos)) {
      if (brand && url) brandLogos.set(brand.trim().toLowerCase(), url);
    }
  }
}

/** The registered logo URL for a brand name, or null. */
export function brandLogoUrl(name) {
  return brandLogos.get(String(name ?? "").trim().toLowerCase()) || null;
}

function labelText(label) {
  const raw = Array.isArray(label) ? label[label.length - 1] : label;
  return String(raw ?? "").replace(PAD, "").trim();
}

function iconFor(label, explicit) {
  const text = labelText(label);
  if (!text) return null;
  if (explicit && explicit[text]) return explicit[text];
  const brand = brandLogos.get(text.toLowerCase());
  if (brand) return brand;
  return platformLogoUrl(text);
}

const images = new Map();
const waiting = new Map();

function getImage(url, chart) {
  let img = images.get(url);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const charts = waiting.get(url) || new Set();
      waiting.delete(url);
      charts.forEach((c) => {
        if (Chart.instances[c.id]) c.update("none");
      });
    };
    img.onerror = () => {
      img.failed = true;
    };
    img.src = url;
    images.set(url, img);
  }
  if (!img.complete || !img.naturalWidth) {
    if (!img.failed) {
      if (!waiting.has(url)) waiting.set(url, new Set());
      waiting.get(url).add(chart);
    }
    return null;
  }
  return img;
}

function settings(chart) {
  const opt = chart.options?.plugins?.axisIcons;
  return opt === false ? null : opt || {};
}

function padLabels(chart, explicit) {
  const rawScales = chart.config.options.scales || (chart.config.options.scales = {});
  for (const [id, scale] of Object.entries(chart.scales)) {
    if (scale.type !== "category") continue;
    if (!scale.getLabels().some((label) => iconFor(label, explicit))) continue;

    const raw = rawScales[id] || (rawScales[id] = {});
    const ticks = raw.ticks || (raw.ticks = {});
    if (ticks.callback?.axisIcons) continue;
    const previous = ticks.callback;
    const callback = function (value, index, all) {
      const label = previous ? previous.call(this, value, index, all) : this.getLabelForValue(value);
      if (!iconFor(label, explicit)) return label;
      return this.isHorizontal() ? ["", label] : PAD + label;
    };
    callback.axisIcons = true;
    ticks.callback = callback;
    // The resolved options for this update may already be built; set both so
    // the first render pads too, not just the next.
    try {
      scale.options.ticks.callback = callback;
    } catch {
      /* resolver refused the write — the raw option covers the next update */
    }
  }
}

function legendIcons(chart, explicit) {
  if (chart.config.type !== "bar") return;
  if (!chart.options?.plugins?.legend?.labels?.usePointStyle) return;
  for (const dataset of chart.data.datasets) {
    const url = iconFor(dataset.label, explicit);
    if (!url) continue;
    const img = getImage(url, chart);
    if (img && dataset.pointStyle !== img) dataset.pointStyle = img;
  }
}

function drawIcons(chart, explicit) {
  const { ctx } = chart;
  for (const scale of Object.values(chart.scales)) {
    if (scale.type !== "category") continue;
    const items = scale.getLabelItems ? scale.getLabelItems() : scale._labelItems || [];
    for (const item of items) {
      const url = iconFor(item.label, explicit);
      if (!url) continue;
      const img = getImage(url, chart);
      if (!img) continue;
      const fontSize = item.font?.size || 11;
      const size = Math.min(MAX_ICON, Math.max(12, fontSize + 5));
      const [x, y] = item.options.translation;
      ctx.save();
      if (scale.isHorizontal()) {
        ctx.drawImage(img, x - size / 2, y + (item.textOffset || 0), size, size);
      } else {
        ctx.font = item.font?.string || ctx.font;
        const first = Array.isArray(item.label) ? item.label[0] : item.label;
        const width = ctx.measureText(String(first)).width;
        const align = item.options.textAlign;
        const start = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
        ctx.drawImage(img, start, y - size / 2, size, size);
      }
      ctx.restore();
    }
  }
}

const axisIcons = {
  id: "axisIcons",
  beforeUpdate(chart) {
    const opt = settings(chart);
    if (!opt) return;
    padLabels(chart, opt.logos);
    legendIcons(chart, opt.logos);
  },
  afterDraw(chart) {
    const opt = settings(chart);
    if (!opt) return;
    drawIcons(chart, opt.logos);
  },
};

Chart.register(axisIcons);

export default axisIcons;
