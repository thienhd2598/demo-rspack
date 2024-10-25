import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_warehouse_inventory_transactions_aggregate from '../../../../graphql/query_warehouse_inventory_transactions_aggregate';

const WarehouseBillHistoryCount = ({ whereCondition }) => {
    const { data: dataWarehouseBillAggregate, loading: loadingWarehouseBillAggregate, refetch } = useQuery(query_warehouse_inventory_transactions_aggregate, {
        variables: {
            where: whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });


    // useMemo(() => {
    //     refetch()
    // }, [whereCondition]);

    return (
        <Fragment>
            {
                loadingWarehouseBillAggregate
                    ? '--'
                    : <span>{dataWarehouseBillAggregate?.warehouse_inventory_transactions_aggregate?.aggregate?.count || '0'}</span>
            }
        </Fragment>
    )
};

export default memo(WarehouseBillHistoryCount);