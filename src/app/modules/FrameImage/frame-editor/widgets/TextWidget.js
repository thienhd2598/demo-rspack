import React, { Fragment, useState } from "react";
import { Accordion, Col, Figure, Row, useAccordionToggle } from "react-bootstrap";
import textList from "../config/text.json";
import Drag from "../components/Drag";
import TRIGGER from "../config/trigger";

const CustomToggle = ({ children, eventKey }) => {
  const [show, setShow] = useState(false);

  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setShow(prev => !prev);
  });

  return (
    <span
      className="ml-4 py-2 px-3 cursor-pointer"
      style={{
        border: '1px solid #e9e9e9', borderRadius: 8, width: 'fit-content',
        ...(show ? {
          color: '#fff', background: '#ff5629', borderColor: '#ff5629'
        } : { borderColor: '#e9e9e9' })
      }}
      onClick={decoratedOnClick}
    >
      {children}
    </span>
  );
};


const TextWidget = () => {


  return (
    <Accordion key="text-widget">
      <div className="row d-flex flex-column">
        <CustomToggle eventKey="text-widget">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16" height="16" fill="currentColor"
            class="bi bi-type"
            viewBox="0 0 16 16"
          >
            <path d="m2.244 13.081.943-2.803H6.66l.944 2.803H8.86L5.54 3.75H4.322L1 13.081zm2.7-7.923L6.34 9.314H3.51l1.4-4.156zm9.146 7.027h.035v.896h1.128V8.125c0-1.51-1.114-2.345-2.646-2.345-1.736 0-2.59.916-2.666 2.174h1.108c.068-.718.595-1.19 1.517-1.19.971 0 1.518.52 1.518 1.464v.731H12.19c-1.647.007-2.522.8-2.522 2.058 0 1.319.957 2.18 2.345 2.18 1.06 0 1.716-.43 2.078-1.011zm-1.763.035c-.752 0-1.456-.397-1.456-1.244 0-.65.424-1.115 1.408-1.115h1.805v.834c0 .896-.752 1.525-1.757 1.525" />
          </svg>
        </CustomToggle>
        <Accordion.Collapse eventKey="text-widget">
          <Row xs={2} className="mt-2" style={{ maxHeight: '30vh', overflow: 'auto' }}>
            {textList.map(({ type, id, width, height, fontSize, fontFamily, text }) => (
              <TextThumbnail
                key={`text-thumbnail-${id}`}
                data={{
                  id,
                  name: text,
                  width,
                  height,
                  fontSize,
                  fontFamily,
                  text: text,
                  "data-item-type": type,
                }}
                maxPx={80}
              />
            ))}
          </Row>
        </Accordion.Collapse>
      </div>
    </Accordion>
  )
};

export default TextWidget;

const TextThumbnail = ({ data, maxPx }) => (
  <Figure as={Col} className="d-flex flex-column justify-content-center align-items-center">
    <Drag
      dragType="copyMove"
      dragSrc={{
        trigger: TRIGGER.INSERT.TEXT,
        ...data,
      }}>
      <span
        style={{
          width: "100%",
          fontFamily: data.fontFamily,
          fontSize: data.fontSize - 12,
          textAlign: "center",
        }}>
        {data.name}
      </span>
    </Drag>
  </Figure>
);
