import React from 'react';

export default function BoundingBoxList({
  annotations,
  classes,
  selectedBoxIndex,
  onSelectBox,
  onDeleteBox,
  onUpdateBoxClass,
}) {
  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : '?';
  };

  const getClassColor = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.color : '#ccc';
  };

  if (annotations.length === 0) {
    return (
      <div className="bbox-list">
        <h3>Annotations</h3>
        <p className="hint">Draw a box on the image to annotate</p>
      </div>
    );
  }

  return (
    <div className="bbox-list">
      <h3>Annotations ({annotations.length})</h3>
      <ul>
        {annotations.map((box, i) => (
          <li
            key={i}
            className={selectedBoxIndex === i ? 'selected' : ''}
            onClick={() => onSelectBox(i)}
          >
            <span
              className="box-color-dot"
              style={{ background: getClassColor(box.classId) }}
            />
            <select
              value={box.classId}
              onChange={(e) => onUpdateBoxClass(i, Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="box-coords">
              [{Math.round(box.x)}, {Math.round(box.y)}, {Math.round(box.width)}x
              {Math.round(box.height)}]
            </span>
            <button
              className="btn-sm btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBox(i);
              }}
              title="Delete (Del)"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
