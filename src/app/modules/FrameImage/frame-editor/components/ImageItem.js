import Konva from "konva";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import useDragAndDrop from "../hooks/useDragAndDrop";
import useStage from "../hooks/useStage";
import { decimalUpToSeven } from "../utils/decimalUpToSeven";
import useBrush from "../hooks/useBrush";
import { randomString } from "../../../../../utils";

export const filterMap = {
  Brighten: Konva.Filters.Brighten,
  Grayscale: Konva.Filters.Grayscale,
};

const ImageItem = ({ data, e, onSelect, addCurrentStageData, updateCurrentStageData }) => {
  const { attrs } = data;
  const imageRef = useRef();
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
    newImage.onload = () => {
      setImageSrc(newImage);
    };
    newImage.crossOrigin = "Anonymous";
    let source;
    source = `${attrs.src}?${randomString()}`;

    if (source.startsWith("data:")) {
      Konva.Image.fromURL(source, (imageNode) => {
        let width;
        let height;
        if (imageNode.width() > imageNode.height()) {
          width = decimalUpToSeven(512);
          height = decimalUpToSeven(width * (imageNode.height() / imageNode.width()));
        } else {
          height = decimalUpToSeven(512);
          width = decimalUpToSeven(height * (imageNode.width() / imageNode.height()));
        }
        imageNode.width(width);
        imageNode.height(height);
        const newBase64 = imageNode.toDataURL({
          x: 0,
          y: 0,
          width,
          height,
          pixelRatio: 5,
        });
        newImage.src = newBase64;
      });
      return;
    }
    newImage.src = source;
  }, [attrs.src]);

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

  return (
    <KonvaImage
      ref={imageRef}
      image={imageSrc}
      onClick={onSelect}
      name="label-target"
      data-item-type="image"
      data-frame-type="image"
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

export default ImageItem;
