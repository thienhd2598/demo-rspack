import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader, InputVerticalWithIncrease } from "../../../../_metronic/_partials/controls";
import Select from 'react-select';
import Pagination from '../../../../components/Pagination';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from 'querystring';
import { Modal } from 'react-bootstrap';
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import { useMutation, useQuery } from "@apollo/client";
import query_warehouse_bill_items from "../../../../graphql/query_warehouse_bill_items";
import { Link } from 'react-router-dom';
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Field, useFormikContext } from "formik";
import * as Yup from "yup";
import { formatNumberToCurrency } from "../../../../utils";
import mutate_warehouseUserUpdateBill from "../../../../graphql/mutate_warehouseUserUpdateBill";
import InputScan from "../../../../components/InputScan";
import query_sme_catalog_inventory_items from "../../../../graphql/query_sme_catalog_inventory_items";
import client from "../../../../apollo";
import InfoProduct from "../../../../components/InfoProduct";
import { defineMessages, useIntl } from 'react-intl';
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import mutate_warehouseConfirmBill from "../../../../graphql/mutate_warehouseConfirmBill";
import mutate_warehouseUserCancelBill from "../../../../graphql/mutate_warehouseUserCancelBill";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import mutate_warehouseUserDeleteBill from "../../../../graphql/mutate_warehouseUserDeleteBill";

