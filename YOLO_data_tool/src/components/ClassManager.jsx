import React, { useState } from 'react';

const DEFAULT_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9',
];

export default function ClassManager({ classes, onAddClass, onEditClass, onDeleteClass }) {
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    const name = newClassName.trim();
    if (!name) return;
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    const color = DEFAULT_COLORS[classes.length % DEFAULT_COLORS.length];
    onAddClass({ name, color });
    setNewClassName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const startEdit = (cls) => {
    setEditingId(cls.id);
    setEditName(cls.name);
  };

  const confirmEdit = (id) => {
    const name = editName.trim();
    if (name) onEditClass(id, { name });
    setEditingId(null);
  };

  return (
    <div className="class-manager">
      <h3>Classes</h3>
      <div className="class-add-row">
        <input
          type="text"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="New class name..."
          maxLength={50}
        />
        <button onClick={handleAdd} title="Add class">+</button>
      </div>
      <ul className="class-list">
        {classes.map((cls) => (
          <li key={cls.id}>
            <span className="class-color" style={{ background: cls.color }} />
            {editingId === cls.id ? (
              <>
                <input
                  className="class-edit-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmEdit(cls.id)}
                  onBlur={() => confirmEdit(cls.id)}
                  autoFocus
                  maxLength={50}
                />
              </>
            ) : (
              <>
                <span className="class-name">{cls.name}</span>
                <span className="class-id">({cls.id})</span>
                <button className="btn-sm" onClick={() => startEdit(cls)} title="Edit">&#9998;</button>
                <button className="btn-sm btn-danger" onClick={() => onDeleteClass(cls.id)} title="Delete">&times;</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {classes.length === 0 && <p className="hint">Add a class to start annotating</p>}
    </div>
  );
}
