import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Group } from 'react-konva';

const MAX_CANVAS_WIDTH = 900;
const MAX_CANVAS_HEIGHT = 650;

export default function ImageCanvas({
  image,
  annotations,
  classes,
  selectedClassId,
  onAddBox,
  onUpdateBox,
  onDeleteBox,
  selectedBoxIndex,
  onSelectBox,
}) {
  const stageRef = useRef(null);
  const [konvaImage, setKonvaImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [drawing, setDrawing] = useState(false);
  const [newRect, setNewRect] = useState(null);

  // Load image into an HTMLImageElement for Konva
  useEffect(() => {
    if (!image) {
      setKonvaImage(null);
      return;
    }
    const img = new window.Image();
    img.src = image.dataUrl;
    img.onload = () => {
      const scaleX = MAX_CANVAS_WIDTH / img.width;
      const scaleY = MAX_CANVAS_HEIGHT / img.height;
      const s = Math.min(scaleX, scaleY, 1);
      setScale(s);
      setKonvaImage(img);
    };
  }, [image]);

  const canvasWidth = konvaImage ? konvaImage.width * scale : MAX_CANVAS_WIDTH;
  const canvasHeight = konvaImage ? konvaImage.height * scale : MAX_CANVAS_HEIGHT;

  const getClassColor = useCallback(
    (classId) => {
      const cls = classes.find((c) => c.id === classId);
      return cls ? cls.color : '#ffffff';
    },
    [classes]
  );

  const getClassName = useCallback(
    (classId) => {
      const cls = classes.find((c) => c.id === classId);
      return cls ? cls.name : '?';
    },
    [classes]
  );

  const handleMouseDown = (e) => {
    if (selectedClassId === null) return;
    const target = e.target;
    // Allow drawing on stage background, image, or non-selected boxes
    const isStage = target === stageRef.current;
    const isImage = target.getClassName() === 'Image';
    const isUnselectedBox = target.getClassName() === 'Rect' && !target.isDragging();
    if (!isStage && !isImage && !isUnselectedBox) return;
    const pos = stageRef.current.getPointerPosition();
    setDrawing(true);
    setNewRect({ x: pos.x / scale, y: pos.y / scale, width: 0, height: 0 });
    onSelectBox(null);
  };

  const handleMouseMove = () => {
    if (!drawing || !newRect) return;
    const pos = stageRef.current.getPointerPosition();
    setNewRect((prev) => ({
      ...prev,
      width: pos.x / scale - prev.x,
      height: pos.y / scale - prev.y,
    }));
  };

  const handleMouseUp = () => {
    if (!drawing || !newRect) return;
    setDrawing(false);

    // Normalize negative width/height
    let { x, y, width, height } = newRect;
    if (width < 0) {
      x += width;
      width = -width;
    }
    if (height < 0) {
      y += height;
      height = -height;
    }

    // Minimum size filter
    if (width > 5 && height > 5) {
      onAddBox({
        x,
        y,
        width,
        height,
        classId: selectedClassId,
      });
    }
    setNewRect(null);
  };

  const handleBoxDragEnd = (index, e) => {
    const node = e.target;
    onUpdateBox(index, {
      ...annotations[index],
      x: node.x() / scale,
      y: node.y() / scale,
    });
  };

  const handleTransformEnd = (index, e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onUpdateBox(index, {
      ...annotations[index],
      x: node.x() / scale,
      y: node.y() / scale,
      width: (node.width() * scaleX) / scale,
      height: (node.height() * scaleY) / scale,
    });
  };

  if (!image) {
    return (
      <div className="canvas-placeholder">
        <p>Upload images to start annotating</p>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {konvaImage && (
            <KonvaImage image={konvaImage} width={canvasWidth} height={canvasHeight} />
          )}

          {/* Existing annotations */}
          {annotations.map((box, i) => {
            const color = getClassColor(box.classId);
            const isSelected = selectedBoxIndex === i;
            return (
              <Group key={i}>
                <Rect
                  x={box.x * scale}
                  y={box.y * scale}
                  width={box.width * scale}
                  height={box.height * scale}
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  dash={isSelected ? [6, 3] : undefined}
                  fill={`${color}22`}
                  draggable={isSelected}
                  listening={true}
                  onClick={() => onSelectBox(i)}
                  onTap={() => onSelectBox(i)}
                  onDragEnd={(e) => handleBoxDragEnd(i, e)}
                  onTransformEnd={(e) => handleTransformEnd(i, e)}
                />
                <Text
                  x={box.x * scale}
                  y={box.y * scale - 16}
                  text={getClassName(box.classId)}
                  fontSize={13}
                  fill={color}
                  fontStyle="bold"
                />
              </Group>
            );
          })}

          {/* Currently drawing rectangle */}
          {newRect && (
            <Rect
              x={newRect.x * scale}
              y={newRect.y * scale}
              width={newRect.width * scale}
              height={newRect.height * scale}
              stroke="#00ff00"
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
