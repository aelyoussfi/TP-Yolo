import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Convert annotations for a single image to YOLO format string.
 * Each line: class_id x_center y_center width height (normalized 0-1)
 */
export function annotationsToYolo(boxes, imgWidth, imgHeight) {
  return boxes
    .map((box) => {
      const xCenter = (box.x + box.width / 2) / imgWidth;
      const yCenter = (box.y + box.height / 2) / imgHeight;
      const w = box.width / imgWidth;
      const h = box.height / imgHeight;
      return `${box.classId} ${xCenter.toFixed(6)} ${yCenter.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`;
    })
    .join('\n');
}

/**
 * Export entire dataset as a ZIP with /images and /labels folders.
 */
export async function exportDatasetZip(images, annotations, classes) {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  const labelsFolder = zip.folder('labels');

  // classes.txt for reference
  const classNames = classes.map((c) => c.name).join('\n');
  zip.file('classes.txt', classNames);

  for (const img of images) {
    // Add original image
    const response = await fetch(img.dataUrl);
    const blob = await response.blob();
    imagesFolder.file(img.name, blob);

    // Build label filename (same name, .txt extension)
    const baseName = img.name.replace(/\.[^.]+$/, '');
    const boxes = annotations[img.name] || [];
    const yoloStr = annotationsToYolo(boxes, img.width, img.height);
    labelsFolder.file(`${baseName}.txt`, yoloStr);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'yolo_dataset.zip');
}
