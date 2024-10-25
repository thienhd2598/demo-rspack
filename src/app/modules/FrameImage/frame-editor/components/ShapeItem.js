import { Rect as RectType } from "konva/lib/shapes/Rect";
import { RegularPolygon as RegularPolygonType } from "konva/lib/shapes/RegularPolygon";
import React, { RefObject, useEffect, useRef } from "react";
import { Rect, RegularPolygon } from "react-konva";
import useDragAndDrop from "../hooks/useDragAndDrop";
import useStage from "../hooks/useStage";

const ShapeItem = ({ data, e, transformer, onSelect }) => {
  const { attrs } = data;

  const shapeRef = useRef();
  const stage = useStage();
  const { onDragMoveFrame, onDragEndFrame, checkIsInFrame } = useDragAndDrop(
    stage.stageRef,
    stage.dragBackgroundOrigin,
  );

  useEffect(() => {
    if (shapeRef.current) {
      stage.setStageRef(shapeRef.current?.getStage());
      checkIsInFrame(shapeRef.current);
    }
  }, [data]);

  if (attrs.sides === 4) {
    return (
      <Rect
        ref={shapeRef}
        onClick={onSelect}
        name="label-target"
        data-item-type="shape"
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        width={Math.sqrt(attrs.radius * 2)}
        height={Math.sqrt(attrs.radius * 2)}
        sides={attrs.sides}
        radius={attrs.radius}
        scaleX={attrs.scaleX}
        scaleY={attrs.scaleY}
        fill={attrs.fill ?? "#000000"}
        stroke={attrs.stroke ?? null}
        strokeWidth={attrs.stroke ? 5 : undefined}
        opacity={attrs.opacity ?? 1}
        rotation={attrs.rotation ?? 0}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    );
  }

  return (
    <RegularPolygon
      ref={shapeRef}
      onClick={onSelect}
      name="label-target"
      data-item-type="shape"
      id={data.id}
      x={attrs.x}
      y={attrs.y}
      sides={attrs.sides}
      radius={attrs.radius}
      scaleX={attrs.scaleX}
      scaleY={attrs.scaleY}
      fill={attrs.fill ?? "#000000"}
      stroke={attrs.stroke ?? null}
      strokeWidth={attrs.stroke ? 5 : undefined}
      opacity={attrs.opacity ?? 1}
      rotation={attrs.rotation ?? 0}
      draggable
      onDragMove={onDragMoveFrame}
      onDragEnd={onDragEndFrame}
    />
  );
};

export default ShapeItem;
