/*
 * Created by duydatpham@gmail.com on 06/04/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import { useFormikContext } from "formik";
import React, { memo, useEffect, useRef } from "react";

export default memo(({ set }) => {
    const { values } = useFormikContext()
    const _refValue = useRef(values || {})

    useEffect(() => {        
        _refValue.current = values
    }, [values]);

    useEffect(() => {
        return () => {
            let newValues = _refValue.current || {};            
            Object.keys(newValues).forEach(_key => {
                if (_key.endsWith('::changed'))
                    delete newValues[_key]
            })
            !!set && set(_refValue.current || {})
        }
    }, [set])
    return null
})