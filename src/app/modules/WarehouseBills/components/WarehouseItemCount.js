import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_warehouse_bill_items_aggregate from '../../../../graphql/query_warehouse_bill_items_aggregate';

const WarehouseBillCount = ({ whereCondition, status }) => {
    const quantityCondition = useMemo(() => {
        if(!status) {
            return {state: {_eq: 0}}
        }
        if(status == 'notyet') {
            return {state: {_eq: 0}}
        } else if(status == 'all') {
            return {}
        } else if(status == 'khop') {
            return {state: {_eq: 1}}
        } else {
            return {_or: [{state: {_eq: 2}},{state: {_eq: 3}}]}
        }
    }, [status])
    const { data: dataWarehouseBillItemAggregate, loading: loadingWarehouseBillItemAggregate } = useQuery(query_warehouse_bill_items_aggregate, {
        variables: {
            where: {
                _and: [
                    whereCondition,
                    quantityCondition
                ]
            }
        },
        fetchPolicy: 'cache-and-network'
    });


    // useEffect(() => {
    //     refetch()
    // }, [whereCondition]);
    return (
        <Fragment>
            {
                loadingWarehouseBillItemAggregate
                    ? '--'
                    : <span>{dataWarehouseBillItemAggregate?.warehouse_bill_items_aggregate?.aggregate?.count || '0'}</span>
            }
        </Fragment>
    )
};

export default memo(WarehouseBillCount);