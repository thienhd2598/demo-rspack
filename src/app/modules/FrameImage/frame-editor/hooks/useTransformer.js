import { useRef } from "react";
import { useFrameEditorContext } from "../FrameEditorContext";

const useTransformer = () => {
  const transformerRef = useRef();
  const { updateCurrentStageData } = useFrameEditorContext();

  const onTransformEnd = (e) => {    
    updateCurrentStageData(e.target.id(), {
      ...e.target.attrs,
      updatedAt: Date.now(),
    });

    return e?.target?.getStage()?.batchDraw();
  };

  const setTransformerConfig = (transformer) => {
    let nodeStatus = "default";
    if (transformer.nodes().length === 1) {
      nodeStatus = transformer.getNode().attrs["data-item-type"];
    }

    for (const field in [nodeStatus]) {
      transformer.attrs[field] = [
        nodeStatus
      ][field];
    }
    transformer.update();
  };

  return {
    transformerRef,
    onTransformEnd,
    setTransformerConfig,
  };
};

export default useTransformer;
