
import { ArrowBackIos } from '@material-ui/icons';
import React, { useLayoutEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import Table from './Table';
import queryString from "querystring";
import SVG from "react-inlinesvg";
import { useLocation } from "react-router-dom";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import { useSubheader } from '../../../../../_metronic/layout';

const CustomerExportHistory = () => {
    const { formatMessage } = useIntl()
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(useLocation().search.slice(1, 100000));

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: "Lịch sử xuất thông tin khách hàng" }),
            },
        ]);
    }, []);

    return (
        <>
            <a
                href={`/customer-service/customer-info`}
                className="mb-5"
                style={{ display: "block", color: "#ff5629" }}
            >
                <ArrowBackIos />
                {formatMessage({ defaultMessage: "Quay lại Danh sách khách hàng" })}
            </a>
            <Card>
                <Helmet
                    titleTemplate={formatMessage({ defaultMessage: "Lịch sử xuất thông tin khách hàng" }) + " - Upbase"}
                    defaultTitle={formatMessage({ defaultMessage: "Lịch sử xuất thông tin khách hàng" }) + " - Upbase"}
                >
                    <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử xuất thông tin khách hàng" }) + "- Upbase"} />
                </Helmet>

                <CardBody>
                    <Table />
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
    );
}

export default CustomerExportHistory
