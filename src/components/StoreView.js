/*
 * Created by duydatpham@gmail.com on 20/01/2024
 * Copyright (c) 2024 duydatpham@gmail.com
 */
import React, { memo, useMemo, useState } from 'react';

export default memo(({ store, channel }) => {
    if (!!store)
        return <p className="d-flex mb-2" style={store?.status == 1 ? {} : { opacity: 0.5 }}  >
            <img style={{ width: 16, height: 16 }} src={channel?.logo_asset_url} className="mr-2" />
            <span className='fs-14' >{store?.name}</span></p>
    return "--"
})