import React, { Fragment, memo, useEffect } from 'react';
import { useQuery } from "@apollo/client";
import query_warehouse_bills_aggregate from "../../../../graphql/query_warehouse_bills_aggregate";

const WarehouseBillCount = ({ whereCondition }) => {
    const { data: dataWarehouseBillAggregate, loading: loadingWarehouseBillAggregate, refetch } = useQuery(query_warehouse_bills_aggregate, {
        variables: {
            where: whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });


    // useEffect(() => {
    //     refetch()
    // }, [whereCondition]);
    return (
        <Fragment>
            {
                loadingWarehouseBillAggregate
                    ? '--'
                    : <span>{dataWarehouseBillAggregate?.warehouse_bills_aggregate?.aggregate?.count || '0'}</span>
            }
        </Fragment>
    )
};

export default memo(WarehouseBillCount);