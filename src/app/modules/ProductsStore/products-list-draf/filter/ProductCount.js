/*
 * Created by duydatpham@gmail.com on 18/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client'
import React, { memo } from 'react'
import query_ScGetSmeProducts from '../../../../../graphql/query_ScGetSmeProducts'


export default memo(({ whereCondition }) => {
    const { data, loading } = useQuery(query_ScGetSmeProducts, {
        variables: {
            ...whereCondition,
            per_page: 1
        },
        fetchPolicy: 'cache-and-network'
    })
    return <span style={{fontSize: '18'}}>{data?.ScGetSmeProducts?.total ?? '--'}</span>
})