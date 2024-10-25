import { useEffect, useRef } from "react";

function shallowEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (!(a instanceof Object) || !(b instanceof Object)) {
    return false;
  }

  const keys = Object.keys(a);
  const { length } = keys;

  if (length !== Object.keys(b).length) {
    return false;
  }

  for (let i = 0; i < length; i += 1) {
    const key = keys[i];

    if (!(key in b)) {
      return false;
    }

    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

function shallowCompare(prevValue, currValue) {
  if (!prevValue || !currValue) {
    return false;
  }

  if (prevValue === currValue) {
    return true;
  }

  if (prevValue.length !== currValue.length) {
    return false;
  }

  for (let i = 0; i < prevValue.length; i += 1) {
    if (!shallowEqual(prevValue[i], currValue[i])) {
      return false;
    }
  }

  return true;
}

function useShallowCompare(dependencies) {
  const ref = useRef([]);
  const updateRef = useRef(0);

  if (!shallowCompare(ref.current, dependencies)) {
    ref.current = dependencies;
    updateRef.current += 1;
  }

  return [updateRef.current];
}

export function useShallowEffect(cb, dependencies) {
  useEffect(cb, useShallowCompare(dependencies));
}
