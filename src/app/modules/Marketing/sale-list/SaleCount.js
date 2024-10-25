import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_mktCampaignAggregate from "../../../../graphql/query_mktCampaignAggregate";

const SaleCount = ({ whereCondition, params }) => {
    const { data: dataAggregate, refetch } = useQuery(query_mktCampaignAggregate, {
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
            {dataAggregate?.mktCampaignAggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(SaleCount);