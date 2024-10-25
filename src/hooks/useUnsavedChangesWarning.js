/*
 * Created by duydatpham@gmail.com on 01/09/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { useState, useEffect } from "react";
import { Prompt } from "react-router-dom";
const useUnsavedChangesWarning = (
    message = "Are you sure want to discard changes?"
) => {
    const [isDirty, setDirty] = useState(false);

    useEffect(() => {
        //Detecting browser closing
        // window.onbeforeunload = isDirty && (() => message);

        return () => {
            window.onbeforeunload = null;
        };
    }, [isDirty]);

    const routerPrompt = <Prompt when={isDirty} message={message} />;

    return [routerPrompt, () => setDirty(true), () => setDirty(false)];
};

export default useUnsavedChangesWarning;