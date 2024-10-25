/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo, useMemo, useState } from 'react'
import _ from 'lodash'


export default memo(({
    file, style
}) => {
    const [preview, setPreview] = useState()

    useMemo(async () => {
        if (!!file) {
            let reader = new FileReader();
            let url = reader.readAsDataURL(file);

            reader.onloadend = function (e) {
                let img = new Image()
                img.onload = function (imageEvent) {
                    setPreview(e.target.result)

                }
                img.src = e.target.result;
            }
        }
    }, [file]);

    return <img className="image-input-wrapper" style={style} src={preview} />
})