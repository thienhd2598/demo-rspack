/*
 * Created by duydatpham@gmail.com on 18/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client'
import React, { memo } from 'react'
import query_sme_catalog_product_aggregate from '../../../../../graphql/query_sme_catalog_product_aggregate'
import { getQueryByType } from '../../../Products/ProductsUIHelpers'

export default memo(({ type }) => {
    const { data, loading } = useQuery(query_sme_catalog_product_aggregate, {
        variables: {
            where: getQueryByType(type)
        },
        fetchPolicy: 'cache-and-network'
    })
    // if (loading)
    //     return <span>&ensp;<span className="spinner spinner-primary"></span>&ensp;</span>
    return <span>&ensp;({data?.sme_catalog_product_aggregate?.aggregate?.count})&ensp;</span>
})