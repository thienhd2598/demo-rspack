import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_scReturnOrderAggregate from '../../../../../graphql/query_scReturnOrderAggregate';

const CountOrder = ({ searchTypes }) => {

    const { data: orderAggregate, refetch } = useQuery(query_scReturnOrderAggregate, {
        variables: {
          search: searchTypes,
        },
        fetchPolicy: "cache-and-network",
      });
    useEffect(() => {
        refetch()
    }, [searchTypes]);
    return (
        <Fragment>
            { orderAggregate?.scReturnOrderAggregate?.count ? orderAggregate?.scReturnOrderAggregate?.count : 0}
        </Fragment>
    )
};

export default memo(CountOrder);