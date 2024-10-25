import React from "react";
import { onDragStart } from "../utils/dragAndDrop";

const Drag = ({ dragType, dragSrc, children }) => {
  const extendedProps = {
    draggable: true,
    "data-drag-src": JSON.stringify(dragSrc),
    onDragStart: onDragStart(dragType),
  };

  const childrenWithProps = React.Children.map(children, (child) => {
    let newChild = child;
    if (React.isValidElement(child)) {
      newChild = React.cloneElement(child, extendedProps);
    }
    return newChild;
  });

  return <>{childrenWithProps}</>;
};

export default Drag;
