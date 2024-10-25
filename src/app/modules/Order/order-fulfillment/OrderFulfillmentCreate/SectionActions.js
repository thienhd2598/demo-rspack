import React, { Fragment, memo, useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, TextArea } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { Field, useFormikContext } from "formik";
import { RadioGroup } from "../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { OPTIONS_CONFIG_PICKUP } from "../OrderFulfillmentHelper";
import { useQuery } from "@apollo/client";
import query_scSfPackageCount from "../../../../../graphql/query_scSfPackageCount";
import { useOrderFulfillmentContext } from "../context/OrderFulfillmentContext";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import clsx from "clsx";
const Sticky = require('sticky-js');

const SectionActions = ({ onCreateOrderFulfillment }) => {
    const { ids, isInitLoadPackages, isLoadPackages, searchParams } = useOrderFulfillmentContext();
    const { values, setFieldValue } = useFormikContext();
    const { formatMessage } = useIntl();

    const { data, loading, refetch } = useQuery(query_scSfPackageCount, {
        variables: {
            search: {
                is_connected: 1,
                is_smart_fulfillment: 1,
                ...searchParams
            }
        },
        skip: isInitLoadPackages,
        fetchPolicy: "cache-and-network",
    });

    useMemo(() => refetch(), [isLoadPackages]);

    useEffect(() => {
        requestAnimationFrame(() => {
            new Sticky('.sticky')
        })
    }, []);

    useMemo(() => refetch(), [isInitLoadPackages]);

    const [countSIO, countMIO] = useMemo(() => {
        const countSIO = ids?.filter(item => item?.is_sio == 1)?.length;
        const countMIO = ids?.filter(item => item?.is_sio == 0)?.length;

        return [countSIO, countMIO]
    }, [ids]);

    console.log({ values, OPTIONS_CONFIG_PICKUP })

    return (
        <Card className="sticky" data-sticky="true" data-margin-top="60">
            <CardHeader title={formatMessage({ defaultMessage: 'Tạo danh sách xử lý' })} />
            <CardBody>
                <div className='form-group'>
                    <label className="col-form-label">{formatMessage({ defaultMessage: 'Thiết lập danh sách nhặt hàng' })}</label>
                    <div
                        className="radio-inline flex-column"
                        onChange={e => {
                            setFieldValue('__changed__', true)
                            const value = e.target.value;

                            setFieldValue('session_sub_pickup_type', value == 'grp' ? ['mio', 'sio'] : []);
                            setFieldValue('session_pickup_type', e.target.value);
                        }}
                    >
                        {OPTIONS_CONFIG_PICKUP.map(_op => {
                            return (
                                <Fragment>
                                    <label key={`op-${_op.value}`} className="radio cursor-pointer mb-2">
                                        <input type="radio" value={_op.value} checked={values['session_pickup_type'] == _op.value} />
                                        <span></span>
                                        {_op.label}
                                        {!!_op?.sub && <><br />{_op?.sub}</>}
                                        {!!_op?.tooltip && <OverlayTrigger
                                            overlay={
                                                <Tooltip>
                                                    {_op?.tooltip}
                                                </Tooltip>
                                            }
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="ml-1 bi bi-info-circle" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                            </svg>
                                        </OverlayTrigger>}
                                    </label>
                                    {_op?.subOptions?.length > 0 && <div className="d-flex flex-column ml-8 mb-2">
                                        {_op?.subOptions?.map(sub => (
                                            <label key={`sub--${sub?.value}`} className="mb-2 checkbox checkbox-primary">
                                                <input 
                                                    type="checkbox"
                                                    disabled={(values['session_sub_pickup_type']?.length == 1 && values['session_sub_pickup_type']?.some(val => val == sub.value)) || values['session_pickup_type'] != 'grp'}
                                                    checked={values['session_sub_pickup_type']?.some(val => val == sub.value)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        const newValues = values['session_sub_pickup_type']?.some(val => val == sub?.value)
                                                            ? values['session_sub_pickup_type']?.filter(val => val != sub?.value)
                                                            : values['session_sub_pickup_type']?.concat(sub?.value);

                                                        setFieldValue('session_sub_pickup_type', newValues);
                                                    }}
                                                />
                                                <span></span>
                                                &ensp;{sub.label}
                                            </label>
                                        ))}</div>
                                    }
                                </Fragment>
                            )
                        })}
                    </div>
                </div>
                <Field
                    name="session_pickup_note"
                    component={TextArea}
                    rows={3}
                    cols={['col-12', 'col-12']}
                    countChar
                    maxChar={255}
                    maxLength={255}
                    label={formatMessage({ defaultMessage: 'Ghi chú' })}
                    placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                    nameTxt={"--"}
                    customFeedbackLabel={' '}
                />
                <div className="w-100" style={{ height: 1, background: '#ebedf3' }} />
                <div className="d-flex flex-column mt-6 mb-2">
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện hàng đã chọn: {count}' }, { count: ids?.length })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có 1 sản phẩm: {count}' }, { count: countSIO })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có nhiều sản phẩm: {count}' }, { count: countMIO })}</span>
                    <button
                        className="mt-1 w-100 btn btn-primary btn-elevate"
                        disabled={ids?.length == 0}
                        onClick={() => onCreateOrderFulfillment(values, ids?.length, false, () => setFieldValue('__changed__', false))}
                    >
                        {formatMessage({ defaultMessage: 'Tạo danh sách' })}
                    </button>
                </div>
                <div className="d-flex flex-column mt-6 mb-2">
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện hàng theo bộ lọc: {count}' }, { count: data?.scSfPackageCount?.count || 0 })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có 1 sản phẩm: {count}' }, { count: data?.scSfPackageCount?.count_sio || 0 })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có nhiều sản phẩm: {count}' }, { count: data?.scSfPackageCount?.count_mio || 0 })}</span>
                    <button
                        className="mt-1 w-100 btn btn-outline-primary btn-elevate"
                        disabled={!(data?.scSfPackageCount?.count > 0)}
                        onClick={() => onCreateOrderFulfillment(values, data?.scSfPackageCount?.count, true, () => setFieldValue('__changed__', false))}
                    >
                        {formatMessage({ defaultMessage: 'Tạo danh sách theo bộ lọc' })}
                    </button>
                </div>
            </CardBody>
        </Card>
    )
}

export default memo(SectionActions);