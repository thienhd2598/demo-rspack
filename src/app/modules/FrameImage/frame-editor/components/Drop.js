import React, { useEffect } from "react";
import { onDragOver, onDrop } from "../utils/dragAndDrop";

const Drop = ({ callback, targetDOMElement }) => {
  useEffect(() => {
    if (!targetDOMElement) {
      console.log("pup");
      return;
    }
    targetDOMElement.addEventListener("dragover", (e) => {
      onDragOver("copy")(e);
    });
    targetDOMElement.addEventListener("drop", (e) => {
      onDrop(callback)(e);
    });
  }, [targetDOMElement]);
  return <></>;
};

export default Drop;
