import React, { Fragment, memo, useEffect, useMemo } from 'react';
import queryString from 'querystring';
import { useQuery } from "@apollo/client";
import query_sme_inventory_checklists_aggregate from '../../../../graphql/query_sme_inventory_checklists_aggregate';

const InventoryCount = ({ whereCondition }) => {
    const { data: inventoryChecklistsAggregate, loading, refetch } = useQuery(query_sme_inventory_checklists_aggregate, {
        variables: {
            where: whereCondition
        }
    });

    useEffect(() => {
        refetch()
    }, [whereCondition]);
    return (
        <Fragment>
            {/* {refetch()} */}
            {inventoryChecklistsAggregate?.sme_inventory_checklists_aggregate?.aggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(InventoryCount);