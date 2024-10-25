import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_summaryFinanceOrderChannel from '../../../../../graphql/query_summaryFinanceOrderChannel';
import { sum } from 'lodash';

const OrderCount = ({ whereCondition, channel }) => {
    const { data: dataOrderAggregate, loading: loadingOrderAggregate, refetch } = useQuery(query_summaryFinanceOrderChannel, {
        variables: {
            ...whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetch()
    }, [whereCondition]);
    const total = useMemo(() => {
        return sum(dataOrderAggregate?.summaryFinanceOrderChannel?.map(item => item?.count_total))
    }, [dataOrderAggregate])
    return (
        <Fragment>
            {/* {refetch()} */}
            {!channel ? total : dataOrderAggregate?.summaryFinanceOrderChannel?.find(cn => cn?.connector_channel_code == channel)?.count_total || '0'}
        </Fragment>
    )
};

export default memo(OrderCount);