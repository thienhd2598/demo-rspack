import { useCallback, useState } from "react";

const useWorkHistory = (
  past,
  future,
  setPast,
  setFuture,
  setCurrentStageData
) => {  
  const [current, setCurrent] = useState(null);

  const goToPast = useCallback(() => {
    if (past.length > 0 && current) {
      const newFuture = [...current];
      const newStageData = [...past[past.length - 1]];
      setPast((prev) => [...prev.slice(0, past.length - 1)]);
      setFuture((prev) => [...prev, newFuture]);
      setCurrent(newStageData);
      setCurrentStageData(newStageData);
    }
  }, [past, current, setPast, setFuture, setCurrentStageData]);
  
  const goToFuture = useCallback(() => {
    if (future.length > 0 && current) {
      const newPast = [...current];
      const newStageData = future[future.length - 1];
      setFuture((prev) => [...prev.slice(0, future.length - 1)]);
      setPast((prev) => [...prev, newPast]);
      setCurrent(newStageData);
      setCurrentStageData(newStageData);
    }
  }, [future, current, setFuture, setPast, setCurrentStageData]);

  const recordPast = useCallback(
    (newCurrent) => {
      if (newCurrent.length !== 0 && current !== null) {
        if (
          // current === null &&
          JSON.stringify(newCurrent) !== JSON.stringify(current)
        ) {
          setPast((prev) => [...prev, current]);
          setFuture([]);
        }
      }
      if (newCurrent.length !== 0) {
        setCurrent(newCurrent);
      }
    },
    [past, current, setPast, setFuture, setCurrent],
  );

  const clearHistory = () => {
    setPast([]);
    setFuture([]);
  };

  return {
    goToPast,
    goToFuture,
    recordPast,
    clearHistory,
    setCurrent,
    current,
  };
};

export default useWorkHistory;
