import { useMutation, useQuery } from "@apollo/client";
import { Field, useFormikContext, ErrorMessage } from "formik";
import _ from "lodash";
import queryString from 'querystring';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defineMessages, useIntl } from 'react-intl';
import { Link, useHistory, useLocation, useParams } from "react-router-dom";
import Select from 'react-select';
import { useToasts } from "react-toast-notifications";
import { v4 as uuidv4 } from 'uuid';
import * as Yup from "yup";
import { Card, CardBody, CardHeader, Checkbox, InputVertical, InputVerticalWithIncrease } from "../../../../_metronic/_partials/controls";
import { InputSelectAddons } from "../../../../_metronic/_partials/controls/forms/InputSelectAddons";
import client from "../../../../apollo";
import InfoProduct from "../../../../components/InfoProduct";
import Pagination from '../../../../components/Pagination';
import query_warehouse_bill_items from "../../../../graphql/query_warehouse_bill_items";
import { formatNumberToCurrency } from "../../../../utils";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import { UNIT_ADDONS, TAB_COMPLETE_IN } from "../WarehouseBillsUIHelper";
import ModalQuicklyAddProducts from "./ModalQuicklyAddProducts";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import DatePicker from 'rsuite/DatePicker';
import dayjs from "dayjs";
import mutate_warehouseApproveBill from "../../../../graphql/mutate_warehouseApproveBill";
import ModalConfirm from "./ModalConfirm";
import mutate_warehouseUserCreateBill from "../../../../graphql/mutate_warehouseUserCreateBill";
import WarehouseItemCount from "./WarehouseItemCount";

