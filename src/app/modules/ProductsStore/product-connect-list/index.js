import React, { memo, useMemo } from 'react';
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import ProductConnectFilter from './ProductConnectFilter';
import ProductConnectListTable from './ProductConnectListTable';
import ProductStockConnectTable from './ProductStockConnectTable';
import { useIntl } from 'react-intl';

export default memo(() => {
    const { formatMessage } = useIntl();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const currentChannel = params?.channel || 'shopee';
    const currentType = params?.type || 'product';

    const store_id = useMemo(
        () => {
            try {
                let store = !!params?.store ? parseInt(params?.store) : null
                if (!store || Number.isNaN(store)) {
                    return {}
                }
                return {
                    store_id: {
                        _eq: store
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params.store]
    );

    const status = useMemo(
        () => {
            try {
                if (!params.type) {
                    return {}
                }
                return {
                    status: {
                        _eq: params?.type
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params.type]
    );

    let whereCondition = useMemo(
        () => {
            return {
                ...store_id,
                ...status,
                connector_channel_code: {
                    _eq: currentChannel
                },
            }
        }, [status, store_id, currentChannel]
    );

    return (
        <Card>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Quản lý liên kết' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Quản lý liên kết' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Quản lý liên kết' })} - UpBase`} />
            </Helmet>
            <CardBody>
                <ProductConnectFilter product_type={currentType == 'product' ? 1 : 2} />
                {currentType == 'product' ? <ProductConnectListTable /> : <ProductStockConnectTable />}
            </CardBody>
            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>
        </Card>
    )
})