import Konva from "konva";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Image as KonvaImage, Label, Tag, Text } from "react-konva";
import useDragAndDrop from "../hooks/useDragAndDrop";
import useStage from "../hooks/useStage";
import { decimalUpToSeven } from "../utils/decimalUpToSeven";
import { randomString } from "../../../../../utils";
import { ORIGIN_WIDTH_FRAME } from "../utils";

export const filterMap = {
  Brighten: Konva.Filters.Brighten,
  Grayscale: Konva.Filters.Grayscale,
};

export const getFramePos = (stage, e, width, height) => {
  stage.setPointersPositions(e);
  const stageOrigin = stage.getAbsolutePosition();
  const mousePosition = stage.getPointerPosition();
  if (!mousePosition) {
    return {
      x: 0,
      y: 0,
    };
  }
  if (!width || !height) {
    return {
      x: decimalUpToSeven(mousePosition.x - stageOrigin.x),
      y: decimalUpToSeven(mousePosition.y - stageOrigin.y),
    };
  }
  return {
    x: decimalUpToSeven((mousePosition.x - stageOrigin.x) / stage.scaleX() - width / 2),
    y: decimalUpToSeven((mousePosition.y - stageOrigin.y) / stage.scaleY() - height / 2),
  };
};

const FrameItem = ({ data, e, onSelect, addCurrentStageData, updateCurrentStageData, frameWidth }) => {
  const { attrs } = data;
  const frameRef = useRef();
  const [imageSrc, setImageSrc] = useState(new Image());

  const stage = useStage();
  const { onDragMoveFrame, onDragEndFrame, checkIsInFrame } = useDragAndDrop(
    stage.stageRef,
    stage.dragBackgroundOrigin,
    addCurrentStageData,
    updateCurrentStageData
  );
  const filters = useMemo(() => {
    if (!data.attrs._filters) {
      return [Konva.Filters.Brighten];
    }
    return data.attrs._filters.map((filterName) => filterMap[filterName]);
  }, [data.attrs]);

  useEffect(() => {
    const newImage = new Image();
    newImage.onload = function () {
      setImageSrc(newImage);
    };

    newImage.crossOrigin = "Anonymous";
    newImage.src = `${attrs.src}?${randomString()}`;
  }, [attrs.src]);

  useEffect(() => {
    if (frameRef.current) {
      stage.setStageRef(frameRef.current?.getStage());
      frameRef.current.brightness(data.attrs.brightness);
      checkIsInFrame(frameRef.current);
      frameRef.current.cache();
    }
  }, [imageSrc, data]);

  useEffect(() => {
    frameRef.current.cache();
  }, []);

  const clipFunc = (ctx) => {
    const position = attrs;
    ctx.beginPath();
    ctx.fillText(attrs["data-frame-type"], position.x, position.y - 15);
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + ORIGIN_WIDTH_FRAME, position.y);
    ctx.lineTo(position.x + ORIGIN_WIDTH_FRAME, position.y + ORIGIN_WIDTH_FRAME);
    ctx.lineTo(position.x, position.y + ORIGIN_WIDTH_FRAME);
    ctx.closePath();
  };

  useEffect(() => {
    if (frameRef.current) {
      stage.setStageRef(frameRef.current.getStage());
      // frameRef.current.brightness(data.attrs.brightness);
      // frameRef.current.findAncestor("Group").clipFunc(frameRef.current.getLayer().getContext());
      // frameRef.current.cache();
    }
  }, [data]);

  console.log({ imageSrc, width: imageSrc.width })

  return (
    <Group name="label-group" onClick={ (e) => {
      console.log(`------- BAY H LA MAY H --------`)
      onSelect(e)}
      } clipFunc={clipFunc}>
      <KonvaImage
        ref={frameRef}
        image={imageSrc}
        name="label-target"
        data-item-type="frame"
        data-frame-type="image"
        // fillPatternImage={imageSrc}
        // fillPatternScaleX={imageSrc.width / frameWidth}
        // fillPatternScaleY={imageSrc.height / frameWidth}
        id={data.id}
        x={attrs.x}
        y={attrs.y}
        width={ORIGIN_WIDTH_FRAME}
        height={ORIGIN_WIDTH_FRAME}
        // fillLinearGradientStartPoint={{ x: -100, y: -100 }}
        // fillLinearGradientEndPoint={{ x: attrs.x, y: attrs.y }}
        // fillLinearGradientColorStops={[0, 'red', 1, 'yellow']}
        // scaleX={+(frameWidth / ORIGIN_WIDTH_FRAME).toFixed(4)}
        // scaleY={+(frameWidth / ORIGIN_WIDTH_FRAME).toFixed(4)}
        scaleX={1}
        scaleY={1}
        // fill={'rgb(164, 98, 200)'}
        // scaleX={attrs.scaleX}
        // scaleY={attrs.scaleY}
        fill={attrs.fill ?? "transparent"}
        // background={'linear-gradient(red, yellow)'}        
        opacity={attrs.opacity ?? 1}
        rotation={attrs.rotation ?? 0}
        filters={filters ?? [Konva.Filters.Brighten]}
      />
    </Group>
  );
};

export default FrameItem;
