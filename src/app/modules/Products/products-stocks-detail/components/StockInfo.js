/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import { Field } from "formik";
import _ from "lodash";
import React, { memo, useMemo } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { formatNumberToCurrency } from "../../../../../utils";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader, CardHeaderToolbar, Input } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
export default memo(({ variant, isMutilUnit, isSyncVietful }) => {
    const { formatMessage } = useIntl()
    return <Card>
        <CardHeader title={formatMessage({ defaultMessage: "TỒN KHO" })}>
            <CardHeaderToolbar>
            </CardHeaderToolbar>
        </CardHeader>
        <CardBody>
            <div className="col-12 row">
                <div className="col-4">
                    <Field
                        name="variantUnit"
                        component={Input}
                        label={formatMessage({ defaultMessage: "Đơn vị tính" })}
                        disabled={isMutilUnit || isSyncVietful}
                        type="text"
                        cols={['col-4', 'col-6']}
                    />
                </div>
                <div className="col-4">
                    <Field
                        name="stockWarning"
                        component={Input}
                        label={formatMessage({ defaultMessage: "Cảnh báo tồn " })}
                        type="number"
                        decimalScale={0}
                        cols={['col-4', 'col-6']}
                    />
                </div>
            </div>
            <table className="table table-bordered table table-vertical-center product-list overflow-hidden">
                <thead>
                    <tr className="header-member">
                        <th style={{ fontSize: '14px', width: '16%' }}>{formatMessage({ defaultMessage: 'Kho' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Tồn kho thực tế' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Tạm giữ' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Tạm ứng' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Dự trữ' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}</th>
                        <th style={{ textAlign: 'center', fontSize: '14px', width: '14%' }} >{formatMessage({ defaultMessage: 'Đang vận chuyển' })}</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        variant.items?.map((__, _idx) => {
                            return <tr key={`row-store-${_idx}`} >
                                <td>{__.sme_store?.name}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_actual)}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_allocated)}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_preallocate)}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_reserve)}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_available)}</td>
                                <td style={{ textAlign: 'center' }} >{formatNumberToCurrency(__.stock_shipping)}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </CardBody>
    </Card>
})