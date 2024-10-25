import React, { memo, useMemo, useEffect, Fragment, useState, useCallback } from 'react';
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";

import { useMutation, useQuery } from "@apollo/client";
import { useParams } from 'react-router-dom';
import _ from 'lodash';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import dayjs from 'dayjs';
import { Helmet } from 'react-helmet-async';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import query_detailFinanceOrder from '../../../../graphql/query_detailFinanceOrder';
import { useIntl } from 'react-intl';
import Table from './Table';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import query_sme_catalog_product_variant from '../../../../graphql/query_sme_catalog_product_variant';
// import query_warehouse_bills from '../../../../../graphql/query_warehouse_bills';
import client from '../../../../apollo';
import { formatNumberToCurrency } from '../../../../utils';
// import query_scGetOrder from '../../../../../graphql/query_scGetOrder';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';
import { STATUS_EXPORT_BILL } from '../manage-finance-orders/constants';
import mutate_reloadFinanceOrderCostPrice from '../../../../graphql/mutate_reloadFinanceOrderCostPrice';
import { useToasts } from 'react-toast-notifications';
import mutate_createMultipleInvoice from '../../../../graphql/mutate_createMultipleInvoice';
import { useSelector } from 'react-redux';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const DetailFinanceOrder = memo(() => {
    const params = useParams();
    const { formatMessage } = useIntl()
    const [isCopied, setIsCopied] = useState(false);
    const { setBreadcrumbs } = useSubheader();
    const { addToast } = useToasts();
    const [scProducts, setScProducts] = useState([])
    const user = useSelector((state) => state.auth.user);

    useEffect(() => { setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Bán hàng' }) }]) }, []);


    //=============== Queries data ========================
    const { data: storesAndChannel, loading: loadingGetStores } = useQuery(query_sc_stores_basic, {
        variables: {
            where: { order_id: { _eq: Number(params.id) } },
        }
    });

    const { data, loading: loadingDetailFinanceOrder, error, refetch } = useQuery(query_detailFinanceOrder, {
        variables: {
            id: Number(params.id)
        }
    });

    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    //===================== mutate ========================

    const [reloadFinanceOrderCostPrice, { loading: loadingReloadFinance }] = useMutation(
        mutate_reloadFinanceOrderCostPrice,
        { refetchQueries: true }
    );

    const [createMultipleInvoice, { loading: loadingCreateMultipleInvoice }] = useMutation(
        mutate_createMultipleInvoice,
        { refetchQueries: true, }
    );

    //=======================================


    const smeWarehouseOrder = useMemo(() => {
        if (!dataSmeWarehouse) return null;
        const findedSmeWarehouse = dataSmeWarehouse?.sme_warehouses?.find(wh => wh?.id == data?.detailFinanceOrder?.financeOrderItem[0]?.sme_warehouse_id);

        return findedSmeWarehouse;
    }, [dataSmeWarehouse, data]);


    const store = useMemo(() => {
        const selectCurrentStore = storesAndChannel?.sc_stores?.find(store => store?.id == data?.detailFinanceOrder?.store_id)
        const findChannel = storesAndChannel?.op_connector_channels?.find(plf => plf.code == selectCurrentStore?.connector_channel_code)

        return {
            ...selectCurrentStore,
            url: findChannel?.logo_asset_url,
        }
    }, [data, storesAndChannel])


    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false); }, 1500)
    };
    //============================ mutate action ====================================

    const updateCostPrice = async () => {
        const { data: dataReloadFinance } = await reloadFinanceOrderCostPrice({
            variables: {
                list_finance_order_id: [data?.detailFinanceOrder?.id]
            }
        })
        if (!!dataReloadFinance?.reloadFinanceOrderCostPrice?.success) {
            addToast(formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
            refetch()
            return
        }
        addToast(dataReloadFinance?.reloadFinanceOrderCostPrice?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: 'error' })
        return
    }

    const handleCreateMultipleInvoice = async () => {
        const { data: dataCreateMultipleInvoice } = await createMultipleInvoice({
            variables: {
                list_id: [data?.detailFinanceOrder?.id]
            }
        })
        if (!!dataCreateMultipleInvoice?.createMultipleInvoice?.success && dataCreateMultipleInvoice?.createMultipleInvoice?.total_error == 0) {
            addToast(formatMessage({ defaultMessage: 'Xuất hóa đơn thành công' }), { appearance: 'success' })
            return
        }
        addToast(formatMessage({ defaultMessage: 'Xuất hóa đơn thất bại' }), { appearance: 'error' })
    }
    //=================== views ==============================
    const statusExportBill = useMemo(() => {
        return STATUS_EXPORT_BILL.find(({ status }) => status == data?.detailFinanceOrder?.invoice?.status) || {}
    }, [data])

    const _renderPayment = useMemo(() => {
        return (
            <>
                <Card className="py-4 px-4" style={{ minHeight: 180 }}>
                    <div className='d-flex flex-column pb-4'>
                        <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Thông tin thanh toán' })}</strong>
                    </div>
                    <div className='row pb-4'>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Phương thức thanh toán' })}</span>
                                <span>{data?.detailFinanceOrder?.payment_method || '--'}</span>
                            </div>
                        </div>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Người mua' })}</span>
                                <span>{data?.detailFinanceOrder?.customer_username || '--'}</span>
                            </div>
                        </div>
                    </div>
                    <div className='row pb-4'>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Chiết khấu' })}</span>
                                <span>{<div>{formatNumberToCurrency(data?.detailFinanceOrder?.sum_discount)}đ</div>}</span>
                            </div>
                        </div>

                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Tổng tiền đơn hàng' })}</span>
                                <span>{data?.detailFinanceOrder?.sum_original_price ? <div>{formatNumberToCurrency(data?.detailFinanceOrder?.sum_original_price)}đ</div> : '0đ'}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        )
    }, [store, data]);

    const _renderInfoTimeProcess = useMemo(() => {
        return (
            <>
                <Card className="py-4 px-4" style={{ minHeight: 180 }}>
                    <div className='d-flex flex-column pb-4'>
                        <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Thời gian xử lý' })}</strong>
                    </div>
                    <div className='row pb-4'>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Thời gian tạo đơn:' })}</span>
                                <span>{dayjs.unix(data?.detailFinanceOrder?.order_at).format("DD/MM/YYYY HH:mm")}</span>
                            </div>
                        </div>

                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                {data?.detailFinanceOrder?.object_type == 1 ? (
                                    <>
                                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Giao cho người mua:' })}</span>
                                        <span>{data?.detailFinanceOrder?.received_at ? dayjs.unix(data?.detailFinanceOrder?.received_at).format("DD/MM/YYYY HH:mm") : '--'}</span>
                                    </>
                                ) : (

                                    <>
                                        <span className='text-muted'>{formatMessage({ defaultMessage: 'Đơn hàng liên quan:' })}</span>
                                        <div className='d-flex align-items-center'>
                                            <span>{`${data?.detailFinanceOrder?.order_ref_id || '--'}`}</span>
                                            <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.detailFinanceOrder?.order_ref_id)}>

                                                    <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                                                </span>
                                            </OverlayTrigger>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>

                    </div>
                    <div className='row pb-4'>
                        <div className='col-12'>
                            <div className='d-flex flex-column'>
                                {data?.detailFinanceOrder?.object_type == 1 ?
                                    <>
                                        <span className='text-muted'>
                                            {formatMessage({ defaultMessage: 'Thời gian hoàn thành' })}
                                        </span>
                                        <span>{data?.detailFinanceOrder?.completed_at ? dayjs(data?.detailFinanceOrder?.completed_at * 1000).format("DD/MM/YYYY HH:mm") : '--'}</span>
                                    </>
                                    :
                                    <>
                                        <span className='text-muted'>
                                            {formatMessage({ defaultMessage: 'Thời gian hoạch toán' })}
                                        </span>
                                        <span>--</span>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        )

    }, [data]);

    const _renderInfoWarehouse = useMemo(() => {
        const viewTime = () => {
            if (data?.detailFinanceOrder?.object_type == 2) {
                return data?.detailFinanceOrder?.wh_imported_at ? dayjs(data?.detailFinanceOrder?.wh_imported_at).format("DD/MM/YYYY HH:mm") : '--'
            }
            return data?.detailFinanceOrder?.wh_exported_at ? dayjs(data?.detailFinanceOrder?.wh_exported_at).format("DD/MM/YYYY HH:mm") : '--'
        }
        return (
            <>
                <Card className="py-4 px-4" style={{ minHeight: 180 }}>
                    <div className='d-flex flex-column pb-4'>
                        <strong style={{ fontSize: 14, color: '#000' }}>{formatMessage({ defaultMessage: 'Tình trạng kho & hóa đơn' })}</strong>
                    </div>

                    <div className='row pb-4'>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{data?.detailFinanceOrder?.object_type == 2 ? formatMessage({ defaultMessage: 'Nhập kho:' }) : formatMessage({ defaultMessage: 'Xuất kho:' })}</span>
                                <span>
                                    {viewTime()}
                                </span>
                            </div>
                        </div>

                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Kho:' })}</span>
                                <span>{smeWarehouseOrder?.name || '--'}</span>
                            </div>
                        </div>

                    </div>
                    <div className='row pb-4'>
                        <div className='col-6'>
                            {data?.detailFinanceOrder?.object_type == 2 ? (
                                <div className='d-flex flex-column'>
                                    <span className='text-muted'>
                                        {formatMessage({ defaultMessage: 'Hóa đơn đã xuất' })}</span>
                                    <span>{data?.detailFinanceOrder?.invoice?.inv_transaction_id ? data?.detailFinanceOrder?.invoice?.inv_transaction_id : '--'}</span>
                                </div>
                            ) : (
                                <div className='d-flex flex-column'>
                                    <span className='text-muted'>
                                        {formatMessage({ defaultMessage: 'Xuất hóa đơn' })}</span>
                                    <span>{data?.detailFinanceOrder?.invoice?.created_at ? dayjs(data?.detailFinanceOrder?.invoice?.created_at).format("DD/MM/YYYY HH:mm") : '--'}</span>
                                </div>
                            )}

                        </div>
                        <div className='col-6'>
                            <div className='d-flex flex-column'>
                                <span className='text-muted'>{formatMessage({ defaultMessage: 'Trạng thái hóa đơn:' })}</span>
                                {!!statusExportBill?.label ? (
                                    <div className='d-flex align-items-center'>
                                        <div className='mr-1'>
                                            <svg style={{
                                                stroke: 'white',
                                                strokeWidth: 1,
                                                fill: statusExportBill?.color || 'black'
                                            }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-check"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="m9 15 2 2 4-4" /></svg>
                                        </div>
                                        <span>{formatMessage(statusExportBill?.label) || '--'}</span>
                                    </div>
                                ) : '--'}
                            </div>
                        </div>
                    </div>
                </Card>
            </>
        )
    }, [data, smeWarehouseOrder, statusExportBill]);

    const queryGetProductVariants = async (ids) => {
        if (ids?.length == 0) return [];

        const { data } = await client.query({
            query: query_sme_catalog_product_variant,
            variables: {
                where: {
                    id: { _in: ids },
                },
            },
            fetchPolicy: "network-only",
        });

        return data?.sme_catalog_product_variant || [];
    }

    useMemo(async () => {
        try {
            const financeOrderItemsId = data?.detailFinanceOrder?.financeOrderItem?.flatMap(item => {
                if(!item?.parent_sme_variant_id) {
                    return item?.sme_variant_id
                }
                return []
            })

            const parentSmeVariantId = data?.detailFinanceOrder?.financeOrderItem?.flatMap(item => {
                if (!!item?.parent_sme_variant_id) {
                    return item?.parent_sme_variant_id
                }
                return []
            })

            const productsVariant = await queryGetProductVariants([...financeOrderItemsId, ...new Set(parentSmeVariantId)])
            const comboItemId = productsVariant?.map(item => item?.combo_items?.map(comboItem => comboItem?.combo_item?.id)).flat()

            const parse = productsVariant?.map(item => {
                const financeOrderItem = data?.detailFinanceOrder?.financeOrderItem?.find(order => order?.sme_variant_id == item?.id)

                if (!!item?.is_combo) {
                    const comboItems = item?.combo_items?.map((combo, index, arr) => {
                        const findComboItem = data?.detailFinanceOrder?.financeOrderItem?.find(order =>
                            (order?.sme_variant_id == combo?.combo_item?.id) && (order?.parent_sme_variant_id === item?.id))

                        return {
                            id: combo?.combo_item?.sme_catalog_product?.id,
                            isComboItem: combo?.combo_item?.is_combo,
                            firstItem: Boolean(index == 0),
                            borderBottomNone: !Boolean(index == (arr?.length - 1)),
                            name: combo?.combo_item?.sme_catalog_product?.name,
                            img: combo?.combo_item?.sme_catalog_product_variant_assets[0]?.asset_url,
                            sku: combo?.combo_item?.sku,
                            attributes: combo?.combo_item?.attributes?.length > 0 ? combo?.combo_item?.name : '',
                            is_gift: findComboItem?.is_gift,
                            cost_price: findComboItem?.cost_price, //gia von
                            inc_vat_original_price: findComboItem?.inc_vat_original_price, // don gia
                            quantity_purchased: findComboItem?.quantity_purchased, // so luong
                            inc_vat_sum_original_price: findComboItem?.inc_vat_sum_original_price, // thanhh tien
                            inc_vat_sum_discount: findComboItem?.inc_vat_sum_discount, // chiet khau
                            goods_money_amount: findComboItem?.inc_vat_sum_original_price - findComboItem?.inc_vat_sum_discount, // tien hang
                            import_quantity: findComboItem?.import_quantity,
                            vat_rate: findComboItem?.vat_rate, // thue suat
                            vat_amount: findComboItem?.vat_amount, // thue gtgt,
                            is_combo: item?.is_combo,
                            combo_items_info: item?.combo_items,
                            skuOrderCombo: item?.sku,
                            unit: combo?.combo_item?.unit,
                            variant_full_name: item?.variant_full_name
                        }
                    })
                    return comboItems
                }
                return {
                    id: item?.sme_catalog_product?.id,
                    name: item?.sme_catalog_product?.name,
                    img: item?.sme_catalog_product_variant_assets[0]?.asset_url,
                    sku: item?.sku,
                    attributes: item?.attributes?.length > 0 ? item?.name : '',
                    is_gift: financeOrderItem?.is_gift,
                    cost_price: financeOrderItem?.cost_price,
                    inc_vat_original_price: financeOrderItem?.inc_vat_original_price,
                    quantity_purchased: financeOrderItem?.quantity_purchased,
                    inc_vat_sum_original_price: financeOrderItem?.inc_vat_sum_original_price,
                    inc_vat_sum_discount: financeOrderItem?.inc_vat_sum_discount,
                    goods_money_amount: financeOrderItem?.inc_vat_sum_original_price - financeOrderItem?.inc_vat_sum_discount, // tien hang
                    is_combo: item?.is_combo,
                    import_quantity: financeOrderItem?.import_quantity,
                    vat_rate: financeOrderItem?.vat_rate,
                    vat_amount: financeOrderItem?.vat_amount,
                    unit: item?.unit,
                    variant_full_name: item?.variant_full_name
                }
            })?.flat()
            setScProducts(parse)


        } catch (err) {

        }

    }, [data])

    if (!!error && !loadingDetailFinanceOrder) {
        return <div className="col-12 row d-flex justify-content-center mt-8">
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
    }
    const metaTitle = data?.detailFinanceOrder?.object_type == 2 ? formatMessage({ defaultMessage: " Chi tiết trả lại hàng" }) : formatMessage({ defaultMessage: "Chi tiết đơn bán hàng" }) + " - UpBase"
    return (
        <Fragment>
            <Helmet titleTemplate={metaTitle + ' - Upbase'} defaultTitle={metaTitle + ' - Upbase'}>
                <meta name="description" content={metaTitle + ' - Upbase'} />
            </Helmet>

            <LoadingDialog show={loadingReloadFinance || loadingCreateMultipleInvoice} />

            <div className='row col-12 mb-2'>
                <div className='col-4 p-0 d-flex align-items-center'>
                    <div className='d-flex align-items-center'>
                        <div className='align-items-center mr-2'>
                            <img src={store?.url} style={{ width: 15, height: 15, objectFit: 'contain' }} alt="" />
                            <span className='ml-1'>{store?.name}</span>
                        </div>

                        <div>
                            <span className='mr-1'>{data?.detailFinanceOrder?.object_type == 2 ? formatMessage({ defaultMessage: 'Chứng từ trả lại hàng' }) : formatMessage({ defaultMessage: 'Chứng từ bán hàng' })}:</span>

                            <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.detailFinanceOrder?.code)}>
                                    {`${data?.detailFinanceOrder?.code || '--'}`}
                                    <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                                </span>
                            </OverlayTrigger>

                        </div>
                    </div>
                </div>
                <div className='col-3 p-0 d-flex align-items-center'>

                    <div style={{ cursor: 'pointer' }} onClick={() => window.open(`/orders/${data?.detailFinanceOrder?.order_id}`, "_blank")} className='d-flex align-items-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</span>
                        {`${data?.detailFinanceOrder?.ref_id}`}
                    </div>
                    <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span> </Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.detailFinanceOrder?.ref_id)}>

                            <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                        </span>
                    </OverlayTrigger>
                </div>
                <div className='col-5 p-0 d-flex align-items-center justify-content-between'>
                    <div className='d-flex align-items-center'>
                        {data?.detailFinanceOrder?.object_type == 1 && (
                            <>
                                <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã tra cứu' })}:</span>

                                <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span> </Tooltip>}>
                                    <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(data?.detailFinanceOrder?.invoice?.inv_transaction_id)}>
                                        {`${data?.detailFinanceOrder?.invoice?.inv_transaction_id || ''}`}
                                        <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                                    </span>
                                </OverlayTrigger>
                            </>
                        )}
                    </div>
                    {!data?.detailFinanceOrder?.is_old_order && (
                        <div className='p-0 d-flex align-items-center justify-content-end'>
                            <AuthorizationWrapper keys={['finance_order_cost_price_process']}>
                                 <button
                                    className='btn btn-primary'
                                    disabled={loadingDetailFinanceOrder}
                                    onClick={updateCostPrice}
                                >
                                    {formatMessage({ defaultMessage: "Cập nhật giá vốn" })}
                                </button>
                            </AuthorizationWrapper>
                            {data?.detailFinanceOrder?.object_type == 1 && (
                                <AuthorizationWrapper keys={['finance_order_manage_export']}>
                                    <button className='ml-2 btn btn-primary' disabled={loadingDetailFinanceOrder || !!data?.detailFinanceOrder?.invc_exported} onClick={handleCreateMultipleInvoice}>
                                        {formatMessage({ defaultMessage: "Xuất hóa đơn" })}
                                    </button>
                                </AuthorizationWrapper>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className='row'>

                <div className='col-4'>
                    {_renderPayment}
                </div>
                <div className='col-4'>
                    {_renderInfoTimeProcess}
                </div>
                <div className='col-4'>
                    {_renderInfoWarehouse}
                </div>
            </div>
            <div className='row'>
                <div className='col-12'>
                    <Card className="py-10 px-4">
                        <Table
                            loading={loadingDetailFinanceOrder}
                            detailOrder={data?.detailFinanceOrder}
                            data={scProducts}
                        />
                    </Card>
                </div>
            </div >
        </Fragment >
    )
});

export default DetailFinanceOrder;

export const actionKeys = {
    "finance_detail_order_view": {
        router: '/finance/:id',
        actions: ["detailFinanceOrder", "sc_stores", "op_connector_channels", "sme_warehouses", "sme_catalog_product_variant", "sme_catalog_product_variant_aggregate"],
        name: 'Xem chi tiết đơn bán hàng',
        group_code: 'finance_sell',
        group_name: 'Bán hàng',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
  };