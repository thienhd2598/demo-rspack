import { KonvaEventObject } from "konva/lib/Node";
import React, { useCallback, useMemo, useRef } from "react";
import { Text as KonvaText } from "react-konva";
import { useFrameEditorContext } from "../FrameEditorContext";

const TextItem = ({ data, e, transformer, onSelect, updateCurrentStageData }) => {
  const { attrs } = data;
  const textRef = useRef();     

  console.log(`Ref text: `, textRef);

  const onEditStart = () => {
    if (textRef.current === null) {
      console.error("textRef is null");
      return;
    }
    textRef.current.hide();
    transformer.transformerRef.current.hide();
    const textPosition = textRef.current.getAbsolutePosition();
    const stage = textRef.current.getStage();
    const container = stage?.container().getBoundingClientRect();
    const areaPosition = {
      x: container.x + textPosition.x,
      y: container.y + textPosition.y,
    };
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.id = "current_text_editor";
    textarea.innerHTML = textRef.current.text();
    textarea.style.zIndex = "100";
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.fontSize = `${
      textRef.current.fontSize() * stage?.scaleY() * textRef.current.scaleY()
    }px`;
    textarea.style.width = `${textarea.value
      .split("\n")
      .sort((a, b) => b.length - a.length)[0]
      .split("")
      .reduce(
        (acc, curr) =>
          curr.charCodeAt(0) >= 32 && curr.charCodeAt(0) <= 126
            ? acc
              + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY() * (3 / 5)
            : acc + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY(),
        0,
      )}px`;
    textarea.style.height = `${textRef.current.height() + textRef.current.padding() * 2 + 5}px`;
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textRef.current.lineHeight().toString();
    textarea.style.fontFamily = textRef.current.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textRef.current.align();
    textarea.style.color = textRef.current.fill();
    const rotation = textRef.current.rotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }

    let px = 0;
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (isFirefox) {
      px += 2 + Math.round(textRef.current.fontSize() / 20);
    }
    transform += `translateY(-${px}px)`;

    textarea.style.transform = transform;

    // reset height
    textarea.style.height = "auto";
    // after browsers resized it we can set actual value
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();

    function removeTextarea() {
      window.removeEventListener("click", handleOutsideClick);
      textRef.current.show();
      transformer.transformerRef.current.show();
      updateCurrentStageData(textRef.current?.id(), {
        ...textRef.current?.attrs,
        width: textarea.getBoundingClientRect().width / stage?.scaleY() / textRef.current?.scaleY(),
        height: textarea.value.split("\n").length * textRef.current?.fontSize() * 1.2,
        updatedAt: Date.now(),
      });
      textarea.parentNode.removeChild(textarea);
    }

    function setTextareaWidth() {
      let newWidth = textarea.value
        .split("\n")
        .sort((a, b) => b.length - a.length)[0]
        .split("")
        .reduce(
          (acc, curr) =>
            curr.charCodeAt(0) >= 32 && curr.charCodeAt(0) <= 126
              ? acc
                + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY() * (3 / 5)
              : acc + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY(),
          0,
        );
      // some extra fixes on different browsers
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      if (isSafari || isFirefox) {
        newWidth = Math.ceil(newWidth);
      }

      textarea.style.width = `${newWidth}px`;
    }

    textarea.addEventListener("input", (e) => {
      textarea.style.width = `${textarea.value
        .split("\n")
        .sort((a, b) => b.length - a.length)[0]
        .split("")
        .reduce(
          (acc, curr) =>
            curr.charCodeAt(0) >= 32 && curr.charCodeAt(0) <= 126
              ? acc
                + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY() * (3 / 5)
              : acc + textRef.current?.fontSize() * stage?.scaleY() * textRef.current?.scaleY(),
          0,
        )}px`;
    });

    textarea.addEventListener("keydown", (e) => {
      // hide on enter
      // but don't hide on shift + enter
      if (e.keyCode === 13 && !e.shiftKey) {
        textRef.current.text(textarea.value);
        removeTextarea();
      }
      // on esc do not set value back to node
      if (e.keyCode === 27) {
        removeTextarea();
      }
    });

    textarea.addEventListener("keydown", (e) => {
      setTextareaWidth();
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + textRef?.current?.fontSize()}px`;
    });

    function handleOutsideClick(e) {
      if (e.target !== textarea) {
        textRef.current.text(textarea.value);
        removeTextarea();
      }
    }

    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    });
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

  const onClickText = (e) => {
    if (e.evt.detail === 1) {
      setTimeout(() => {
        if (document.getElementById("current_text_editor")) {
          return;
        }
        onSelect(e);
      }, 200);
      return;
    }
    onEditStart();
  };
  
  console.log({ attrs })

  return (
    <KonvaText
      ref={textRef}
      text={attrs.text}
      fontFamily={attrs.fontFamily}
      fontSize={attrs.fontSize}      
      fontStyle={attrs.fontStyle}
      onClick={onClickText}
      name="label-target"
      data-item-type="text"
      data-frame-type="text"
      id={data.id}
      x={attrs.x}
      y={attrs.y}
      align={attrs.align ?? "center"}
      verticalAlign={attrs.verticalAlign ?? "middel"}
      // width={attrs.width}
      // height={attrs.height}
      scaleX={attrs.scaleX}
      scaleY={attrs.scaleY}
      fill={attrs.fill ?? "#000000"}
      stroke={attrs.stroke ?? null}
      strokeWidth={1}
      opacity={attrs.opacity ?? 1}
      rotation={attrs.rotation ?? 0}
      draggable
      onDragMove={onDragMoveFrame}
      onDragEnd={onDragEndFrame}
    />
  );
};

export default TextItem;
