/*
 * Created by duydatpham@gmail.com on 24/02/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { memo, useEffect } from "react";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { CreateMultiProvider,  } from "./CreateMultiContext";
import Page from './Page'
import {useIntl} from 'react-intl'
export default memo(() => {
    const { setBreadcrumbs } = useSubheader()    
    const {formatMessage} = useIntl()
    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({defaultMessage:'Thêm sản phẩm sàn hàng loạt'}),                
                pathname: '/products/create-onstore'                
            }
        ])
    }, [])

    return <CreateMultiProvider>
        <Page />
    </CreateMultiProvider>
})