import { useEffect } from "react";

export function useOnKeyPress(callback, targetKey, depens = null) {
  useEffect(() => {
    const keyPressHandler = (e) => {
      const keyCodes = [112, 113, 114];
      if (keyCodes.includes(+e.keyCode)) {
        e.preventDefault();
      }
      if (e.key === targetKey) {
        callback(e);
      }
    };
    window.addEventListener("keydown", keyPressHandler);
    return () => {
      window.removeEventListener("keydown", keyPressHandler);
    };
  }, [callback, targetKey, depens]);
}
