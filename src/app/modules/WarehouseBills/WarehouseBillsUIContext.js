import React, { createContext, useContext, useState, useCallback } from "react";
import _ from 'lodash'

const WarehouseBillsUIContext = createContext();

export function useWarehouseBillsUIContext() {
  return useContext(WarehouseBillsUIContext);
}

export const WarehouseBillsUIConsumer = WarehouseBillsUIContext.Consumer;

export function WarehouseBillsUIProvider({ productsUIEvents, children }) {  

  const resetAll = useCallback(() => {    
  }, [])
  return (
    <WarehouseBillsUIContext.Provider value={{      
      resetAll
    }}>
      {children}
    </WarehouseBillsUIContext.Provider>
  );
}
