import React, { useCallback, useEffect, useState } from "react";
// import { useHotkeys } from "react-hotkeys-hook";
import { Layer, Rect, Stage } from "react-konva";
import useDragAndDrop from "./hooks/useDragAndDrop";
import useLocalStorage from "./hooks/useLocalStorage";
import { STAGE_POSITION, STAGE_SCALE } from "./hooks/useStage";
import Drop from "./components/Drop";
import { decimalUpToSeven } from "./utils/decimalUpToSeven";
import { useFrameEditorContext } from "./FrameEditorContext";
import { ORIGIN_WIDTH_FRAME } from "./utils";

export const getScaledMousePosition = (stage, e) => {
    stage.setPointersPositions(e);
    const stageOrigin = stage.getAbsolutePosition();
    const mousePosition = stage.getPointerPosition();
    if (mousePosition) {
        return {
            x: decimalUpToSeven((mousePosition.x - stageOrigin.x) / stage.scaleX()),
            y: decimalUpToSeven((mousePosition.y - stageOrigin.y) / stage.scaleY()),
        };
    }
    return {
        x: 0,
        y: 0,
    };
};

export const getItemsInBoundary = (stage, targetItem) => {
    const boundary = targetItem.getClientRect({ relativeTo: stage.getLayer() });
    const result = targetItem
        .getLayer()
        ?.getChildren((item) => {
            if (item.name() === "select-box") {
                return false;
            }
            const itemBoundary = item.getClientRect({ relativeTo: stage.getLayer() });            
            return (
                boundary.x <= itemBoundary.x
                && boundary.y <= itemBoundary.y
                && boundary.x + boundary.width >= itemBoundary.x + itemBoundary.width
                && boundary.y + boundary.height >= itemBoundary.y + itemBoundary.height
            );
        })
        .map((item) => {
            if (item.name() === "label-group") {
                return item.findOne(".label-target") ?? null;
            }
            return item;
        })
        .filter(Boolean);
    return result;
};

export const getOriginFromTwoPoint = (
    p1,
    p2,
    size,
) => {
    const result = {
        x: p1.x,
        y: p1.y,
        width: size.width,
        height: size.height,
    };
    result.x = p1.x;
    result.y = p1.y;
    result.width = p2.x - p1.x;
    result.height = p2.y - p1.y;
    return result;
};


const View = ({
    width,
    height,
    children,
    onSelect,
    stage: { stageRef, dragBackgroundOrigin },
}) => {
    const { addCurrentStageData, updateCurrentStageData } = useFrameEditorContext();
    const { onDropOnStage } = useDragAndDrop(stageRef, dragBackgroundOrigin, addCurrentStageData, updateCurrentStageData);
    const [container, setContainer] = useState();
    const { setValue } = useLocalStorage();

    const onSelectEmptyBackground = useCallback(
        (e) => {        
            // e.target.attrs[`data-item-type`] === "frame" && onSelect(e);
        },
        [onSelect],
    );

    const onMouseDownOnStage = useCallback(
        (e) => {
            onSelectEmptyBackground(e);
            const stage = e.target.getStage();
            if (!stage) {
                return;
            }
            const selectBox = stage.findOne(".select-box");
            const scaledCurrentMousePos = getScaledMousePosition(stage, e.evt);
            const currentMousePos = stage.getPointerPosition();
            selectBox.position(scaledCurrentMousePos);
            // if (stage.getAllIntersections(currentMousePos).length || stageRef.current?.draggable()) {
            //     selectBox.visible(false);
            //     return;
            // }
            selectBox.visible(true);
        },
        [onSelectEmptyBackground],
    );

    const onMouseMoveOnStage = (e) => {
        if (e.evt.which === 1) {
            const stage = e.target.getStage();
            if (!stage) {
                return;
            }
            const selectBox = stage.findOne(".select-box");
            if (!selectBox.visible()) {
                return;
            }
            const currentMousePos = getScaledMousePosition(stage, e.evt);
            const origin = selectBox.position();
            const size = selectBox.size();
            const adjustedRectInfo = getOriginFromTwoPoint(origin, currentMousePos, size);
            selectBox.position({
                x: adjustedRectInfo.x,
                y: adjustedRectInfo.y,
            });
            selectBox.size({
                width: adjustedRectInfo.width,
                height: adjustedRectInfo.height,
            });

            selectBox.getStage().batchDraw();
        }
    };

    const onMouseUpOnStage = useCallback(
        (e) => {
            const stage = e.target.getStage();
            if (!stage) {
                return;
            }
            const selectBox = stage.findOne(".select-box");
            const overlapItems = getItemsInBoundary(stage, selectBox)
                ? getItemsInBoundary(stage, selectBox)
                    .map((_item) =>
                        // _item.attrs["data-item-type"] === "frame"
                        // _item.getParent().getChildren() ?? []
                        _item,
                    )
                    .flat()
                    .filter((_item) => _item.className !== "Label")
                : [];

            selectBox.visible(false);
            selectBox.position({
                x: 0,
                y: 0,
            });
            selectBox.size({
                width: 0,
                height: 0,
            });
            selectBox.getLayer().batchDraw();            
            setTimeout(() => {
                overlapItems?.length && onSelect(undefined, overlapItems);
            }, 100)
        },
        [onSelect],
    );    

    useEffect(() => {
        if (stageRef.current) {
            setContainer(stageRef.current.container());
        }
    }, []);


    return (
        <Stage
            ref={stageRef}
            draggable={false}
            width={width}
            height={height}
            scaleX={+(width / ORIGIN_WIDTH_FRAME).toFixed(4)}
            scaleY={+(width / ORIGIN_WIDTH_FRAME).toFixed(4)}
            onMouseDown={onMouseDownOnStage}
            onMouseMove={onMouseMoveOnStage}
            onMouseUp={onMouseUpOnStage}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <Layer>
                {children}
                <Rect
                    name="select-box"
                    x={0}
                    y={0}
                    width={0}
                    height={0}
                    fill="skyblue"
                    opacity={0.4}
                    visible={false}
                />
            </Layer>
            {container ? <Drop callback={onDropOnStage} targetDOMElement={container} /> : null}
        </Stage>
    );
};

export default View;