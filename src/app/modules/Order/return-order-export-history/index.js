import React, { memo, useEffect, useMemo } from "react";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import OrderTable from "./OrderTable";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import { ArrowBack, ArrowBackIos } from "@material-ui/icons";
import { useIntl } from "react-intl";
export default memo(() => {
    const location = useLocation()
    const params = queryString.parse(location.search.slice(1, 100000));
    const currentChannel = params?.channel || 'shopee';
    const { appendBreadcrumbs, setToolbar } = useSubheader()
    const {formatMessage} = useIntl()
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

    const ref_id = useMemo(
        () => {
            try {
                if (!params.refId) return {};

                return {
                    ref_id: {
                        _ilike: `${params?.refId?.trim()}%`
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.refId]
    );

    const create_time = useMemo(
        () => {
            try {
                if (!params.gt || !params.lt) return {};

                return {
                    order_at: {
                        _gt: params?.gt,
                        _lt: params?.lt
                    }
                }
            } catch (error) {
                return {}
            }
        }, [params?.gt, params?.lt]
    );

    let whereCondition = useMemo(
        () => {
            return {
                ...store_id,
                ...status,
                ...ref_id,
                ...create_time,
                connector_channel_code: {
                    _eq: currentChannel
                },
                is_connected: {
                    _eq: 1
                }
            }
        }, [ref_id, status, store_id, currentChannel, create_time]
    );

    useEffect(() => {
        // appendBreadcrumbs({
        //   title: 'Cài đặt',
        //   pathname: `/setting`
        // })
        appendBreadcrumbs({
            title: formatMessage({defaultMessage:'Lịch sử xuất đơn hàng'}),
            pathname: ``
        })
    }, [location.pathname])


    return (
        <>
            <a href="/orders/refund-order" className='mb-2' style={{ color: '#ff5629' }} > <ArrowBackIos /> {formatMessage({defaultMessage:'Quay lại danh sách đơn hoàn'})}</a>
            <Card style={{ marginTop: 16 }}>
                <CardBody>
                    <OrderTable whereCondition={whereCondition} />
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
        </>
    )
});
