import React, { Fragment, memo, useMemo, useCallback } from 'react';
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useIntl } from 'react-intl';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import { TABS_REPORT_PRODUCT, TABS_REPORT_PRODUCT_EFFECTIVE, TABS_REPORT_PRODUCT_NEED_IMPROVE } from '../ReportProductHelper';
import clsx from 'clsx';
import TableSmeProductGMV from './TableSmeProductGMV';
import TableSmeProductQuantity from './TableSmeProductQuantity';
import TableSmeProductImproveGVM from './TableSmeProductImproveGVM';
import TableSmeProductImproveCancel from './TableSmeProductImproveCancel';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import mutate_report_smeproductGMVExport from '../../../../../graphql/mutate_report_smeproductGMVExport';
import { useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { useToasts } from 'react-toast-notifications';

const ReportSmeProduct = ({ tabActive, variables, dataStore }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));

    const {addToast} = useToasts()
    const [titleReportSmeProduct, tabsReportSmeProduct, typeReportSmeProduct] = useMemo(() => {
        if (tabActive == TABS_REPORT_PRODUCT[0].id) {
            return [
                formatMessage({ defaultMessage: 'Sản phẩm kho hiệu quả' }),
                TABS_REPORT_PRODUCT_EFFECTIVE,
                'effective'
            ]
        } else {
            return [
                formatMessage({ defaultMessage: 'Sản phẩm kho cần cải thiện' }),
                TABS_REPORT_PRODUCT_NEED_IMPROVE,
                'report_improve'
            ]
        }
    }, [tabActive]);

    const tabActiveEffective = useMemo(() => {
        if (!params?.tabSmeEffective)
            return TABS_REPORT_PRODUCT_EFFECTIVE[0].id;
        return params?.tabSmeEffective;
    }, [params?.tabSmeEffective]);

    const tabActiveNeedImprove = useMemo(() => {
        if (!params?.tabSmeNeedImprove)
            return TABS_REPORT_PRODUCT_NEED_IMPROVE[0].id;
        return params?.tabSmeNeedImprove;
    }, [params?.tabSmeNeedImprove]);

    const [reportSmeProductGMVExport] = useMutation(mutate_report_smeproductGMVExport, {
        awaitRefetchQueries: true,
      })

    const onExportFinanceReport = useCallback(async () => {
        try {
            const { data } = await reportSmeProductGMVExport({
                variables: {
                    from: +params?.from || dayjs().subtract(7, "day").startOf("day").unix(), 
                    to: +params?.to || dayjs().subtract(1, "day").startOf("day").unix(), 
                    store_ids: params?.store || '', 
                    channel_codes: params?.channel || '',
                    warehouses_ids: params?.warehouse || ''
                }
            });

            if (!!data?.report_smeproductGMVExport?.success) {
                const currentDateRangeTime = params?.from && params?.to ? [
                    new Date(params?.from*1000),
                    new Date(params?.to*1000),
                ] : [
                    new Date(dayjs().subtract(7, "day").startOf("day")),
                    new Date(dayjs().subtract(1, "day").startOf("day")),
                ]
                const nameFileExport = `Phantichhanghoakho_${dayjs(currentDateRangeTime[0]).format('DD/MM/YYYY').replaceAll('/', '')}_${dayjs(currentDateRangeTime[1]).format('DD/MM/YYYY').replaceAll('/', '')}.xlsx`;
                saveAs(data?.report_smeproductGMVExport?.data, nameFileExport)
                addToast(formatMessage({ defaultMessage: 'Xuất file thành công' }), {
                    appearance: "success",
                });
            } else {
                addToast(formatMessage({ defaultMessage: 'Xuất file thất bại' }), {
                    appearance: "error",
                });
            }
        } catch (err) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), {
                appearance: "error",
            });
        }
    }, [params])

    return (
        <Card className="my-4">
            <CardBody>
                <p className="txt-title mb-6" style={{ fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>
                    {titleReportSmeProduct}
                </p>
                <div className="d-flex mb-4" style={{ zIndex: 1 }}>
                    <div style={{ flex: 1 }}>
                        <ul className="nav nav-tabs">
                            {tabsReportSmeProduct?.map(tab => {
                                const activeTab = typeReportSmeProduct == 'effective'
                                    ? tab.id == tabActiveEffective
                                    : tab.id == tabActiveNeedImprove;

                                return (
                                    <li
                                        key={`sc-report-product-tab-${tab.id}`}
                                        className={`nav-item`}
                                        onClick={() => {
                                            history.push(`${location.pathname}?${queryString.stringify({
                                                ...params,
                                                [typeReportSmeProduct == 'effective' ? 'tabSmeEffective' : 'tabSmeNeedImprove']: tab.id
                                            })}`
                                            );
                                        }}
                                    >
                                        <a
                                            className={clsx('nav-link fs-14', { active: activeTab })}
                                        >
                                            {tab.title}
                                            {typeReportSmeProduct == 'report_improve' && (
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip>
                                                            {tab.id == 1
                                                                ? formatMessage({ defaultMessage: 'Doanh số 7 ngày gần nhất giảm hơn 30% so sánh với cùng kì trước.' })
                                                                : formatMessage({ defaultMessage: 'Danh sách sản phẩm có ít nhất 2% số lượng bị hoàn trả trong 30 ngày qua.' })
                                                            }
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                                        </svg>
                                                    </span>
                                                </OverlayTrigger>
                                            )}
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    {typeReportSmeProduct == 'effective' && <div className='col-1 d-flex mb-2'>
                        <button
                            type="submit"
                            className="w-100 btn btn-primary btn-elevate"
                            onClick={onExportFinanceReport}
                        >
                            {formatMessage({ defaultMessage: 'Xuất file' })}
                        </button>
                    </div>}
                </div>
                {typeReportSmeProduct == 'effective' && (
                    <Fragment>
                        {tabActiveEffective == TABS_REPORT_PRODUCT_EFFECTIVE[0].id && (
                            <TableSmeProductGMV
                                variables={variables}
                                dataStore={dataStore}
                            />
                        )}
                        {tabActiveEffective == TABS_REPORT_PRODUCT_EFFECTIVE[1].id && (
                            <TableSmeProductQuantity
                                variables={variables}
                                dataStore={dataStore}
                            />
                        )}
                    </Fragment>
                )}
                {typeReportSmeProduct != 'effective' && (
                    <Fragment>
                        {tabActiveNeedImprove == TABS_REPORT_PRODUCT_NEED_IMPROVE[0].id && (
                            <TableSmeProductImproveGVM
                                variables={variables}
                                dataStore={dataStore}
                            />
                        )}
                        {tabActiveNeedImprove == TABS_REPORT_PRODUCT_NEED_IMPROVE[1].id && (
                            <TableSmeProductImproveCancel
                                variables={variables}
                                dataStore={dataStore}
                            />
                        )}
                    </Fragment>
                )}
            </CardBody>
        </Card>
    )
};

export default memo(ReportSmeProduct);