import React, { Fragment, memo, useEffect, useMemo } from 'react';
import { useQuery } from "@apollo/client";
import { sum } from 'lodash';
import query_scCommentAggregate from '../../../../graphql/query_scCommentAggregate'

const CountRating = ({ whereCondition }) => {
    const { data: commentAggregate, loading: loadingCommentAggregate, refetch } = useQuery(query_scCommentAggregate, {
        variables: {
            search: {
                ...whereCondition
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetch()
    }, [whereCondition]);

    return (
        <Fragment>
            {commentAggregate?.scCommentAggregate?.count ? `(${+commentAggregate?.scCommentAggregate?.count})` : `(0)`}
        </Fragment>
    )
};

export default memo(CountRating);