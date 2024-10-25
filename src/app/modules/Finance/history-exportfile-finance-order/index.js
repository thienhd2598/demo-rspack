
import React, { useLayoutEffect } from 'react'
import { Helmet } from 'react-helmet';
import { ArrowBackIos } from '@material-ui/icons';
import { useIntl } from 'react-intl';
import { useSubheader } from '../../../../_metronic/layout';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import Table from './Table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import { useLocation } from "react-router-dom";
import queryString from "querystring";

const HistoryExportFileFinanceOrder = () => {
    const { formatMessage } = useIntl()
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(useLocation().search.slice(1, 100000));

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: "Lịch sử xuất dữ liệu" }),
            },
        ]);
    }, []);

    return (
        <>
            <a
                href={`/finance/manage-finance-order${params?.type == 2 ? '?page=1&tab=2' : '?page=1&tab=1'}`}
                className="mb-5"
                style={{ display: "block", color: "#ff5629" }}
            >
                <ArrowBackIos />
                {formatMessage({ defaultMessage: "Quay lại danh sách đơn bán hàng " })}
            </a>
            <Card>
                <Helmet
                    titleTemplate={formatMessage({ defaultMessage: "Lịch sử xuất dữ liệu" }) + " - Upbase"}
                    defaultTitle={formatMessage({ defaultMessage: "Lịch sử xuất dữ liệu" }) + " - Upbase"}
                >
                    <meta name="description" content={formatMessage({ defaultMessage: "Lịch sử xuất dữ liệu" }) + "- Upbase"} />
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

export default HistoryExportFileFinanceOrder
