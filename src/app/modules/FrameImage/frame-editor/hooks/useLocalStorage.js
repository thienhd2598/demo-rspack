const useLocalStorage = () => {
  const getValue = (key) =>
    window.localStorage.getItem(key) && window.localStorage.getItem(key) !== "null"
      ? JSON.parse(window.localStorage.getItem(key))
      : null;

  const setValue = (key, value) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return {
    getValue,
    setValue,
  };
};

export default useLocalStorage;
