import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications'
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import FilterAutoReplyRating from './FilterAutoReplyRating';
import TableAutoReplyRating from './TableAutoReplyRating';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';


const AutoReplyRating = () => {
    const { setBreadcrumbs } = useSubheader();
    const { addToast } = useToasts()
    const { formatMessage } = useIntl()
    const location = useLocation();
    const history = useHistory()
    const params = queryString.parse(location.search.slice(1, 100000))

    const [ids, setIds] = useState([])

    const { loading: loadingStores, data: dataStores } = useQuery(query_sc_stores_basic, {
        variables: {
            context_channel: 'product'
        },
        fetchPolicy: "cache-and-network",
    });


    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: "Tự động trả lời đánh giá" }),
            },
        ]);
    }, []);

    return (
        <>
            <Helmet titleTemplate={formatMessage({ defaultMessage: `Tự động trả lời đánh giá {key}` }, { key: " - UpBase" })} defaultTitle={formatMessage(
                { defaultMessage: `Tự động trả lời đánh giá {key}` },
                { key: " - UpBase" }
            )}>
                <meta name="description"
                    content={formatMessage(
                        { defaultMessage: `Tự động trả lời đánh giá {key}` },
                        { key: " - UpBase" }
                    )} />
            </Helmet>
            <LoadingDialog show={false} />
            <Card>
                <CardBody>
                    <FilterAutoReplyRating channels={dataStores?.op_connector_channels || []} />
                    <TableAutoReplyRating dataStores={dataStores} />
                </CardBody>
            </Card>

            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: "smooth",
                    });
                }}>
                <span className="svg-icon">
                    <SVG
                        src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
                        title={" "}
                    ></SVG>
                </span>
            </div>
        </>
    )
}

export default AutoReplyRating

export const actionKeys = {
    "customer_service_auto_reply_rating": {
        router: '/customer-service/auto-reply-rating',
        actions: ["sc_stores", "op_connector_channels", "scGetSetupAutomaticReplies", "scGetAutoReplyTemplate", "scDeleteTemplateReply", "scGetAutoReplyTemplate"],
        name: 'Thêm/Cập nhật mẫu đánh giá',
        group_code: 'customer_config_rate',
        group_name: 'Cài đặt trả lời đánh giá',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng',
    },
    "customer_service_auto_reply_rating_setting": {
        router: '/customer-service/auto-reply-rating',
        actions: ["scUpdateMapTemplateInStore", "scGetSetupAutomaticReplies", "scGetAutoReplyTemplate", "scSaveReplyTemplate"],
        name: 'Cài đặt đánh giá tự động',
        group_code: 'customer_config_rate',
        group_name: 'Cài đặt trả lời đánh giá',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng',
    }
  };
