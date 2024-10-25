import React, { Fragment, memo, useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from '../../../_metronic/_partials/controls';
import { useSubheader } from "../../../_metronic/layout";
import { Helmet } from "react-helmet-async";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../_metronic/_helpers";
import { ChevronRightOutlined } from "@material-ui/icons";
import BlockNews from "./components/BlockNews";
import axios from "axios";
import BlockSaleAnalys from "./components/BlockSaleAnalys";
import BlockRatio from "./components/BlockRatio";
import { useQuery } from "@apollo/client";
import query_overview_bars from "../../../graphql/query_overview_bars";
import query_overview_charts from "../../../graphql/query_overview_charts";
import query_overview_index from "../../../graphql/query_overview_index";
import query_overview_customer from "../../../graphql/query_overview_customer";
import query_overview_customer_area from "../../../graphql/query_overview_customer_area";
import BlockOperate from "./components/BlockOperate";
import BlockUser from "./components/BlockUser";
import { useIntl } from 'react-intl';
import BlockSteps from "./components/BlockSteps";
import query_guideStatus from "../../../graphql/query_guideStatus";
import { useSelector, shallowEqual } from "react-redux";
import { Redirect} from "react-router-dom";

const Dashboard = () => {
    const { formatMessage } = useIntl();
    const suhbeader = useSubheader();
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Tổng quan' }));
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const [loadingNews, setLoadingNews] = useState(false);
    const [dataNews, setDataNews] = useState([]);

    console.log(`USER: `, user);

    const { loading: loadingOverviewBars, data: dataOverViewBars } = useQuery(query_overview_bars, {
        fetchPolicy: 'cache-and-network'
    });
    const { loading: loadingOverviewCharts, data: dataOverViewCharts } = useQuery(query_overview_charts, {
        fetchPolicy: 'cache-and-network'
    });
    const { loading: loadingOverviewIndex, data: dataOverViewIndex } = useQuery(query_overview_index, {
        fetchPolicy: 'cache-and-network'
    });
    const { loading: loadingOverviewCustomer, data: dataOverviewCustomer } = useQuery(query_overview_customer, {
        fetchPolicy: 'cache-and-network'
    });
    const { loading: loadingOverviewCustomerArea, data: dataOverviewCustomerArea } = useQuery(query_overview_customer_area, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataGuideStatus } = useQuery(query_guideStatus, {
        fetchPolicy: 'cache-and-network'
    });

    useEffect(
        () => {
            setLoadingNews(true);

            fetch(process.env.REACT_APP_URL_NEWS)
                .then(res => res.json())
                .then(data => {
                    console.log({ data });
                    setDataNews(data?.posts);
                })
                .catch(err => {
                    console.log({ err })
                    setDataNews([])
                })
                .finally(() => setLoadingNews(false))
        }, []
    );

    const progress = useMemo(() => {
        if (!dataGuideStatus?.guideStatus) return 0;

        const [stepsDone, stepsAll] = [
            Object?.keys(dataGuideStatus?.guideStatus)?.filter(key => dataGuideStatus?.guideStatus[key] == 2 || dataGuideStatus?.guideStatus[key] == 1)?.length || 0,
            4
        ];

        return ((stepsDone / stepsAll) * 100).toFixed()

    }, [dataGuideStatus?.guideStatus]);

    if(user?.roles?.length && user?.roles?.every(role => role == 'order_nvbh')) {
        return <Redirect to={{pathname: "/order-sales-person/list-order"}}/>
    }

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Tổng quan' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Tổng quan' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Tổng quan' })} - UpBase`} />
            </Helmet>
            <div className="dashboard-wrapper row">
                <div className="col-9">
                    {!!dataGuideStatus?.guideStatus && Number(progress) != 100 && (
                        <Card className="py-4 px-6">
                            <BlockSteps
                                progress={progress}
                                dataGuideStatus={dataGuideStatus?.guideStatus}
                            />
                        </Card>
                    )}
                    <Card className="py-4 px-6">
                        <BlockOperate loading={loadingOverviewIndex} data={dataOverViewIndex} />
                    </Card>
                    <Card className="py-4 px-6">
                        <BlockSaleAnalys loading={loadingOverviewCharts} data={dataOverViewCharts} />
                        <BlockRatio loading={loadingOverviewBars} data={dataOverViewBars} />
                    </Card>
                    <Card className="py-4 px-6">
                        <BlockUser
                            loadingOverviewCustomer={loadingOverviewCustomer}
                            loadingOverviewCustomerArea={loadingOverviewCustomerArea}
                            dataOverviewCustomer={dataOverviewCustomer}
                            dataOverviewCustomerArea={dataOverviewCustomerArea}
                        />
                    </Card>
                </div>
                <div className="col-3 ">
                    <Card className="py-4 px-6">
                        <div className="d-flex justify-content-between align-items-center mb-6">
                            <h3 className="txt-title">{formatMessage({ defaultMessage: 'Bản tin' })}</h3>
                            <div
                                className='d-flex align-items-center justify-content-center cursor-pointer'
                                onClick={() => window.open('https://upbase.vn/blogs/', '_blank')}
                            >
                                <span className="fs-14">{formatMessage({ defaultMessage: 'Xem thêm' })}</span>
                                <ChevronRightOutlined className='ml-2' />
                            </div>
                        </div>
                        {loadingNews && <div className="text-center mt-4 mb-10">
                            <span className="spinner spinner-primary" />
                        </div>}
                        {!loadingNews && dataNews?.slice(0, 5)?.map((newInfo, index) => (
                            <div className="mb-6" key={`new-dashboard-${index}`}>
                                <BlockNews post={newInfo} />
                            </div>
                        ))}
                    </Card>
                </div>
            </div>

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
        </Fragment>

    )
};

export default memo(Dashboard);