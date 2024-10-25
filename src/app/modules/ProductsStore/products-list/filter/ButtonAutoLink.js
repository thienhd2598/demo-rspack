/*
 * Created by duydatpham@gmail.com on 23/02/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import { useQuery } from "@apollo/client";
import React, { memo, useEffect } from "react";
import query_scGetJobAutoLinkSmeProduct from "../../../../../graphql/query_scGetJobAutoLinkSmeProduct";
import { formatNumberToCurrency } from "../../../../../utils";
import { useIntl } from "react-intl";

export default memo(({ onAutoLinkProduct, onAutoLinkProductInfo, product_type }) => {
    const { formatMessage } = useIntl();
    const { data, loading, refetch } = useQuery(query_scGetJobAutoLinkSmeProduct, {
        fetchPolicy: 'network-only',
        variables: {
            product_type
        }
    })

    useEffect(() => {
        let interval = setInterval(refetch, 5000);
        return () => clearInterval(interval)
    }, [])


    if (!!data?.scGetJobAutoLinkSmeProduct && data?.scGetJobAutoLinkSmeProduct?.total_processed != data?.scGetJobAutoLinkSmeProduct?.total_product)
        return <button
            className="btn mr-4"
            style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', position: 'relative' }}
            type="submit"
            onClick={async (e) => {
                e.preventDefault();
                !!onAutoLinkProductInfo && onAutoLinkProductInfo(true);
            }}>
            <span className="spinner spinner-primary " >&ensp;&ensp;&ensp;</span>  {formatMessage({ defaultMessage: 'Liên kết tự động' })}
            <div style={{
                height: 4, backgroundColor: '#E8ECEF',
                position: 'absolute',
                borderRadius: 6, overflow: 'hidden',
                bottom: 2, left: 2, right: 2
            }} >
                <div style={{
                    height: 4, position: 'absolute', top: 0, left: 0,
                    right: `${formatNumberToCurrency(100 - data?.scGetJobAutoLinkSmeProduct?.total_processed * 100 / (data?.scGetJobAutoLinkSmeProduct?.total_product || 1), 2, true)}%`, backgroundColor: '#FF562A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} >
                </div>
            </div>
        </button>
    return <button
        className="btn mr-4"
        style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
        type="submit"
        onClick={async (e) => {
            e.preventDefault();
            !!onAutoLinkProduct && onAutoLinkProduct(true);
        }}>
        {formatMessage({ defaultMessage: 'Liên kết tự động' })}
    </button>
})