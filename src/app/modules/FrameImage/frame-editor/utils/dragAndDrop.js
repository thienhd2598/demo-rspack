import { KonvaEventObject } from "konva/lib/Node";
import React from "react";

export const onDragStart = (dataTransferType) => (e) => {
    if (!e.currentTarget.dataset.dragSrc) {
      return;
    }
    e.dataTransfer.effectAllowed = dataTransferType;
    e.dataTransfer.setData("text/plain", e.currentTarget.dataset.dragSrc);
  };

export const onDragOver = (dataTransferType) => (e) => {
  e.preventDefault();
  if (!e.dataTransfer) {
    return;
  }
  e.dataTransfer.dropEffect = dataTransferType;
};

export const onDrop = (callback) => (e) => {
  e.preventDefault();
  if (!e.dataTransfer) {
    return;
  }
  const dragSrc = e.dataTransfer.getData("text/plain");
  callback(JSON.parse(dragSrc), e);
};

export const defaultOnMouseDown = (e) => {
  if (e.currentTarget.getStage()?.draggable()) {
    e.currentTarget.draggable(false);
  }
};

export const defaultOnMouseUp = (e) => {
  e.currentTarget.draggable(true);
};
