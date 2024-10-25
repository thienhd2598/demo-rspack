import React, { memo, useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, TextArea } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { Field, useFormikContext } from "formik";
import { RadioGroup } from "../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { OPTIONS_CONFIG_PICKUP } from "../../SmartFulfillmentHelper";
import { usePickupGoodsContext } from "../../context/PickupGoodsContext";
import { useQuery } from "@apollo/client";
import query_scSfPackageCount from "../../../../../graphql/query_scSfPackageCount";
const Sticky = require('sticky-js');

const SectionActions = ({ onCreatePickupGoods }) => {
    const { ids, isInitLoadPackages, isLoadPackages } = usePickupGoodsContext();
    const { values, setFieldValue } = useFormikContext();
    const { formatMessage } = useIntl();
    const [warehouseId, setWarehouseId] = useState(null);

    useMemo(() => {
        if (!isLoadPackages) return;
        setWarehouseId(values?.smeWarehouse);
    }, [isLoadPackages, values?.smeWarehouse]);

    const { data, loading, refetch } = useQuery(query_scSfPackageCount, {
        variables: {
            search: {
                is_smart_fulfillment: 1,
                warehouse_filer: 2,
                ...(warehouseId ? {
                    warehouse_id: warehouseId
                } : {})
            }
        },
        skip: isInitLoadPackages,
        fetchPolicy: "cache-and-network",
    });

    useEffect(() => {
        requestAnimationFrame(() => {
            new Sticky('.sticky')
        })
    }, []);

    useMemo(() => refetch(), [isInitLoadPackages]);

    useMemo(() => {
        console.log(`CHECK DATA: `, data);
    }, [data]);

    const [countSIO, countMIO] = useMemo(() => {
        const countSIO = ids?.filter(item => item?.is_sio == 1)?.length;
        const countMIO = ids?.filter(item => item?.is_sio == 0)?.length;

        return [countSIO, countMIO]
    }, [ids]);

    return (
        <Card className="sticky" data-sticky="true" data-margin-top="60">
            <CardHeader title={formatMessage({ defaultMessage: 'Tạo phiếu nhặt hàng' })} />
            <CardBody>
                <div className="mb-2">
                    <Field
                        name="session_pickup_type"
                        component={RadioGroup}
                        isCenter
                        customFeedbackLabel={' '}
                        direction="column"
                        label={formatMessage({ defaultMessage: "Thiết lập danh sách nhặt hàng" })}
                        options={OPTIONS_CONFIG_PICKUP}
                    />
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
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có 1 sản phẩm (SIO): {count}' }, { count: countSIO })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có nhiều sản phẩm (MIO): {count}' }, { count: countMIO })}</span>
                    <button
                        className="mt-1 w-100 btn btn-primary btn-elevate"
                        disabled={ids?.length == 0}
                        onClick={() => onCreatePickupGoods(values, ids?.length, false, () => setFieldValue('__changed__', false))}
                    >
                        {formatMessage({ defaultMessage: 'Tạo phiếu' })}
                    </button>
                </div>
                <div className="d-flex flex-column mt-6 mb-2">
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện hàng theo bộ lọc: {count}' }, { count: data?.scSfPackageCount?.count || 0 })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có 1 sản phẩm (SIO): {count}' }, { count: data?.scSfPackageCount?.count_sio || 0 })}</span>
                    <span className="mb-2">{formatMessage({ defaultMessage: 'Kiện có nhiều sản phẩm (MIO): {count}' }, { count: data?.scSfPackageCount?.count_mio || 0 })}</span>
                    <button
                        className="mt-1 w-100 btn btn-outline-primary btn-elevate"
                        disabled={!(data?.scSfPackageCount?.count > 0)}
                        onClick={() => onCreatePickupGoods(values, data?.scSfPackageCount?.count, true, () => setFieldValue('__changed__', false))}
                    >
                        {formatMessage({ defaultMessage: 'Tạo phiếu theo bộ lọc' })}
                    </button>
                </div>
            </CardBody>
        </Card>
    )
}

export default memo(SectionActions);