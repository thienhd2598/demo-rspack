import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_scFailDeliveryOrderAggregate from '../../../../../graphql/query_scFailDeliveryOrderAggregate';

const OrderCount = ({ whereCondition }) => {
    const { data: dataOrderAggregate, loading: loadingOrderAggregate, refetch } = useQuery(query_scFailDeliveryOrderAggregate, {
        variables: {
            search: whereCondition
        }
    });

    // useEffect(() => {
    //     refetch()
    // }, [whereCondition]);
    return (
        <Fragment>
            {/* {refetch()} */}
            {dataOrderAggregate?.scFailDeliveryOrderAggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(OrderCount);