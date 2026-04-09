import React from 'react';

export default function ImageNavigator({
  images,
  currentIndex,
  onSelect,
  annotations,
  visitedImages,
}) {
  if (images.length === 0) return null;

  return (
    <div className="image-navigator">
      <h3>Images ({images.length})</h3>
      <div className="image-nav-controls">
        <button
          disabled={currentIndex <= 0}
          onClick={() => onSelect(currentIndex - 1)}
          title="Previous (A)"
        >
          &#9664; Prev
        </button>
        <span className="nav-counter">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          disabled={currentIndex >= images.length - 1}
          onClick={() => onSelect(currentIndex + 1)}
          title="Next (D)"
        >
          Next &#9654;
        </button>
      </div>
      <ul className="image-thumb-list">
        {images.map((img, i) => {
          const boxCount = (annotations[img.name] || []).length;
          const visited = visitedImages?.has(img.name);
          let statusClass = 'status-pending';
          let statusLabel = '⏳ pending';
          if (visited && boxCount > 0) {
            statusClass = 'status-done';
            statusLabel = `✓ ${boxCount} box${boxCount !== 1 ? 'es' : ''}`;
          } else if (visited && boxCount === 0) {
            statusClass = 'status-negative';
            statusLabel = '⊘ negative';
          }
          return (
            <li
              key={img.name}
              className={`${i === currentIndex ? 'active' : ''} ${statusClass}`}
              onClick={() => onSelect(i)}
            >
              <span className={`status-dot ${statusClass}`} />
              <img src={img.dataUrl} alt={img.name} className="thumb" />
              <div className="thumb-info">
                <span className="thumb-name" title={img.name}>
                  {img.name.length > 20 ? img.name.slice(0, 18) + '...' : img.name}
                </span>
                <span className={`thumb-count ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
