import React from 'react'
const { useState, useMemo } = React;

export const useHover = () => {
  const [hovered, setHovered] = useState();
  
  const eventHandlers = useMemo(() => ({
    onMouseOver() { setHovered(true); },
    onMouseOut() { setHovered(false); }
  }), []);
  
  return [hovered, eventHandlers];
}

