import React, { useCallback, useRef } from "react";
import { Group, Shape } from "react-konva";
import { useFrameEditorContext } from "../FrameEditorContext";

const LineItem = ({ data, e, transformer, onSelect }) => {
  const {
    attrs: { updatedAt, zIndex, points, ...attrs },
  } = data;
  const lineRef = useRef();
  const { updateCurrentStageData } = useFrameEditorContext();

  const draw = (ctx, shape) => {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    if (points.length === 4) {
      ctx.lineTo(points[2], points[3]);
    } else if (points.length === 6) {
      ctx.quadraticCurveTo(points[2], points[3], points[4], points[5]);
    } else {
      ctx.bezierCurveTo(points[2], points[3], points[4], points[5], points[6], points[7]);
    }
    shape.strokeWidth(4);
    ctx.fillStrokeShape(shape);
  };

  const onDragMoveFrame = useCallback((e) => {
    e.target.getLayer().batchDraw();
  }, []);

  const onDragEndFrame = useCallback(
    (e) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      updateCurrentStageData(e.target.id(), {
        ...e.target.attrs,
      });
      e.target.getLayer().batchDraw();
    },
    [data],
  );

  return (
    <Group>
      <Shape
        ref={lineRef}
        onClick={onSelect}
        sceneFunc={draw}
        name="label-target"
        data-item-type="line"
        id={data.id}
        {...attrs}
        draggable
        onDragMove={onDragMoveFrame}
        onDragEnd={onDragEndFrame}
      />
    </Group>
  );
};

export default LineItem;
