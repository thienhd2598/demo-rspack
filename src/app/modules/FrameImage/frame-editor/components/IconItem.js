import Konva from "konva";
import React, { useEffect, useMemo, useRef } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import useDragAndDrop from "../hooks/useDragAndDrop";
import useStage from "../hooks/useStage";
import { unescape } from "lodash";

export const filterMap = {
  Brighten: Konva.Filters.Brighten,
  Grayscale: Konva.Filters.Grayscale,
};

const IconItem = ({ data, e, onSelect, addCurrentStageData, updateCurrentStageData }) => {
  const { attrs } = data;
  const imageRef = useRef();

  const srcAttrImage = useMemo(() => {
    try {
      return "data:image/svg+xml;base64," + window.btoa(attrs?.src)
    } catch (err) {
      return "data:image/svg+xml;base64," + window.btoa(attrs?.src?.replace(/[^\x00-\xFF]/g, ''))
    }
  }, [attrs?.src]);

  const [imageSrc] = useImage(srcAttrImage, "anonymous");

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
    if (imageRef.current) {
      stage.setStageRef(imageRef.current?.getStage());
      imageRef.current.brightness(data.attrs.brightness);
      checkIsInFrame(imageRef.current);
      imageRef.current.cache();
    }
  }, [imageSrc, data]);

  useEffect(() => {
    imageRef.current.cache();
  }, []);

  console.log({ attrs })

  return (
    <KonvaImage
      ref={imageRef}
      image={imageSrc}
      onClick={onSelect}
      name="label-target"
      data-item-type="icon"
      data-frame-type="icon"
      id={data.id}
      x={attrs.x}
      y={attrs.y}
      width={attrs.width}
      height={attrs.height}
      scaleX={attrs.scaleX}
      scaleY={attrs.scaleY}
      fill={attrs.fill ?? "transparent"}
      opacity={attrs.opacity ?? 1}
      rotation={attrs.rotation ?? 0}
      // filters={[ColorReplaceFilter]}
      filters={filters ?? [Konva.Filters.Brighten]}
      draggable
      onDragMove={onDragMoveFrame}
      onDragEnd={onDragEndFrame}
    />
  );
};

export default IconItem;
