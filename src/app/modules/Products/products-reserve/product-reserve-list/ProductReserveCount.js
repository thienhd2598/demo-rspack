import React, { Fragment, memo, useEffect } from 'react';
import { useQuery } from "@apollo/client";
import query_warehouse_reserve_tickets_aggregate from '../../../../../graphql/query_warehouse_reserve_tickets_aggregate';

const ProductReserveCount = ({ whereCondition }) => {
    const { data: dataWarehouseReserveTicketsAggregate, loading: loadingWarehouseReserveTicketsAggregate, refetch } = useQuery(query_warehouse_reserve_tickets_aggregate, {
        variables: {
            where: whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });

    return (
        <Fragment>
            {
                loadingWarehouseReserveTicketsAggregate
                    ? '--'
                    : <span>{dataWarehouseReserveTicketsAggregate?.warehouse_reserve_tickets_aggregate?.aggregate?.count || '0'}</span>
            }
        </Fragment>
    )
};

export default memo(ProductReserveCount);