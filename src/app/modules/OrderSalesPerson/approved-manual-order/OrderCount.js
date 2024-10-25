import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_scPackageAggregate from '../../../../graphql/query_scPackageAggregate';

const OrderCount = ({ whereCondition }) => {
    const { data: dataPackAggregate, loading: loadingOrderAggregate, refetch } = useQuery(query_scPackageAggregate, {
        variables: {
            search: whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetch()
    }, [whereCondition]);
    return (
        <Fragment>
            {/* {refetch()} */}
            {dataPackAggregate?.scPackageAggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(OrderCount);