"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { AspectRatio } from "./types";
import { prepareSlideCapture } from "./carousel-content-fit";
import { slideFontEmbedCss } from "./carousel-export-fonts";

export function getExportDimensions(aspectRatio: AspectRatio): {
  width: number;
  height: number;
} {
  return aspectRatio === "4:5"
    ? { width: 1080, height: 1350 }
    : { width: 1080, height: 1080 };
}

export async function exportSlidesAsPng(
  slideElements: HTMLElement[],
  baseFileName: string,
  aspectRatio: AspectRatio
): Promise<void> {
  const { width, height } = getExportDimensions(aspectRatio);

  await prepareSlideCapture(slideElements);

  for (let i = 0; i < slideElements.length; i++) {
    const el = slideElements[i];
    const dataUrl = await toPng(el, {
      fontEmbedCSS: await slideFontEmbedCss(el),
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = `${baseFileName}-slide-${String(i + 1).padStart(2, "0")}.png`;
    link.href = dataUrl;
    link.click();

    await new Promise((r) => setTimeout(r, 140));
  }
}

export async function exportSlidesAsPdf(
  slideElements: HTMLElement[],
  baseFileName: string,
  aspectRatio: AspectRatio
): Promise<void> {
  const { width, height } = getExportDimensions(aspectRatio);

  await prepareSlideCapture(slideElements);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling"],
  });

  for (let i = 0; i < slideElements.length; i++) {
    const el = slideElements[i];
    const dataUrl = await toPng(el, {
      fontEmbedCSS: await slideFontEmbedCss(el),
      width,
      height,
      pixelRatio: 1,
      cacheBust: true,
    });

    if (i > 0) {
      pdf.addPage([width, height], "portrait");
    }
    pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  }

  pdf.save(`${baseFileName}-${width}x${height}.pdf`);
}
