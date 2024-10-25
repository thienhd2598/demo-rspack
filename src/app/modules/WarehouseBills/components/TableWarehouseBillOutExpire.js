import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader, InputVerticalWithIncrease } from "../../../../_metronic/_partials/controls";
import Pagination from '../../../../components/Pagination';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from 'querystring';
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
import InfoProduct from "../../../../components/InfoProduct";
import { defineMessages, useIntl } from 'react-intl';
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import mutate_warehouseConfirmBill from "../../../../graphql/mutate_warehouseConfirmBill";
import ModalExpiredInfo from "./ModalExpiredInfo";
import mutate_warehouseUserCancelBill from "../../../../graphql/mutate_warehouseUserCancelBill";
import LoadingDialog from "../../Products/product-new/LoadingDialog";
import mutate_warehouseUserDeleteBill from "../../../../graphql/mutate_warehouseUserDeleteBill";

const TableWarehouseBillOutExpire = ({ onSetSchema, status, warehouse, order_id }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { validateForm, handleSubmit, setFieldValue, values, errors } = useFormikContext();
    const { id: idWarehouseBill } = useParams();
    const [dataCombo, setDataCombo] = useState(null);
    const [showExpired, setShowExpired] = useState(false)
    const [dataInfo, setDataInfo] = useState([])

    const [searchText, setSearchText] = useState(null);
    const [searchType, setSearchType] = useState('sku');
    const [mutateCancel, {loading: loadingCancelBill}] = useMutation(mutate_warehouseUserCancelBill,
        {
            awaitRefetchQueries: true,
            refetchQueries: ['warehouse_bills', 'warehouse_bill_items', 'warehouse_bills_by_pk']
        }
    )

    const [mutateDelete, {loading: loadingDeleteBill}] = useMutation(mutate_warehouseUserDeleteBill,
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
            return (
                <tr className="text-left" >
                    <th style={{ fontSize: '14px' }} width='25%'>
                        <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='25%'>
                        <span>{formatMessage({ defaultMessage: 'SKU' })}</span>
                    </th>
                    <th className="text-center" style={{ fontSize: '14px' }} width='15%'>
                        <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Thông tin hạn' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className="text-center" width='20%'>
                        <span>{formatMessage({ defaultMessage: 'Số lượng xuất kho' })}</span>
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
            addToast(data?.warehouseConfirmBill?.message || (formatMessage({ defaultMessage: `Duyệt phiếu xuất kho thất bại` })), { appearance: 'error' } );
        }
    }

    return (
        <>
            <LoadingDialog show={loadingCancelBill || loadingDeleteBill} />
            {showExpired && <ModalExpiredInfo dataInfo={dataInfo} onHide={() => setShowExpired(false)}/>}
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
                                                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'column'}}>
                                                        <div className='d-flex align-items-center'>
                                                            <OverlayTrigger
                                                                overlay={
                                                                <Tooltip title='#1234443241434'>
                                                                    <div style={{
                                                                    backgroundColor: '#F7F7FA',
                                                                    width: 160, height: 160,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    minWidth: 160
                                                                    }} className='mr-2' >
                                                                    {
                                                                        !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                                                        style={{ width: 160, height: 160, objectFit: 'contain' }} />
                                                                    }
                                                                    </div>
                                                                </Tooltip>
                                                                }
                                                            >
                                                                <Link to={linkProduct()} target="_blank">
                                                                <div style={{
                                                                    backgroundColor: '#F7F7FA',
                                                                    width: 20, height: 20,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    minWidth: 20
                                                                }} className='mr-2' >
                                                                    {
                                                                    !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                                                        style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                                    }
                                                                </div>
                                                                </Link>
                                                            </OverlayTrigger>
                                                            <div>
                                                                <div className='d-flex flex-column'>
                                                                    <InfoProduct
                                                                        name={_wareHouseBill?.variant?.sme_catalog_product?.name}
                                                                        isSingle
                                                                        url={linkProduct()}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {
                                                                !!_wareHouseBill?.variant?.attributes?.length > 0 && <p className='text-secondary-custom font-weight-normal mt-2' >
                                                                    {_wareHouseBill?.variant?.name?.replaceAll(' + ', ' - ')}
                                                                </p>
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='d-flex ml-2'>
                                                        <Link style={{ color: 'black' }} to={linkProduct()} target="_blank" >
                                                                <InfoProduct
                                                                sku={_wareHouseBill?.variant?.sku}
                                                                // isSingle
                                                                />
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="text-center">{_wareHouseBill?.variant?.unit || '--'}</td>
                                                <td className="text-center">
                                                    <p className="text-primary" onClick={() => {
                                                        // setDataInfo(_wareHouseBill?.expired_info)
                                                        // setShowExpired(true)
                                                    }}>{_wareHouseBill?.expired_info?.length > 0 ? `${_wareHouseBill?.expired_info?.length} lô hạn` : '--'}</p>
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
                                        history.push(`/products/warehouse-bill/list`);
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
                    <>
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
                    </>
                )} */}
            </div>
        </>
    )
}

export default memo(TableWarehouseBillOutExpire);