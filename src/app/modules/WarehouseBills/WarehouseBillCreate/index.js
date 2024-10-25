/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import { useMutation, useQuery } from "@apollo/client";
import { Field, Formik } from "formik";
import _ from 'lodash';
import queryString from 'querystring';
import React, { memo, useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import SVG from "react-inlinesvg";
import { shallowEqual, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader, CardHeaderToolbar, InputVertical, TextArea } from "../../../../_metronic/_partials/controls";
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import mutate_warehouseUserCreateBill from "../../../../graphql/mutate_warehouseUserCreateBill";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { PRODUCT_TYPE_OPTIONS, PROTOCOL_IN, PROTOCOL_OUT } from "../WarehouseBillsUIHelper";
import { useIntl } from 'react-intl';
import DatePicker from 'rsuite/DatePicker';
import dayjs from "dayjs";
import WarehouseBillInTable from "./components/WarehouseBillInTable";
import WarehouseBillInExpireTable from "./components/WarehouseBillInExpireTable";
import WarehouseBillOutTable from "./components/WarehouseBillOutTable";
import WarehouseBillOutExpireTable from "./components/WarehouseBillOutExpireTable";
import ModalResult from "./components/ModalResult";
import query_warehouse_bills_by_pk from "../../../../graphql/query_warehouse_bills_by_pk";
import query_sme_catalog_inventory_items from "../../../../graphql/query_sme_catalog_inventory_items";
import { UNIT_ADDONS } from "../WarehouseBillsUIHelper";
import mutate_warehouseApproveBill from "../../../../graphql/mutate_warehouseApproveBill";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const stock_preallocate_status = {
    INCLUDE: 1,
    NOT_INCLUDE: 0
}

export default memo(({
    history,
}) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const type_warehouse_bill = useMemo(() => {
        return params?.type || 'in';
    },[params?.type])
    const warehouse_bill_id = useMemo(() => {
        return +params?.billId || null;
    },[params?.billId])
    const { addToast } = useToasts();

    const [warehouseUserCreateBill, { loading: loadingCreate }] = useMutation(mutate_warehouseUserCreateBill)
    const [warehouseApproveBill, { loading: loadingApprove }] = useMutation(mutate_warehouseApproveBill)
    const { setBreadcrumbs } = useSubheader();
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const [createSchema, setCreateSchema] = useState(null);
    const [isFocus, setIsFocus] = useState(false)
    const [selectedVariants,setSelectedVariants] = useState([])
    const [openResult, setOpenResult] = useState(false)
    const [dataError, setDataError] = useState([])
    const state = location.state

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Xuất nhập kho' }),
            },
            {
                title: type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'Tạo phiếu nhập kho' }) : formatMessage({ defaultMessage: 'Tạo phiếu xuất kho' }),
            }
        ])
    }, [type_warehouse_bill]);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network',
        variables: {
            where: {
                fulfillment_by: {
                    _eq: 1
                },
                status: {_eq: 10}
            }
        }
    })

    const { data: dataWarehouseBill, loading, error, refetch } = useQuery(query_warehouse_bills_by_pk, {
        variables: {
            id: Number(warehouse_bill_id)
        },
        fetchPolicy: 'cache-and-network',
        skip: !warehouse_bill_id
    });


    const { data: dataItem, loading: loadingDataItem } = useQuery(query_sme_catalog_inventory_items, {
        variables: {
            limit: dataWarehouseBill?.warehouse_bills_by_pk?.bill_items?.length,
            offset: 0,
            where: {
                variant: { 
                    is_combo: { _eq: 0 }, status: {_eq: 10},
                    sme_catalog_product: {
                        is_expired_date: {_eq: dataWarehouseBill?.warehouse_bills_by_pk?.product_type != 0}
                    },
                    product_status_id: {_is_null: true},
                    id: {_in: dataWarehouseBill?.warehouse_bills_by_pk?.bill_items?.map(item => item?.variant_id)}
                },
                sme_store_id: {
                    _eq: dataWarehouseBill?.warehouse_bills_by_pk?.sme_warehouse_id
                },
                // variant_id: {_in: dataWarehouseBill?.warehouse_bills_by_pk?.bill_items?.map(item => item?.variant_id)}
            },
        },
        fetchPolicy: 'network-only',
        skip: !dataWarehouseBill?.warehouse_bills_by_pk?.bill_items?.length,
        onCompleted: (data) => {
            setSelectedVariants(data?.sme_catalog_inventory_items)
        }
    });
    // const generateVerificationCode = useCallback(
    //     (setFieldValue) => {
    //         let verificationCode = 'UB'
    //         const now = new Date();
    //         const unixTimestamp = Math.floor(now.getTime() / 1000);
    //         const smeIdLast3Digits = user?.sme_id.toString().slice(-3)
    //         verificationCode += smeIdLast3Digits + '-' + unixTimestamp + '-' + (type_warehouse_bill == 'in' ? 'nhapkho' : 'xuatkho');
    //         if (setFieldValue) {
    //             setFieldValue('code', verificationCode)
    //         }
    //         return verificationCode
    //     }, []
    // );

    const warehouseIdDefault = () => {
        let sme_warehouses = dataWarehouse?.sme_warehouses || []
        let warehouse = {}
        if (sme_warehouses.length > 0) {
            warehouse = sme_warehouses.find((element) => element.is_default == 1)
            if(state?.warehouseId) {
                warehouse = sme_warehouses.find((element) => element?.id == state?.warehouseId)
            }
            return ({
                label: warehouse?.name,
                value: warehouse?.id
            })
        }
        return null
    }

    const warehouseVariants = useMemo(() => {
        const uniqVariants = selectedVariants?.reduce((result, value) => {
            const isExist = result?.some(item => item?.variant?.id == value?.variant?.id);

            result = isExist ? result : result.concat(value);
            return result
        }, [])
        return uniqVariants
    }, [selectedVariants]);

    useMemo(() => {

    }, [])

    const initialValues = useMemo(() => {
        if(dataWarehouseBill?.warehouse_bills_by_pk) {
            let result = {}
            const warehouse = dataWarehouse?.sme_warehouses?.find(wh => wh?.id == dataWarehouseBill?.warehouse_bills_by_pk?.sme_warehouse_id)
            const warehouseItem = dataWarehouseBill?.warehouse_bills_by_pk?.bill_items?.map(item => {
                result[`bill-${item?.variant_id}-qty`] = item?.quantity_plan
                if(dataWarehouseBill?.warehouse_bills_by_pk?.product_type == 1) {
                    result[`bill-${item?.variant_id}-lot-code`] = item?.expired_info?.lotSerial
                    result[`bill-${item?.variant_id}-expirationDate`] = item?.expired_info?.expiredDate
                    result[`bill-${item?.variant_id}-productionDate`] = item?.expired_info?.manufactureDate
                }
                return result
            })
            console.log(result)
            return {
                ...result,
                warehouseId: {
                    label: warehouse?.name,
                    value: warehouse?.id
                } || warehouseIdDefault(),
                protocol:  _.find(PROTOCOL_IN, _bill => _bill.value == dataWarehouseBill?.warehouse_bills_by_pk?.protocol),
                note: dataWarehouseBill?.warehouse_bills_by_pk?.note || '',
                productType: dataWarehouseBill?.warehouse_bills_by_pk?.product_type ? PRODUCT_TYPE_OPTIONS?.find(option => option.value == dataWarehouseBill?.warehouse_bills_by_pk?.product_type) : PRODUCT_TYPE_OPTIONS?.find(option => option.value == 0),
                expectReceiveTime: dataWarehouseBill?.warehouse_bills_by_pk?.estimated_delivery_at ? dataWarehouseBill?.warehouse_bills_by_pk?.estimated_delivery_at : null,
                __changed__: false
            }
        }
        const fieldValues = {}
        // selectedVariants?.reduce(
        //     (result, bill) => {
        //         fieldValues[`bill-${bill?.variant?.id}-stock_preallocate`] = !!bill?.is_include_stock_preallocate;
        //         fieldValues[`bill-${bill?.variant?.id}-stock_preallocate-qty`]= bill?.stock_preallocate;
        //         fieldValues[`bill-${bill?.variant?.id}-qty`] = bill?.expire_info?.quantity != null ? bill?.expire_info?.quantity : undefined;
        //         fieldValues[`bill-${bill?.variant?.id}-expirationDate`] = bill?.expire_info ? dayjs(bill?.expire_info?.expiredDate, 'DD-MM-YYYY').startOf('day').unix() : undefined;
        //         fieldValues[`bill-${bill?.variant?.id}-lot-code`] = bill?.expire_info ? bill?.expire_info?.lotSerial : undefined;
        //         fieldValues[`bill-${bill?.variant?.id}-productionDate`] = bill?.expire_info ? dayjs(bill?.expire_info?.manufactureDate, 'DD-MM-YYYY').startOf('day').unix(): undefined;
        //         fieldValues[`bill-${bill?.variant?.id}-price`] = bill?.price || 0;
        //         fieldValues[`bill-${bill?.variant?.id}-discount`] = bill?.discount_value || 0;
        //         fieldValues[`bill-${bill?.variant?.id}-discount-unit`] = _.find(UNIT_ADDONS, _unit => _unit.value == bill?.discount_type) || UNIT_ADDONS[0];
                
                
        //         return result;
        //     }, {}
        // );
        return {
            warehouseId: warehouseIdDefault(),
            protocol: state?.protocol 
                ? (type_warehouse_bill == 'in' ? _.find(PROTOCOL_IN, _bill => _bill.value == state?.protocol) : _.find(PROTOCOL_OUT, _bill => _bill.value == state?.protocol)) 
                : type_warehouse_bill == 'in' ? _.find(PROTOCOL_IN, _bill => _bill.value == 2) : _.find(PROTOCOL_OUT, _bill => _bill.value == 1),
            note: state?.note ? state?.note : '',
            expectReceiveTime: state?.estimated_delivery_at ? state?.estimated_delivery_at : null,
            productType: state?.productType ? PRODUCT_TYPE_OPTIONS?.find(option => option.value == state?.productType) : PRODUCT_TYPE_OPTIONS?.find(option => option.value == 0),
            related_warehouse_bill_id: state?.related_warehouse_bill_id || null,
            __changed__: false
        }
    }, [dataWarehouseBill, dataWarehouse])
    return <>
        <Helmet
            titleTemplate={type_warehouse_bill == 'in' ? `${formatMessage({ defaultMessage: 'Tạo phiếu nhập kho' })} - UpBase` : `${formatMessage({ defaultMessage: 'Tạo phiếu xuất kho' })} - UpBase`}
            defaultTitle={type_warehouse_bill == 'in' ? `${formatMessage({ defaultMessage: 'Tạo phiếu nhập kho' })} - UpBase` : `${formatMessage({ defaultMessage: 'Tạo phiếu xuất kho' })} - UpBase`}
        >
            <meta name="description" content={type_warehouse_bill == 'in' ? `${formatMessage({ defaultMessage: 'Tạo phiếu nhập kho' })} - UpBase` : `${formatMessage({ defaultMessage: 'Tạo phiếu xuất kho' })} - UpBase`} />
        </Helmet>
        {openResult && <ModalResult onHide={() => {setOpenResult(false)}} dataResults={dataError} />}
        {dataWarehouse && <Formik
            initialValues={initialValues}
            validationSchema={createSchema}
            enableReinitialize
            onSubmit={async (values) => {
                const nowTimestamp = dayjs(new Date()).unix()
                if(!!values?.expectReceiveTime && values?.expectReceiveTime <= nowTimestamp) {
                    addToast('Thời gian nhận dự kiến không hợp lệ', {appearance: 'error'})
                    return;
                }
                
                let { data } = await warehouseUserCreateBill({
                    variables: {
                        warehouseUserCreateBillInput: {
                            estimatedDeliveryAt: values?.expectReceiveTime ? values?.expectReceiveTime : null,
                            smeWarehouseId: values?.warehouseId?.value || null,
                            note: values?.note || null,
                            type: type_warehouse_bill,
                            relationWarehouseBillId: values?.related_warehouse_bill_id || null,
                            protocol: values?.protocol?.value || null,
                            productType: values?.productType?.value || 0,
                            items: warehouseVariants?.map(variant => {
                                return {
                                    discount_type: values[`bill-${variant?.variant_id}-discount-unit`]?.value,
                                    discount_value: values[`bill-${variant?.variant_id}-discount`],
                                    is_include_stock_preallocate: values[`bill-${variant?.variant_id}-stock_preallocate`] ? stock_preallocate_status.INCLUDE : stock_preallocate_status.NOT_INCLUDE,
                                    price: values[`bill-${variant?.variant_id}-price`],
                                    quantity: values[`bill-${variant?.variant_id}-qty`],
                                    sku: variant?.variant?.sku,
                                    expiredDate: values[`bill-${variant?.variant_id}-expirationDate`] ? dayjs(values[`bill-${variant?.variant_id}-expirationDate`]*1000).format('DD/MM/YYYY') : '',
                                    manufactureDate: values[`bill-${variant?.variant_id}-productionDate`] ? dayjs(values[`bill-${variant?.variant_id}-productionDate`]*1000).format('DD/MM/YYYY') : '',
                                    lot_serial: values[`bill-${variant?.variant_id}-lot-code`] || ''
                                }
                            })
                        }
                    }
                })

                if (data?.warehouseUserCreateBill?.success) {
                    if(data?.warehouseUserCreateBill?.total == data?.warehouseUserCreateBill?.totalSuccess) {
                        addToast(
                            type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'Tạo phiếu nhập kho thành công' }) : formatMessage({ defaultMessage: 'Tạo phiếu xuất kho thành công' })
                            , { appearance: 'success' }
                        );
                        history.push(`/products/warehouse-bill/${type_warehouse_bill}/${data?.warehouseUserCreateBill?.id}`)
                    } else {
                        setDataError(data?.warehouseUserCreateBill?.results)
                        setOpenResult(true)
                    }
                } else {
                    addToast(
                        data?.warehouseUserCreateBill?.message
                            || (type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'Tạo phiếu nhập kho không thành công' }) : formatMessage({ defaultMessage: 'Tạo phiếu xuất kho không thành công' }))
                        , { appearance: 'error' }
                    );
                }
            }}
        >
            {({
                values,
                handleSubmit,
                validateForm,
                setFieldValue
            }) => {
                const changed = values['__changed__']
                return (
                    <>
                        <LoadingDialog show={loadingCreate || loadingApprove} />
                        <RouterPrompt
                            when={changed}
                            title={formatMessage({ defaultMessage: 'Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?' })}
                            cancelText={formatMessage({ defaultMessage: 'Quay lại' })}
                            okText={formatMessage({ defaultMessage: 'Tiếp tục' })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <Card>
                            <CardHeader title={type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU NHẬP KHO' }) : formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU XUẤT KHO' })}>
                                <CardHeaderToolbar>
                                </CardHeaderToolbar>
                            </CardHeader>
                            <CardBody className='px-25 py-5"'>
                                <div className='row d-flex justify-content-between'>
                                    <div className={`col-md-5 d-flex flex-column`}>
                                        <Field
                                            name="warehouseId"
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            required
                                            placeholder=""
                                            label={formatMessage({ defaultMessage: 'Kho' })}
                                            customFeedbackLabel={' '}
                                            options={dataWarehouse?.sme_warehouses?.map(__ => {
                                                return {
                                                    label: __.name,
                                                    value: __.id
                                                }
                                            })}
                                            isClearable={false}
                                        />
                                        <Field
                                            name="protocol"
                                            required
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            placeholder=""
                                            label={type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'Hình thức nhập kho' }) : formatMessage({ defaultMessage: 'Hình thức xuất kho' })}
                                            customFeedbackLabel={' '}
                                            options={type_warehouse_bill == 'in' ? PROTOCOL_IN.filter(__ => __.value != 0 && __.value != 1) : PROTOCOL_OUT.filter(__ => __.value != 0)}
                                            isClearable={false}
                                        />
                                        <Field
                                            name="productType"
                                            component={ReSelectVertical}
                                            onChange={() => {
                                                setFieldValue('__changed__', true)
                                            }}
                                            required
                                            placeholder=""
                                            label={formatMessage({ defaultMessage: 'Loại sản phẩm' })}
                                            customFeedbackLabel={' '}
                                            options={PRODUCT_TYPE_OPTIONS}
                                            isClearable={false}
                                        />
                                    </div>
                                    <div className={`col-md-5`} >
                                        <Field
                                            name="note"
                                            component={TextArea}
                                            placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                                            label={formatMessage({ defaultMessage: 'Ghi chú' })}
                                            required={false}
                                            customFeedbackLabel={' '}
                                            cols={['col-3', 'col-12']}
                                            countChar
                                            rows={4}
                                            maxChar={'255'}
                                        />
                                        {type_warehouse_bill == 'in' && <div>
                                            <p className="mb-4">Thời gian nhận hàng dự kiến</p>
                                            <DatePicker onChange={date => {
                                                    setFieldValue(`expectReceiveTime`, date? dayjs(date).startOf('hour').unix() : null)
                                                }}
                                                format={"dd/MM/yyyy hh:00"}
                                                placeholder="Chọn thời gian nhận hàng dự kiến"
                                                value={values[`expectReceiveTime`] ? new Date(values[`expectReceiveTime`]*1000): null}
                                                className="w-100"
                                            />
                                        </div>}
                                    </div>
                                    
                                </div>
                                
                            </CardBody>
                        </Card>
                        {type_warehouse_bill == 'in' && values?.productType?.value == 0 && <WarehouseBillInTable 
                            warehouse={dataWarehouse?.sme_warehouses?.find(wh => wh.id == values?.warehouseId?.value)} 
                            typeProduct={values?.productType?.value}
                            onSetSchema={schema => setCreateSchema(schema)} 
                            selectedVariants={warehouseVariants}
                            setSelectedVariants={setSelectedVariants}   
                        />}
                        {type_warehouse_bill == 'out' && values?.productType?.value == 0 && <WarehouseBillOutTable 
                            warehouse={dataWarehouse?.sme_warehouses?.find(wh => wh.id == values?.warehouseId?.value)} 
                            typeProduct={values?.productType?.value}
                            onSetSchema={schema => setCreateSchema(schema)}   
                            selectedVariants={warehouseVariants}
                            setSelectedVariants={setSelectedVariants} 
                        />}
                        {type_warehouse_bill == 'in' && values?.productType?.value == 1 && <WarehouseBillInExpireTable 
                            warehouse={dataWarehouse?.sme_warehouses?.find(wh => wh.id == values?.warehouseId?.value)} 
                            typeProduct={values?.productType?.value}
                            onSetSchema={schema => setCreateSchema(schema)}   
                            isFocus={isFocus} 
                            setIsFocus={setIsFocus}
                            selectedVariants={warehouseVariants}
                            setSelectedVariants={setSelectedVariants}
                        />}
                        {type_warehouse_bill == 'out' && values?.productType?.value == 1 && <WarehouseBillOutExpireTable 
                            warehouse={dataWarehouse?.sme_warehouses?.find(wh => wh.id == values?.warehouseId?.value)} 
                            typeProduct={values?.productType?.value}
                            onSetSchema={schema => setCreateSchema(schema)} 
                            isFocus={isFocus} 
                            setIsFocus={setIsFocus}   
                            selectedVariants={warehouseVariants}
                            setSelectedVariants={setSelectedVariants}
                        />}
                        <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                            <button
                                className="btn btn-secondary mr-2"
                                style={{ width: 150 }}
                                onClick={e => {
                                    e.preventDefault()
                                    history.push('/products/warehouse-bill/list');
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                            </button>
                            <button
                                className="btn btn-primary mr-2"
                                style={{ width: 150 }}
                                type="submit"
                                disabled={!selectedVariants?.length}
                                onClick={async () => {
                                    setIsFocus(true)
                                    setFieldValue('__changed__', false)
                                    handleSubmit()
                                    let error = await validateForm(values);

                                    if (Object.values(error).length != 0) {
                                        handleSubmit();
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                        return;
                                    }
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Lưu lại' })}
                            </button>
                            <AuthorizationWrapper keys={['warehouse_bill_in_approve']}>
                            {type_warehouse_bill == 'in' && <button
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                disabled={!selectedVariants?.length}
                                onClick={async (e) => {
                                    e.preventDefault()
                                    setIsFocus(true)
                                    let error = await validateForm(values);

                                    if (Object.values(error).length != 0) {
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
                                        return;
                                    }

                                    const nowTimestamp = dayjs(new Date()).unix()
                                    if(!!values?.expectReceiveTime && values?.expectReceiveTime <= nowTimestamp) {
                                        addToast('Thời gian nhận dự kiến không hợp lệ', {appearance: 'error'})
                                        return;
                                    }
                                    setFieldValue('__changed__', false)
                                    let { data } = await warehouseUserCreateBill({
                                        variables: {
                                            warehouseUserCreateBillInput: {
                                                estimatedDeliveryAt: values?.expectReceiveTime ? values?.expectReceiveTime : null,
                                                smeWarehouseId: values?.warehouseId?.value || null,
                                                note: values?.note || null,
                                                type: type_warehouse_bill,
                                                relationWarehouseBillId: values?.related_warehouse_bill_id || null,
                                                protocol: values?.protocol?.value || null,
                                                productType: values?.productType?.value || 0,
                                                items: warehouseVariants?.map(variant => {
                                                    return {
                                                        discount_type: values[`bill-${variant?.variant_id}-discount-unit`]?.value,
                                                        discount_value: values[`bill-${variant?.variant_id}-discount`],
                                                        is_include_stock_preallocate: values[`bill-${variant?.variant_id}-stock_preallocate`] ? stock_preallocate_status.INCLUDE : stock_preallocate_status.NOT_INCLUDE,
                                                        price: values[`bill-${variant?.variant_id}-price`],
                                                        quantity: values[`bill-${variant?.variant_id}-qty`],
                                                        sku: variant?.variant?.sku,
                                                        expiredDate: values[`bill-${variant?.variant_id}-expirationDate`] ? dayjs(values[`bill-${variant?.variant_id}-expirationDate`]*1000).format('DD/MM/YYYY') : '',
                                                        manufactureDate: values[`bill-${variant?.variant_id}-productionDate`] ? dayjs(values[`bill-${variant?.variant_id}-productionDate`]*1000).format('DD/MM/YYYY') : '',
                                                        lot_serial: values[`bill-${variant?.variant_id}-lot-code`] || ''
                                                    }
                                                })
                                            }
                                        }
                                    })

                                    if (data?.warehouseUserCreateBill?.success) {
                                        if(data?.warehouseUserCreateBill?.total == data?.warehouseUserCreateBill?.totalSuccess) {
                                            let {data: dataApprove} = await warehouseApproveBill({
                                                variables: {
                                                    id: +data?.warehouseUserCreateBill?.id
                                                }
                                            })
                                            if(dataApprove?.warehouseApproveBill?.success) {
                                                addToast(formatMessage({defaultMessage: "Tạo và duyệt phiếu nhập kho thành công"}), {appearance: 'success'})
                                                history.push(`/products/warehouse-bill/in/${data?.warehouseUserCreateBill?.id}`)
                                            } else {
                                                addToast(dataApprove?.warehouseApproveBill?.message, {appearance: 'error'})
                                                history.push(`/products/warehouse-bill/in/${data?.warehouseUserCreateBill?.id}`)
                                            }
                                        } else {
                                            setDataError(data?.warehouseUserCreateBill?.results)
                                            setOpenResult(true)
                                        }
                                    } else {
                                        addToast(
                                            data?.warehouseUserCreateBill?.message
                                                || (type_warehouse_bill == 'in' ? formatMessage({ defaultMessage: 'Tạo phiếu nhập kho không thành công' }) : formatMessage({ defaultMessage: 'Tạo phiếu xuất kho không thành công' }))
                                            , { appearance: 'error' }
                                        );
                                    }
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Duyệt phiếu' })}
                            </button>}
                            </AuthorizationWrapper>
                        </div>
                    </>
                )
            }
            }
        </Formik>
        }
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
    </>
})