const getBillItems = async (id) => {
    if (!id) return [];
    const { data } = await client.query({
        query: query_warehouse_bill_items,
        variables: {
            limit: 200,
            offset: 0,
            where: {
                warehouse_bill_id: { _eq: Number(id) },
                state: {_eq: 3}
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.warehouse_bill_items || [];
}

const TableWarehouseBillInExpire = ({ onSetSchema, status, warehouse, expense, setExpense, generalData }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { handleSubmit, setFieldValue, values, validateForm, errors} = useFormikContext();
    const { id: idWarehouseBill } = useParams();
    const [dataCombo, setDataCombo] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false)
    const [searchText, setSearchText] = useState(null);
    const [isNotEnough, setIsNotEnough] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true)

    const [warehouseUserCreateBill, { loading: loadingCreate }] = useMutation(mutate_warehouseUserCreateBill)

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
            return {}
        }
        if(params?.status == 'notyet') {
            return {state: {_eq: 0}}
        } else if(params?.status == 'khop') {
            return {state: {_eq: 1}}
        }  else if(params?.status == 'all') {
            return {}
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

    const [approveWarehouseBill, { loading: loadingWarehouseApproveBill }] = useMutation(mutate_warehouseApproveBill, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills', 'warehouse_bill_items', 'warehouse_bills_by_pk']
    });

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

    useMemo(() => {
        if (!!data?.warehouse_bill_items) {
            const warehouseBillItems = data?.warehouse_bill_items?.reduce(
                (result, bill) => {
                    setFieldValue([`bill-${bill?.id}-stock_preallocate`], !!bill?.is_include_stock_preallocate);
                    setFieldValue([`bill-${bill?.id}-stock_preallocate-qty`], bill?.stock_preallocate);
                    setFieldValue([`bill-${bill?.id}-qty`], bill?.quantity != null ? bill?.quantity : undefined);
                    setFieldValue([`bill-${bill?.id}-expirationDate`], bill?.expired_info ? bill?.expired_info?.expiredDate : undefined);
                    setFieldValue([`bill-${bill?.id}-lot-code`], bill?.expired_info ? bill?.expired_info?.lotSerial : undefined);
                    setFieldValue([`bill-${bill?.id}-productionDate`], bill?.expired_info ? bill?.expired_info?.manufactureDate : undefined);
                    setFieldValue([`bill-${bill?.id}-price`], bill?.price || 0);
                    setFieldValue([`bill-${bill?.id}-discount`], bill?.discount_value || 0);
                    setFieldValue([`bill-${bill?.id}-discount-unit`], _.find(UNIT_ADDONS, _unit => _unit.value == bill?.discount_type) || UNIT_ADDONS[0]);
                    setTimeout(() => {
                        setFieldValue('__changed__', false)
                    }, 50);
                    

                    return result;
                }, {}
            );
        }
    }, [data?.warehouse_bill_items])

    const renderTableHeader = useMemo(
        () => {
            if (status == 'new') {
                return (
                    <tr className="text-left" >
                        <th style={{ fontSize: '14px' }} width='35%'>
                            <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                            <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                            <span>{formatMessage({ defaultMessage: 'Mã lô' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='20%' className="text-center">
                            <span>{formatMessage({ defaultMessage: 'Thông tin hạn' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                            <span>{formatMessage({ defaultMessage: 'Số lượng cần nhập' })}</span>
                        </th>
                    </tr>
                )
            }

            return (
                <tr className="text-left" >
                    <th style={{ fontSize: '14px' }} width='20%'>
                        <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Mã lô' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Thông tin hạn' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='12%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Số lượng cần nhập' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='12%'>
                        <span>{formatMessage({ defaultMessage: 'Số lượng thực tế' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='8%'>
                        <span>{formatMessage({ defaultMessage: 'Chênh lệch' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='18%'>
                        <span>{formatMessage({ defaultMessage: 'Ghi chú' })}</span>
                    </th>
                </tr>
            )
        }, [status]
    );


    const onUpdateWareHouseBill = async (status) => {
        let error = await validateForm(values);

        if (Object.values(error).length != 0) {
            handleSubmit();
            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' });
            return;
        }

        const feeData = expense?.map(_expense => ({
            title: values[`bill-expense-${_expense?.id}-title`],
            value: values[`bill-expense-${_expense?.id}-value`],
        }))?.filter(_expense => !!_expense.title && !!_expense.value)

        if (feeData?.length == 0) setExpense([])
        let { data } = await approveWarehouseBill({
            variables: { id: Number(idWarehouseBill) }
        });

        if (data?.warehouseApproveBill?.success) {
            addToast(formatMessage({ defaultMessage: `Duyệt phiếu nhập kho thành công` }), { appearance: 'success' });
        } else {
            addToast(data?.warehouseApproveBill?.message || (formatMessage({ defaultMessage: `Duyệt phiếu nhập kho thất bại` }),{ appearance: 'error' }));
        }
    }

    useMemo(async () => {
        const dataItems = await getBillItems(idWarehouseBill)
        setIsNotEnough(dataItems?.some(item => item?.quantity < item?.quantity_plan))
        setLoadingProduct(false)
    }, [])

    const handleConfirm = async () => {
        const dataItems = await getBillItems(idWarehouseBill)
        console.log(dataItems)
        history.push({
            pathname: `/products/warehouse-bill/create`,
            state: {
                dataVariants: dataItems?.map(variant => {
                    return {
                        ...variant,
                        expire_info: {
                            ...variant?.expired_info,
                            quantity: variant?.quantity_plan - variant?.quantity,
                            expiredDate: dayjs(variant.expired_info.expiredDate*1000).format('DD-MM-YYYY'),
                            manufactureDate: dayjs(variant.expired_info.manufactureDate*1000).format('DD-MM-YYYY')
                        },
                        sme_store_id: generalData?.sme_warehouse_id
                    }
                }),
                productType: generalData?.product_type || 0,
                warehouseId: generalData?.sme_warehouse_id || null,
                note: `${generalData?.code} cần nhập kho bổ sung`,
                protocol: generalData?.protocol || null,
                estimated_delivery_at: generalData?.estimated_delivery_at,
                related_warehouse_bill_id: generalData?.id
            },
            search: `?type=${generalData?.type}`
        })
        setShowConfirm(false)
    }
    return (
        <>
            <LoadingDialog show={loadingWarehouseApproveBill || loadingCreate} />
            {showConfirm && <ModalConfirm 
                show={showConfirm}
                onHide={() => {setShowConfirm(false)}}
                title={formatMessage({defaultMessage: 'Hệ thống sẽ khởi tạo một phiếu nhập hàng mới với những sản phẩm còn nhập thiếu. Bạn có đồng ý nhập yêu cầu bổ sung?'})}
                onConfirm={() => {handleConfirm()}}
            />}
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
                    {status != 'new' && <div className="row justify-content-between">
                        <div className=" col-4 mb-2 input-icon" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tên/SKU" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    setSearchText(e.target.value)
                                }}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        setSearchText(e.target.value)
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                    </div>}
                    {status != 'new' && <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                        <div style={{ flex: 1 }} >
                            <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                                {
                                    TAB_COMPLETE_IN.map((_tab, index) => {
                                        const { title, status } = _tab;
                                        const isActive = params?.status ? status == (params?.status) : status == 'all'
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
                                                    <span className="mr-2">{title} </span>
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
                    </div>}
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

                                        const linkProduct = () => {
                                            if (_wareHouseBill?.variant?.is_combo == 1) {
                                                return `/products/edit-combo/${_wareHouseBill?.variant?.product_id}`
                                            }
                                            if (_wareHouseBill?.variant?.attributes?.length > 0) {
                                                return `/products/stocks/detail/${_wareHouseBill?.variant_id}`
                                            } else {
                                                return `/products/edit/${_wareHouseBill?.variant?.product_id}`
                                            }
                                        }
                                        const diffText = () => {
                                            if (_wareHouseBill?.quantity == null)
                                                return <td className='text-center'>--</td>
                                            if (_wareHouseBill?.quantity > _wareHouseBill?.quantity_plan)
                                                return <td className='text-center' style={{ color: '#0ADC70', fontWeight: 'bold' }} >{`+${formatNumberToCurrency(_wareHouseBill?.quantity - _wareHouseBill?.quantity_plan)}`.slice(0, 8)}{`+${_wareHouseBill?.quantity - _wareHouseBill?.quantity_plan}`.length > 7 ? "..." : ''}</td>
                                            if (_wareHouseBill?.quantity < _wareHouseBill?.quantity_plan)
                                                return <td className='text-center' style={{ color: '#FF2A2D', fontWeight: 'bold' }} >{`${formatNumberToCurrency(_wareHouseBill?.quantity - _wareHouseBill?.quantity_plan)}`.slice(0, 8)}{`${_wareHouseBill?.quantity - _wareHouseBill?.quantity_plan}`.length > 7 ? "..." : ''}</td>
                                            return <td className='text-center' style={{ fontWeight: 'bold' }}>0</td>
                                        }
                                        return (
                                            <tr key={`warehouse-bill-item-${_wareHouseBill?.id}`} style={{ borderBottom: '1px solid #D9D9D9' }}>
                                                <td>
                                                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                        <Link to={linkProduct()} target="_blank">
                                                            <div style={{
                                                                backgroundColor: '#F7F7FA',
                                                                width: 80, height: 80,
                                                                borderRadius: 8,
                                                                overflow: 'hidden',
                                                                minWidth: 80
                                                            }} className='mr-6' >
                                                                {
                                                                    !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                                                        style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                                                }
                                                            </div>
                                                        </Link>
                                                        <div>
                                                            <InfoProduct
                                                                name={_wareHouseBill?.variant?.sme_catalog_product?.name}
                                                                sku={_wareHouseBill?.variant?.sku}
                                                                setDataCombo={setDataCombo}
                                                                combo_items={_wareHouseBill?.variant?.combo_items}
                                                                url={linkProduct()}
                                                            />

                                                            {
                                                                !!_wareHouseBill?.variant?.attributes?.length > 0 && <p className='text-secondary-custom mt-2'>
                                                                    {_wareHouseBill?.variant?.name?.replaceAll(' + ', ' - ')}
                                                                </p>
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">{_wareHouseBill?.variant?.unit || '--'}</td>
                                                <td className="text-center">
                                                    <span>{_wareHouseBill?.expired_info?.lotSerial}</span>
                                                </td>
                                                <td className="text-center">
                                                    <p className="mb-2">Ngày sản xuất: </p>
                                                    <p>{_wareHouseBill?.expired_info?.manufactureDate ? dayjs(_wareHouseBill?.expired_info?.manufactureDate*1000).format('DD-MM-YYYY') : '--'}</p>
                                                    <p className="mb-2">Ngày hết hạn: </p>
                                                    <p>{_wareHouseBill?.expired_info?.expiredDate ? dayjs(_wareHouseBill?.expired_info?.expiredDate*1000).format('DD-MM-YYYY') : '--'}</p>
                                                </td>
                                                <td className="text-center">
                                                    {formatNumberToCurrency(_wareHouseBill?.quantity_plan)}
                                                </td>
                                                {status!= 'new' && <>
                                                <td className="text-center">
                                                    <span>{formatNumberToCurrency(_wareHouseBill?.quantity)}</span>
                                                </td>
                                                {diffText()}
                                                <td className="text-center">
                                                    <span>{_wareHouseBill?.note}</span>
                                                </td></>}
                                            </tr>
                                        )
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
                {status == 'new' && (
                    <>
                        <AuthorizationWrapper keys={['warehouse_bill_in_approve']}>
                            <button
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                disabled={data?.warehouse_bill_items?.length == 0}
                                onClick={() => {
                                    onUpdateWareHouseBill('complete')}}
                            >
                                {formatMessage({ defaultMessage: 'Duyệt nhập kho' })}
                            </button>
                        </AuthorizationWrapper>
                    </>
                )}
                {status == 'complete' && (
                    <>
                        <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                            <button
                                className="btn btn-primary"
                                style={{ width: 200 }}
                                disabled={!loadingProduct &&(!isNotEnough || generalData?.related_warehouse_bill_id)}
                                onClick={(e) => {
                                    e.preventDefault()
                                    setShowConfirm(true)}}
                            >
                                {formatMessage({ defaultMessage: 'Yêu cầu nhập bổ sung' })}
                            </button>
                        </AuthorizationWrapper>
                    </>
                )}
            </div>
        </>
    )
}

export default memo(TableWarehouseBillInExpire);