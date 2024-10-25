import Konva from "konva";
import { Vector2d } from "konva/lib/types";
import { MutableRefObject, useRef } from "react";

export const STAGE_POSITION = "stagePosition";
export const STAGE_SCALE = "stageScale";

const useStage = () => {
  const stageRef = useRef();
  const dragBackgroundOrigin = useRef({ x: 0, y: 0 });

  const setStageRef = (stage) => {    
    stageRef.current = stage;
  };

  return {
    setStageRef,
    stageRef,
    dragBackgroundOrigin,
  };
};

export default useStage;
