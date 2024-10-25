import React, { createContext, useContext, useState, useCallback } from "react";
import _ from 'lodash'

const InventoryUIContext = createContext();

export function useInventoryUIContext() {
  return useContext(InventoryUIContext);
}

export const InventoryUIConsumer = InventoryUIContext.Consumer;

export function InventoryUIProvider({ productsUIEvents, children }) {
  const [productEditSchema, setProductEditSchema] = useState(null);

  const resetAll = useCallback(() => {
    setProductEditSchema(null)
  }, [])
  return (
    <InventoryUIContext.Provider value={{
      productEditSchema, setProductEditSchema,
      resetAll
    }}>
      {children}
    </InventoryUIContext.Provider>
  );
}
