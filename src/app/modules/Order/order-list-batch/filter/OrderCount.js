import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_scPackageAggregate from '../../../../../graphql/query_scPackageAggregate';
const OrderCount = ({ whereCondition, search }) => {
    const { data: dataPackAggregate, loading: loadingOrderAggregate, refetch } = useQuery(query_scPackageAggregate, {
        variables: {
            search: whereCondition
        }
    });

    useEffect(() => {
        refetch();
    }, [search]);

    return (
        <Fragment>
            {dataPackAggregate?.scPackageAggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(OrderCount);