import React from "react";

export function Checkbox({ notAllow = null, isSelected, onChange, children, disabled, title, size = 'checkbox-lg' }) {
  return (
    <>
      <input type="checkbox" style={{ display: "none" }} />
      <label className={`checkbox checkbox-single ${size} ${notAllow ? 'notAllow' : ''}`}>
        <input type="checkbox" checked={isSelected} onChange={onChange} disabled={disabled} />
        {children}
        <span ></span>
        &ensp;{title}
      </label>
    </>
  );
}
