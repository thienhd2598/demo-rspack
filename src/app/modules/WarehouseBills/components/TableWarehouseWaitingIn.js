import { useMutation, useQuery } from "@apollo/client";
import { Field, useFormikContext } from "formik";
import _ from "lodash";
import queryString from 'querystring';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defineMessages, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { Card, CardBody, CardHeader, Checkbox, InputVertical, InputVerticalWithIncrease, TextArea } from "../../../../_metronic/_partials/controls";
import InfoProduct from "../../../../components/InfoProduct";
import Pagination from '../../../../components/Pagination';
import query_warehouse_bill_items from "../../../../graphql/query_warehouse_bill_items";
import { formatNumberToCurrency } from "../../../../utils";
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import mutate_warehouseApproveBill from "../../../../graphql/mutate_warehouseApproveBill";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import SVG from 'react-inlinesvg'
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { TAB_WAITING_IN } from "../WarehouseBillsUIHelper";
import WarehouseItemCount from "./WarehouseItemCount";
import WarehouseBillInRow from "./WarehouseBillInRow";
import mutate_warehouseUserUpdateBillInbound from "../../../../graphql/mutate_warehouseUserUpdateBillInbound";
import mutate_warehouseConfirmBill from "../../../../graphql/mutate_warehouseConfirmBill";
import ModalQuantity from "../dialogs/ModalQuantity";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const TableWarehouseBillIn = ({ onSetSchema, status }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { handleSubmit, setFieldValue, values, validateForm, errors, setValues } = useFormikContext();
    const { id: idWarehouseBill } = useParams();
    const [dataCombo, setDataCombo] = useState(null);
    const [id, setId] = useState(null)

    const [mutateUpdateQUantity, {loading: loadingUpdateQuantity}] = useMutation(mutate_warehouseUserUpdateBillInbound, {
        refetchQueries: ['warehouse_bill_items', 'warehouse_bill_items_aggregate']
    })

    const [mutateWarehouseConfirmBill, {loading: loadingWarehouseConfirmBill}] = useMutation(mutate_warehouseConfirmBill, {
        refetchQueries: ['warehouse_bills_by_pk', 'warehouse_bill_items', 'warehouse_bill_items_aggregate']
    })

    const searchText = useMemo(() => {
        if(!params?.search) return null
        return params?.search
    }, [params?.search])

    const page = useMemo(
        () => {
            try {
                let _page = Number(params.page);
                if (!Number.isNaN(_page)) {
                    return Math.max(1, _page)
                } else {
                    return 1
                }
            } catch (error) {
                return 1;
            }
        }, [params.page]
    );

    const limit = useMemo(
        () => {
            try {
                let _value = Number(params.limit)
                if (!Number.isNaN(_value)) {
                    return Math.max(25, _value)
                } else {
                    return 25
                }
            } catch (error) {
                return 25
            }
        }, [params.limit]
    );

    const quantityCondition = useMemo(() => {
        if(!params?.status) {
            return {state: {_eq: 0}}
        }
        if(params?.status == 'notyet') {
            return {state: {_eq: 0}}
        } else if(params?.status == 'all') {
            return {}
        } else if(params?.status == 'khop') {
            return {state: {_eq: 1}}
        } else {
            return {_or: [{state: {_eq: 2}},{state: {_eq: 3}}]}
        }
    }, [params?.status])


    const whereCondition = useMemo(() => {
        if(!searchText) {
            return {warehouse_bill_id: { _eq: Number(idWarehouseBill) }}
        }
        return {
            warehouse_bill_id: { _eq: Number(idWarehouseBill) },
            _or: [
                {variant : {sku: {_ilike: `%${searchText.trim()}%`}}},
                {product:{name: {_ilike: `%${searchText.trim()}%`}}}
            ]
        }
    }, [searchText, idWarehouseBill])
    const { data, loading, error, refetch } = useQuery(query_warehouse_bill_items, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: {
                _and: [
                    whereCondition,
                    quantityCondition
                ]
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.warehouse_bill_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const renderTableHeader = useMemo(
        () => {
            return (
                <tr className="text-left" >
                    <th style={{ fontSize: '14px' }} width='25%'>
                        <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Số lượng cần nhập' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='20%'>
                        <span>{formatMessage({ defaultMessage: 'Số lượng thực tế' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='10%'>
                        <span>{formatMessage({ defaultMessage: 'Lệch' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='20%'>
                        <span>{formatMessage({ defaultMessage: 'Ghi chú' })}</span>
                    </th>
                </tr>
            )
        }, [status]
    );

    const onUpdateWareHouseBill = async () => {
        let error = await validateForm(values);

        if (Object.values(error).length != 0) {
            handleSubmit();
            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
            return;
        }
        const {data: dataUpdate} = await mutateUpdateQUantity({
            variables: {
                id: Number(idWarehouseBill),
                items: data?.warehouse_bill_items?.map(item => {
                    return {
                        id: item?.id,
                        note: values[`${item?.id}-note`] || '',
                        quantity: values[`${item?.id}-quantity`] || 0
                    }
                }) || []
            }
        })
        if(dataUpdate?.warehouseUserUpdateBillInbound?.success) {
            addToast(formatMessage({defaultMessage: 'Cập nhật phiếu chờ nhập thành công'}), {appearance: 'success'})
            setFieldValue('__changed__', false)
        } else {
            addToast(dataUpdate?.warehouseUserUpdateBillInbound?.message || formatMessage({defaultMessage: 'Cập nhật phiếu chờ nhập thất bại'}), {appearance: 'error'})
            setFieldValue('__changed__', false)
        }
    }

    const onConfirmWarehouseBill = async () => {
        let error = await validateForm(values);

        if (Object.values(error).length != 0) {
            handleSubmit();
            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
            return;
        }
        const {data: dataUpdate} = await mutateUpdateQUantity({
            variables: {
                id: Number(idWarehouseBill),
                items: data?.warehouse_bill_items?.map(item => {
                    return {
                        id: item?.id,
                        note: values[`${item?.id}-note`] || '',
                        quantity: values[`${item?.id}-quantity`] || 0
                    }
                }) || []
            }
        })
        if(dataUpdate?.warehouseUserUpdateBillInbound?.success) {
            let {data: dataConfirm} = await mutateWarehouseConfirmBill({
                variables: {
                    id: Number(idWarehouseBill)
                }
            })
            if (dataConfirm?.warehouseConfirmBill?.success) {
                addToast(formatMessage({defaultMessage: 'Nhập kho sản phẩm thành công'}), {appearance: 'success'})
                setFieldValue('__changed__', false)
            } else {
                addToast(dataConfirm?.warehouseConfirmBill?.message || formatMessage({defaultMessage: 'Nhập kho sản phẩm thất bại'}), {appearance: 'error'})
                setFieldValue('__changed__', false)
            }
        } else {
            addToast(dataUpdate?.warehouseUserUpdateBillInbound?.message || formatMessage({defaultMessage: 'Cập nhật phiếu chờ nhập thất bại'}), {appearance: 'error'})
            setFieldValue('__changed__', false)
        }
    }

    useMemo(() => {
        if (!!data?.warehouse_bill_items?.length) {
            const fieldValues = { ...values }
            let validateSchema = {}
            const warehouseBillItems = data?.warehouse_bill_items?.map(
                (item) => {
                    validateSchema[`${item?.id}-quantity`] = Yup.number()
                        .nullable()
                        .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng nhập kho' }))
                        .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
                    validateSchema[`${item?.id}-note`] = Yup.string()
                        .notRequired()
                        .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))
                    fieldValues[`${item?.id}-quantity`] = item?.quantity || 0
                    fieldValues[`${item?.id}-note`] = item?.note || '';
                    setTimeout(() => {
                        setFieldValue('__changed__', false)
                    }, 50);
                    onSetSchema(Yup.object().shape(validateSchema))
                    return item;
                }, {}
            );
            setValues(fieldValues)
        }
    }, [data?.warehouse_bill_items])
    return (
        <>
            <LoadingDialog show={loadingUpdateQuantity || loadingWarehouseConfirmBill} />
            <ModalQuantity id={id}
                show={!!id}
                onHide={() => {setId(null)}}
            />
            <Card>
                <CardHeader title={<div className="d-flex flex-column">
                    <span>{formatMessage({ defaultMessage: 'SẢN PHẨM NHẬP KHO' })}</span>
                </div>}>
                </CardHeader>
                <ModalCombo
                    dataCombo={dataCombo}
                    onHide={() => setDataCombo(null)}
                />
                <CardBody>
                    <div className="row justify-content-between">
                        <div className=" col-4 mb-4 input-icon" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tên/SKU" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    history.push(`/products/warehouse-bill/in/${idWarehouseBill}?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        search: e.target.value
                                    })}`)
                                }}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        history.push(`/products/warehouse-bill/in/${idWarehouseBill}?${queryString.stringify({
                                            ...params,
                                            page: 1,
                                            search: e.target.value
                                        })}`)
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                        <AuthorizationWrapper keys={['warehouse_bill_in_confirm']}>
                        <div className="justify-content-end mb-4 input-icon" >
                            <button
                                className="btn mr-4"
                                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 200 }}
                                type="submit"
                                onClick={async (e) => {
                                    setId(idWarehouseBill)
                                }}>
                                <SVG
                                    src={toAbsoluteUrl("/media/svg/iconupload.svg")}
                                    className="h-75 align-self-end mr-3"
                                ></SVG>
                                {formatMessage({ defaultMessage: "Nhập file SL thực tế" })}
                            </button>
                        </div>
                        </AuthorizationWrapper>
                    </div>
                    <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                        <div style={{ flex: 1 }} >
                            <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                                {
                                    TAB_WAITING_IN.map((_tab, index) => {
                                        const { title, status } = _tab;
                                        const isActive = params?.status ? status == (params?.status) : status == 'notyet'
                                        return (
                                            <li
                                                key={`tab-order-${index}`}
                                                className={`nav-item ${isActive ? 'active' : ''}`}
                                            >
                                                <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                                    style={{ fontSize: '13px' }}
                                                    onClick={() => {
                                                        history.push(`/products/warehouse-bill/in/${idWarehouseBill}?${queryString.stringify({
                                                            ...params,
                                                            page: 1,
                                                            status: status
                                                        })}`)
                                                    }}
                                                >
                                                    <span className="mr-2">{title}</span>
                                                    (<WarehouseItemCount
                                                        whereCondition={
                                                            _.omit({
                                                                ...whereCondition,
                                                            })
                                                        }
                                                        status={status}
                                                        
                                                    />)
                                                </a>
                                            </li>
                                        )
                                    })
                                }
                            </ul>
                        </div>
                    </div>
                    <div style={{
                        boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                        borderRadius: 6, minHeight: 220
                    }} >
                        <table className="table product-list table-borderless table-vertical-center fixed">
                            <thead 
                                style={{
                                    position: 'sticky', top: 82, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1,
                                    borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9',
                                    borderBottom: '1px solid #F0F0F0',
                                    borderLeft: '1px solid #d9d9d9'
                                }}
                            >
                                {renderTableHeader}
                            </thead>
                            <tbody>
                                {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                    <span className="ml-3 spinner spinner-primary"></span>
                                </div>}
                                {!!error && !loading && (
                                    <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                        <div className="d-flex flex-column justify-content-center align-items-center">
                                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                            <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                            <button
                                                className="btn btn-primary btn-elevate"
                                                style={{ width: 100 }}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    refetch();
                                                }}
                                            >
                                                {formatMessage({ defaultMessage: 'Tải lại' })}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {
                                    !error && !loading && data?.warehouse_bill_items?.map(_wareHouseBill => {                                       
                                        return <WarehouseBillInRow _wareHouseBill={_wareHouseBill} setDataCombo={setDataCombo}/>
                                    })
                                }
                            </tbody>
                        </table>
                        {!error && !loading && (
                            <Pagination
                                page={page}
                                totalPage={totalPage}
                                loading={loading}
                                limit={limit}
                                totalRecord={totalRecord}
                                count={data?.warehouse_bill_items?.length}
                                basePath={`/products/warehouse-bill/in/${idWarehouseBill}`}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nhập kho' })}
                            />
                        )}
                    </div>
                </CardBody>
            </Card>

            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10'>
                <button
                    className="btn btn-secondary mr-2"
                    style={{ width: 150 }}
                    onClick={e => {
                        e.preventDefault()
                        history.push('/products/warehouse-bill/list')
                    }}
                >
                    {formatMessage({ defaultMessage: 'Quay lại' })}
                </button>
                <AuthorizationWrapper keys={['warehouse_bill_in_confirm']}>
                <button
                    className="btn btn-primary"
                    style={{ width: 150 }}
                    onClick={onUpdateWareHouseBill}
                >
                    {formatMessage({ defaultMessage: 'Lưu lại' })}
                </button>
                <button
                    className="ml-2 btn btn-primary"
                    style={{ width: 150 }}
                    onClick={onConfirmWarehouseBill}
                >
                    {formatMessage({ defaultMessage: 'Nhập kho' })}
                </button>
                </AuthorizationWrapper>
            </div>
        </>
    )
}

export default memo(TableWarehouseBillIn);