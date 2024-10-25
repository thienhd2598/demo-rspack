import React, { createContext, useContext, useMemo, useState } from "react";
import _ from 'lodash'

const CreateMultiContext = createContext();

export function useCreateMultiContext() {
  return useContext(CreateMultiContext);
}


export function CreateMultiProvider({ children }) {
  const [step, setStep] = useState(0);
  const [stepPassed, setStepPassed] = useState({})
  const [products, setProducts] = useState([])
  const [cacheStep1, setCacheStep1] = useState({})
  const [cacheStep2, setCacheStep2] = useState({})
  const [cacheStep3, setCacheStep3] = useState({})
  console.log('products', products)
  const value = useMemo(() => {
    return {
      step, setStep,
      products, setProducts,
      stepPassed, setStepPassed,
      cacheStep1, setCacheStep1,
      cacheStep2, setCacheStep2,
      cacheStep3, setCacheStep3
    }
  }, [step, products, stepPassed, cacheStep1, cacheStep2, cacheStep3])

  return (
    <CreateMultiContext.Provider value={value}>
      {children}
    </CreateMultiContext.Provider>
  );
}
