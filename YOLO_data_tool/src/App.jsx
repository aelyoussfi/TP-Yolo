import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageCanvas from './components/ImageCanvas';
import ClassManager from './components/ClassManager';
import ImageNavigator from './components/ImageNavigator';
import BoundingBoxList from './components/BoundingBoxList';
import { exportDatasetZip } from './utils/yoloExport';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from './utils/storage';

export default function App() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [classes, setClasses] = useState([]);
  const [annotations, setAnnotations] = useState({}); // { imageName: [boxes] }
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const [nextClassId, setNextClassId] = useState(0);
  const [visitedImages, setVisitedImages] = useState(new Set());
  const fileInputRef = useRef(null);

  const currentImage = images[currentImageIndex] || null;
  const currentAnnotations = currentImage ? annotations[currentImage.name] || [] : [];

  // Mark current image as visited
  useEffect(() => {
    if (currentImage) {
      setVisitedImages((prev) => {
        if (prev.has(currentImage.name)) return prev;
        const next = new Set(prev);
        next.add(currentImage.name);
        return next;
      });
    }
  }, [currentImage]);

  // Auto-save to localStorage on changes
  useEffect(() => {
    if (images.length > 0) {
      saveToLocalStorage({ images, classes, annotations, currentImageIndex, visitedImages: [...visitedImages] });
    }
  }, [images, classes, annotations, currentImageIndex, visitedImages]);

  // Load saved annotations and classes on mount (images must be re-uploaded)
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      setClasses(saved.classes || []);
      setAnnotations(saved.annotations || {});
      setCurrentImageIndex(saved.currentImageIndex || 0);
      if (saved.visitedImages) setVisitedImages(new Set(saved.visitedImages));
      if (saved.classes?.length > 0) {
        setNextClassId(Math.max(...saved.classes.map((c) => c.id)) + 1);
        setSelectedClassId(saved.classes[0].id);
      }
    }
  }, []);

  // --- Image upload ---
  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    const promises = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              resolve({
                name: file.name,
                dataUrl: e.target.result,
                width: img.width,
                height: img.height,
              });
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        })
    );
    Promise.all(promises).then((loaded) => {
      setImages((prev) => {
        const existingNames = new Set(prev.map((i) => i.name));
        const newImgs = loaded.filter((i) => !existingNames.has(i.name));
        return [...prev, ...newImgs];
      });
    });
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // --- Class management ---
  const handleAddClass = ({ name, color }) => {
    const id = nextClassId;
    setClasses((prev) => [...prev, { id, name, color }]);
    setNextClassId((prev) => prev + 1);
    if (selectedClassId === null) setSelectedClassId(id);
  };

  const handleEditClass = (id, updates) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDeleteClass = (id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    if (selectedClassId === id) {
      setSelectedClassId(classes.length > 1 ? classes.find((c) => c.id !== id)?.id ?? null : null);
    }
    // Remove all annotations with this class
    setAnnotations((prev) => {
      const next = {};
      for (const [key, boxes] of Object.entries(prev)) {
        next[key] = boxes.filter((b) => b.classId !== id);
      }
      return next;
    });
  };

  // --- Annotation management ---
  const handleAddBox = (box) => {
    if (!currentImage) return;
    setAnnotations((prev) => ({
      ...prev,
      [currentImage.name]: [...(prev[currentImage.name] || []), box],
    }));
  };

  const handleUpdateBox = (index, updatedBox) => {
    if (!currentImage) return;
    setAnnotations((prev) => {
      const boxes = [...(prev[currentImage.name] || [])];
      boxes[index] = updatedBox;
      return { ...prev, [currentImage.name]: boxes };
    });
  };

  const handleDeleteBox = (index) => {
    if (!currentImage) return;
    setAnnotations((prev) => {
      const boxes = [...(prev[currentImage.name] || [])];
      boxes.splice(index, 1);
      return { ...prev, [currentImage.name]: boxes };
    });
    setSelectedBoxIndex(null);
  };

  const handleUpdateBoxClass = (index, classId) => {
    if (!currentImage) return;
    setAnnotations((prev) => {
      const boxes = [...(prev[currentImage.name] || [])];
      boxes[index] = { ...boxes[index], classId };
      return { ...prev, [currentImage.name]: boxes };
    });
  };

  // --- Export ---
  const handleExport = () => {
    if (images.length === 0) return;
    exportDatasetZip(images, annotations, classes);
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all images, annotations, and classes?')) return;
    setImages([]);
    setAnnotations({});
    setClasses([]);
    setCurrentImageIndex(0);
    setSelectedClassId(null);
    setSelectedBoxIndex(null);
    setNextClassId(0);
    setVisitedImages(new Set());
    clearLocalStorage();
  };

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e) => {
      // Ignore when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.key) {
        case 'a':
        case 'A':
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentImageIndex((prev) => Math.max(0, prev - 1));
          setSelectedBoxIndex(null);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          e.preventDefault();
          setCurrentImageIndex((prev) => Math.min(images.length - 1, prev + 1));
          setSelectedBoxIndex(null);
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedBoxIndex !== null) {
            e.preventDefault();
            handleDeleteBox(selectedBoxIndex);
          }
          break;
        case 'Escape':
          setSelectedBoxIndex(null);
          break;
        default:
          // Number keys 1-9 to select class
          if (e.key >= '1' && e.key <= '9') {
            const idx = parseInt(e.key) - 1;
            if (idx < classes.length) {
              setSelectedClassId(classes[idx].id);
            }
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, selectedBoxIndex, classes]);

  return (
    <div className="app" onDrop={handleDrop} onDragOver={handleDragOver}>
      <header className="app-header">
        <h1>YOLO Data Tool</h1>
        {images.length > 0 && (
          <div className="progress-bar-container">
            <div className="progress-stats">
              <span className="stat-done">&#10003; {images.filter((img) => visitedImages.has(img.name) && (annotations[img.name]?.length || 0) > 0).length}</span>
              <span className="stat-negative">&#8856; {images.filter((img) => visitedImages.has(img.name) && (annotations[img.name]?.length || 0) === 0).length}</span>
              <span className="stat-pending">&#8987; {images.filter((img) => !visitedImages.has(img.name)).length}</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(visitedImages.size / images.length) * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="header-actions">
          <button onClick={() => fileInputRef.current?.click()}>Upload Images</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button onClick={handleExport} disabled={images.length === 0}>
            Export ZIP
          </button>
          <button className="btn-danger" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </header>

      <div className="app-body">
        {/* Left sidebar: image navigator */}
        <aside className="sidebar-left">
          <ImageNavigator
            images={images}
            currentIndex={currentImageIndex}
            onSelect={(i) => {
              setCurrentImageIndex(i);
              setSelectedBoxIndex(null);
            }}
            annotations={annotations}
            visitedImages={visitedImages}
          />
        </aside>

        {/* Center: canvas */}
        <main className="main-canvas">
          {images.length === 0 && (
            <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
              <div className="drop-zone-content">
                <p className="drop-icon">&#128193;</p>
                <p>Drag & drop images here</p>
                <p className="hint">or click to browse</p>
              </div>
            </div>
          )}
          <ImageCanvas
            image={currentImage}
            annotations={currentAnnotations}
            classes={classes}
            selectedClassId={selectedClassId}
            onAddBox={handleAddBox}
            onUpdateBox={handleUpdateBox}
            onDeleteBox={handleDeleteBox}
            selectedBoxIndex={selectedBoxIndex}
            onSelectBox={setSelectedBoxIndex}
          />
          {currentImage && (
            <div className="canvas-info">
              <span>{currentImage.name}</span>
              <span>
                {currentImage.width}×{currentImage.height}
              </span>
            </div>
          )}
        </main>

        {/* Right sidebar: classes + annotations */}
        <aside className="sidebar-right">
          <ClassManager
            classes={classes}
            onAddClass={handleAddClass}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
          />

          {classes.length > 0 && (
            <div className="active-class-selector">
              <h3>Active Class</h3>
              <div className="class-buttons">
                {classes.map((cls, idx) => (
                  <button
                    key={cls.id}
                    className={`class-btn ${selectedClassId === cls.id ? 'active' : ''}`}
                    style={{
                      borderColor: cls.color,
                      background: selectedClassId === cls.id ? cls.color + '33' : 'transparent',
                      color: cls.color,
                    }}
                    onClick={() => setSelectedClassId(cls.id)}
                    title={`Press ${idx + 1}`}
                  >
                    <span className="class-key">{idx + 1}</span> {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <BoundingBoxList
            annotations={currentAnnotations}
            classes={classes}
            selectedBoxIndex={selectedBoxIndex}
            onSelectBox={setSelectedBoxIndex}
            onDeleteBox={handleDeleteBox}
            onUpdateBoxClass={handleUpdateBoxClass}
          />
        </aside>
      </div>

      <footer className="app-footer">
        <span>
          <kbd>A</kbd>/<kbd>&#8592;</kbd> Prev &nbsp; <kbd>D</kbd>/<kbd>&#8594;</kbd> Next &nbsp;
          <kbd>1-9</kbd> Select class &nbsp; <kbd>Del</kbd> Delete box &nbsp;
          <kbd>Esc</kbd> Deselect
        </span>
      </footer>
    </div>
  );
}
