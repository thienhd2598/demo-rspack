import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import query_sme_inventory_checklist_items_aggregate from '../../../../graphql/query_sme_inventory_checklist_items_aggregate';

const InventoryCountStatus = ({ whereCondition, sme_inventory_checklist_items }) => {
    let { data: dataAggregate, refetch } = useQuery(query_sme_inventory_checklist_items_aggregate, {
        variables: {
            where: whereCondition
        }
    });
    useEffect(() => {
        refetch();
    }, [sme_inventory_checklist_items]);

    return (
        <Fragment>
            {dataAggregate?.sme_inventory_checklist_items_aggregate?.aggregate?.count || '0'}
        </Fragment>
    )
};

export default memo(InventoryCountStatus);