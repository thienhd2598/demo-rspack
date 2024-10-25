import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { initialStageDataList } from "./utils/initilaStageDataList";

const FrameEditorContext = createContext();

export function useFrameEditorContext() {
    return useContext(FrameEditorContext);
};

export function FrameEditorProvider({ children }) {
    const [optionsTypeFrame, setOptionsTypeFrame] = useState([
        { value: "https://d3plrvcei1qcpw.cloudfront.net/file/ea3e8d5d-56c4-4033-b513-346ceccde897.png", label: 'Khung khu vực ảnh sản phẩm' },        
    ]);
    const [currentStageData, setCurrentStageData] = useState(initialStageDataList);

    const addCurrentStageData = useCallback(
        (attrNew) => {
            setCurrentStageData(prev => prev.concat(attrNew))
        }, []
    );

    const updateCurrentStageData = useCallback(
        (id, attrsUpdate) => {
            setCurrentStageData(prev => prev.map(item => {
                if (item?.id == id) {
                    return {
                        ...item,
                        attrs: {
                            ...item.attrs,
                            ...attrsUpdate
                        }
                    }
                }

                return item;
            }));
        }, []
    );    

    const deleteCurrentStageData = useCallback(
        (ids) => {
            setCurrentStageData(prev => prev?.filter(item => !ids?.includes(item?.id)));
        }, []
    );

    const values = useMemo(() => {
        return {
            currentStageData, addCurrentStageData, optionsTypeFrame, setOptionsTypeFrame,
            updateCurrentStageData, deleteCurrentStageData, setCurrentStageData
        }
    }, [currentStageData, updateCurrentStageData, optionsTypeFrame]);

    return (
        <FrameEditorContext.Provider value={values}>
            {children}
        </FrameEditorContext.Provider>
    )
}