const TableWarehouseBillOut = ({ onSetSchema, status, warehouse, order_id }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { validateForm, handleSubmit, setFieldValue, values } = useFormikContext();
    const { id: idWarehouseBill } = useParams();
    const [dataCombo, setDataCombo] = useState(null);

    const [searchText, setSearchText] = useState(null);
    const [searchType, setSearchType] = useState('sku');

    const [mutateCancel, {loading: loadingCancelBill}] = useMutation(mutate_warehouseUserCancelBill,
        {
            awaitRefetchQueries: true,
            refetchQueries: ['warehouse_bills', 'warehouse_bill_items', 'warehouse_bills_by_pk']
        }
    )

    const [mutateDelete, {loading: loadingDelete}] = useMutation(mutate_warehouseUserDeleteBill,
        {
            awaitRefetchQueries: true,
            refetchQueries: ['warehouse_bills', 'warehouse_bill_items', 'warehouse_bills_by_pk']
        }
    )

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

    const [confirmWarehouseBill, { loading: loadingWarehouseConfirmBill }] = useMutation(mutate_warehouseConfirmBill, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills', 'warehouse_bill_items', 'warehouse_bills_by_pk']
    });

    const { data, loading, error, refetch } = useQuery(query_warehouse_bill_items, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: {
                warehouse_bill_id: { _eq: Number(idWarehouseBill) },
                ...(!!searchText ? {
                    variant: searchType == 'gtin' ? {
                        gtin: { _eq: searchText }
                    } : {
                        sku_clear_text: { _iregex: encodeURI(searchText.trim()).replace(/%/g, '') }
                    },
                } : ""),
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.warehouse_bill_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const renderTableHeader = useMemo(
        () => {
            if (status == 'new') {
                return (
                    <tr className="text-left" >
                        <th style={{ fontSize: '14px' }} width='35%'>
                            <span>
                                {formatMessage({ defaultMessage: 'Sản phẩm' })}
                            </span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                            <span>
                                {formatMessage({ defaultMessage: 'ĐVT' })}
                            </span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='20%' className="text-center">
                            <span>
                                {formatMessage({ defaultMessage: 'Tồn kho sẵn sàng' })}
                            </span>
                        </th>
                        <th style={{ fontSize: '14px' }} className="text-center" width='20%'>
                            <span>
                                {formatMessage({ defaultMessage: 'Số lượng xuất kho' })}
                            </span>
                        </th>
                    </tr>
                )
            }

            return (
                <tr className="text-left" >
                    <th style={{ fontSize: '14px' }} width='50%'>
                        <span>
                            {formatMessage({ defaultMessage: 'Sản phẩm' })}
                        </span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>
                            {formatMessage({ defaultMessage: 'ĐVT' })}
                        </span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='25%' className="text-center">
                        <span>
                            {formatMessage({ defaultMessage: 'Tồn kho sẵn sàng' })}
                        </span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='25%'>
                        <span>
                            {formatMessage({ defaultMessage: 'Số lượng xuất kho' })}
                        </span>
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

        let { data } = await confirmWarehouseBill({
            variables: { id: Number(idWarehouseBill) }
        });

        if (data?.warehouseConfirmBill?.success) {
            addToast(formatMessage({ defaultMessage: `Duyệt phiếu xuất kho thành công` }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: `Duyệt phiếu xuất kho thất bại` }), { appearance: 'error' });
        }
    }

    return (
        <>
            <LoadingDialog show={loadingCancelBill || loadingDelete} />
            <Card>
                <CardHeader title={<div className="d-flex flex-column">
                    <span>{formatMessage({ defaultMessage: 'SẢN PHẨM XUẤT KHO' })}</span>
                </div>}>
                </CardHeader>
                <ModalCombo
                    dataCombo={dataCombo}
                    onHide={() => setDataCombo(null)}
                />
                <CardBody>
                    <div style={{
                        boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                        borderRadius: 6, minHeight: 220
                    }} >
                        <table className="table product-list  table-borderless table-vertical-center fixed">
                            <thead style={{
                                borderBottom: '1px solid #F0F0F0',
                            }}>
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
                                                        <div className="w-100">
                                                            <InfoProduct
                                                                name={_wareHouseBill?.variant?.sme_catalog_product?.name}
                                                                sku={_wareHouseBill?.variant?.sku}
                                                                setDataCombo={setDataCombo}
                                                                combo_items={_wareHouseBill?.variant?.combo_items}
                                                                url={linkProduct()}
                                                            />

                                                            {
                                                                !!_wareHouseBill?.variant?.attributes?.length > 0 && <p className='font-weight-normal mt-2' style={{ color: 'black' }} >
                                                                    {_wareHouseBill?.variant?.name?.replaceAll(' + ', ' - ')}
                                                                </p>
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center">{_wareHouseBill?.variant?.unit || '--'}</td>
                                                <td className="text-center">
                                                    {/* {formatNumberToCurrency(stockAvailableWarehouse)} */}
                                                    {formatNumberToCurrency(_wareHouseBill?.stock_available)}
                                                </td>
                                                <td className="text-center">
                                                    <span>{formatNumberToCurrency(_wareHouseBill?.quantity)}</span>
                                                </td>
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
                                basePath={`/products/warehouse-bill/out/${idWarehouseBill}`}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm xuất kho' })}
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
                {status == 'new' && !order_id && (
                    <>
                        <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                            <button
                                className="btn btn-primary mr-2"
                                style={{ width: 150 }}
                                disabled={data?.warehouse_bill_items?.length == 0}
                                onClick={() => onUpdateWareHouseBill('complete')}
                            >
                                {formatMessage({ defaultMessage: 'Duyệt xuất kho' })}
                            </button>
                        <button
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                onClick={async () => {
                                    let { data } = await mutateCancel({
                                        variables: { id: Number(idWarehouseBill) }
                                    });
                        
                                    if (data?.warehouseUserCancelBill?.success) {
                                        addToast(formatMessage({ defaultMessage: `Hủy phiếu xuất kho thành công` }), { appearance: 'success' });
                                    } else {
                                        addToast(
                                            data?.warehouseConfirmBill?.message || formatMessage({ defaultMessage: `Hủy phiếu xuất kho thất bại` }),{ appearance: 'error' });
                                    }
                                }}
                            >
                            {formatMessage({ defaultMessage: 'Hủy phiếu' })}
                        </button>
                        </AuthorizationWrapper>
                    </>
                )}

                {/* {status == 'cancel' && !order_id && (
                    <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                        <button
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                onClick={async () => {
                                    let { data } = await mutateDelete({
                                        variables: { id: Number(idWarehouseBill) }
                                    });
                        
                                    if (data?.warehouseUserDeleteBill?.success) {
                                        addToast(formatMessage({ defaultMessage: `Xóa phiếu xuất kho thành công` }), { appearance: 'success' });
                                        history.push('/products/warehouse-bill/list')
                                    } else {
                                        addToast(
                                            data?.warehouseUserDeleteBill?.message || formatMessage({ defaultMessage: `Xóa phiếu xuất kho thất bại` }),{ appearance: 'error' });
                                    }
                                }}
                            >
                            {formatMessage({ defaultMessage: 'Xóa phiếu' })}
                        </button>
                    </AuthorizationWrapper>
                )} */}
            </div>
        </>
    )
}

export default memo(TableWarehouseBillOut);