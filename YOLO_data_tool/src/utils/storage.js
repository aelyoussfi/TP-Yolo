const STORAGE_KEY = 'yolo-data-tool';

export function saveToLocalStorage(state) {
  try {
    const serializable = {
      classes: state.classes,
      annotations: state.annotations,
      currentImageIndex: state.currentImageIndex,
      imageNames: state.images.map((img) => img.name),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Storage full or unavailable
  }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLocalStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
