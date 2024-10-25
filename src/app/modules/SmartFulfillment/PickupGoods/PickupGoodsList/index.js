import React, { Fragment, memo, useLayoutEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import PickupGoodsFilter from "./PickupGoodsFilter";
import PickupGoodsTable from "./PickupGoodsTable";
import { useSubheader } from "../../../../../_metronic/layout";
import { useLocation } from 'react-router-dom';
import { Helmet } from "react-helmet-async";
import { useQuery } from "@apollo/client";
import query_sfListSessionPick from "../../../../../graphql/query_sfListSessionPick";
import queryString from 'querystring';

const PickupGoodsList = () => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [ids, setIds] = useState([]);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Danh sách phiếu nhặt hàng' }) }
        ])
    }, []);    

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit]);

    const type = useMemo(() => {
        try {
            if (!params?.type) return {};
            return { type: params?.type };
        } catch (error) {
            return {};
        }
    }, [params.type]);

    const code = useMemo(() => {
        try {
            if (!params?.code) return {};
            return { code: params?.code };
        } catch (error) {
            return {};
        }
    }, [params.code]);

    const status = useMemo(() => {
        try {
            if (!params?.status) return {};
            return { status: params?.status };
        } catch (error) {
            return {};
        }
    }, [params.status]);

    const sme_warehouse_id = useMemo(() => {
        try {
            if (!params?.sme_warehouse_id) return {};
            return { sme_warehouse_id: params?.sme_warehouse_id };
        } catch (error) {
            return {};
        }
    }, [params.sme_warehouse_id]);


    const range_time = useMemo(() => {
        try {
            if (!params.gt || !params.lt) return {};

            return {
                range_time: [Number(params?.gt), Number(params?.lt)],
            };
        } catch (error) {
            return {};
        }
    }, [params?.gt, params?.lt]);


    const variables = useMemo(() => {
        return {
            page,
            per_page: limit,
            ...range_time,
            ...status,
            ...type,
            ...code,
            ...sme_warehouse_id
        }
    }, [limit, page, range_time, status, type, code, sme_warehouse_id]);

    const { data: dataSfListSessionPick, loading: loadingSfListSessionPick, error: errorSfListSessionPick } = useQuery(query_sfListSessionPick, {
        variables,
        fetchPolicy: 'cache-and-network'
    });

    console.log({ dataSfListSessionPick });

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Danh sách phiếu nhặt hàng' })}
            defaultTitle={formatMessage({ defaultMessage: 'Danh sách phiếu nhặt hàng' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Danh sách phiếu nhặt hàng' })}
            />
        </Helmet>
        <Card>
            <CardBody>
                <PickupGoodsFilter />
                <PickupGoodsTable
                    limit={limit}
                    page={page}
                    ids={ids}
                    error={errorSfListSessionPick}
                    setIds={setIds}
                    loading={loadingSfListSessionPick}
                    data={dataSfListSessionPick?.sfListSessionPick}
                />
            </CardBody>
        </Card>
    </Fragment>
}

export default memo(PickupGoodsList);