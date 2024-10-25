import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_mktCampaignTemplateAggregate from "../../../../graphql/query_mktCampaignTemplateAggregate";

const CampaignTemplateCount = ({ whereCondition }) => {
    const { data: dataAggregate, refetch } = useQuery(query_mktCampaignTemplateAggregate, {
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
            {dataAggregate?.mktCampaignTemplateAggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(CampaignTemplateCount);