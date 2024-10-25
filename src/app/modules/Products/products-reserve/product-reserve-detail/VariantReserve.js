import React, { Fragment, memo, useMemo, useState, useCallback } from "react";
import { Card, CardBody, CardHeader, Checkbox, InputVertical } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { useFormikContext } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import { formatNumberToCurrency } from "../../../../../utils";
import Table from 'rc-table';
import * as Yup from "yup";
import 'rc-table/assets/index.css';
import InfoProduct from "../../../../../components/InfoProduct";
import ModalCombo from "../../products-list/dialog/ModalCombo";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import PaginationModal from "../../../../../components/PaginationModal";
import ModalConfigReserve from "../dialogs/ModalConfigReserve";
import { sum } from "lodash";
import clsx from "clsx";
import { useQuery } from "@apollo/client";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import ModalResults from "../dialogs/ModalResults";
import ModalConfirm from "../dialogs/ModalConfirm";
import { useProductsReserveDetailContext } from "./ProductReserveDetailContext";
import query_scGetWarehouseMapping from "../../../../../graphql/query_scGetWarehouseMapping";
import { LIMIT_ADD_VARIANT } from "./ProductReserveDetailHelper";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const VariantReserve = ({
    onShowModalAddVariant,
    id,
    variantsReserve,
    onRemoveVariant,
    loadingReserveTicketItems,
    currentStatus,
    setCurrentStatus,
    scVariants,
    onShowModalWarning,
    smeWarehousesFilter,
    setSmeWarehousesFilter
}) => {
    const {
        smeWarehouses, 
        userReserveRetryByVariant, 
        loadingUserReserveRetryByVariant,
        userReserveRemoveItem,
    } = useProductsReserveDetailContext()
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();

    const [page, setPage] = useState(1);
    const [ids, setIds] = useState([]);
    const [dataResults, setDataResults] = useState(null);
    const [dataCombo, setDataCombo] = useState(null);
    const [currentSmeVariant, setCurrentSmeVariant] = useState(null);
    const [currentComboId, setCurrentComboId] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false)
    const [removeVariant, setRemoveVariant] = useState({})
    const {data: dataWarehouseMapping} = useQuery(query_scGetWarehouseMapping, {
        variables: {
            store_id: +values?.store?.value
        }, 
        onCompleted: (data) => {
            setSmeWarehousesFilter(smeWarehouses?.sme_warehouses?.filter(wh => {
                return !!data?.scGetWarehouseMapping?.find(item => item?.sme_warehouse_id == wh?.id)
            }))
        }
    })
    //Check if there was atleast a sme warehouse connect to the store
    const isMapping = dataWarehouseMapping?.scGetWarehouseMapping?.some(item => !!item?.sc_warehouse_id && !!item?.sme_warehouse_id)

    const TABS_RESERVE_TICKET_ITEM = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Khấu trừ thành công' }),
                status: 'success',
                count: [...variantsReserve]?.filter(item => item?.status_ticket_item == 'success')?.length
            },
            {
                title: formatMessage({ defaultMessage: 'Khấu trừ lỗi' }),
                status: 'error',
                count: [...variantsReserve]?.filter(item => item?.status_ticket_item == 'error')?.length
            },
            {
                title: formatMessage({ defaultMessage: 'Chưa khấu trừ' }),
                status: 'pending',
                count: [...variantsReserve]?.filter(item => item?.status_ticket_item == 'pending')?.length
            }
        ]
    }, [variantsReserve]);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return [...variantsReserve]?.filter(item => item?.status_ticket_item == 'error')?.some(item => item?.id === _id?.id);
    })?.length == [...variantsReserve]?.filter(item => item?.status_ticket_item == 'error')?.length;

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                {values?.status == 'processing' && currentStatus == 'error' && (
                    <div className="mr-2">
                        <Checkbox
                            size="checkbox-md"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={isSelectAll}
                            onChange={e => {
                                if (isSelectAll) {
                                    setIds(ids.filter(x => {
                                        return ![...variantsReserve]?.filter(item => item?.status_ticket_item == 'error')?.some(ticket => ticket.id === x.id);
                                    }))
                                } else {
                                    const tempArray = [...ids];
                                    ([...variantsReserve]?.filter(item => item?.status_ticket_item == 'error') || []).forEach(ticket => {
                                        if (ticket && !ids.some(item => item.id === ticket.id)) {
                                            tempArray.push(ticket);
                                        }
                                    })
                                    setIds(tempArray)
                                }
                            }}
                        />
                    </div>
                )}
                <span>{formatMessage({ defaultMessage: 'Tên sản phẩm sàn' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '25%',
            render: (_item, record) => {
                let scVariant
                if(record?.status_ticket_item != 'pending') {
                    scVariant = scVariants?.find(item => item?.id == record?.sc_variant_id)
                } else {
                    scVariant = record
                }
                let imgAssets = null;
                if (scVariant?.product?.productAssets?.[0]?.origin_image_url) {
                    imgAssets = scVariant?.product?.productAssets?.[0]
                }

                let url = `/product-stores/edit/${scVariant?.product?.id}`;
                return (
                    <div className="d-flex">
                        {values?.status == 'processing' && currentStatus == 'error' && (
                            <div className="mr-2">
                                <Checkbox
                                    size="checkbox-md"
                                    inputProps={{
                                        'aria-label': 'checkbox',
                                    }}
                                    isSelected={ids.some(_id => _id?.id == record?.id)}
                                    onChange={e => {
                                        if (ids.some((_id) => _id.id == record.id)) {
                                            setIds(prev => prev.filter((_id) => _id.id != record.id));
                                        } else {
                                            setIds(prev => prev.concat([record]));
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <div className="d-flex">
                            <Link to={url} target="_blank">
                                <div style={{
                                    backgroundColor: '#F7F7FA',
                                    width: 40, height: 40,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    minWidth: 40
                                }} className='mr-6' >
                                    {
                                        !!imgAssets && <img src={imgAssets?.origin_image_url}
                                            style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                    }
                                </div>
                            </Link>
                            <div className='ml-1 d-flex flex-column'>
                                <InfoProduct
                                    name={scVariant?.product?.name}
                                    sku={scVariant?.sku}
                                    productOrder={true}
                                    url={() => window.open(url, "_blank")}
                                />
                                <div className='text-muted'>
                                    {scVariant?.name || ''}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'SKU hàng hóa kho liên kết' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '25%',
            render: (_item, record) => {
                return (
                    <div className="d-flex flex-column">
                        <div className='d-flex align-items-center'>
                            <InfoProduct
                                sku={record?.sme_sku || record?.sku}
                            />
                            {
                                record?.combo_items?.length > 0 && (
                                    <span
                                        className='text-primary cursor-pointer ml-2'
                                        style={{ minWidth: 'fit-content' }}
                                        onClick={() => setDataCombo(record?.combo_items)}
                                    >
                                        Combo
                                    </span>
                                )
                            }
                        </div>
                        {!!record?.is_combo && (
                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                {record?.combo_items?.map(item => (
                                    <div key={`sku-reserve-${item?.id}`} className='d-flex align-items-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1 bi bi-arrow-return-right" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5z" />
                                        </svg>
                                        <InfoProduct
                                            sku={item?.combo_item?.sku}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'ĐVT' }),
            dataIndex: 'variantUnit',
            key: 'variantUnit',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return (
                    <div className="d-flex flex-column">
                        <div className='d-flex align-items-center justify-content-center'>
                        {record?.unit || '--'}
                        </div>
                        {!!record?.is_combo && (
                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                {record?.combo_items?.map(item => (
                                    <div key={`unit-reserve-${item?.id}`} className='d-flex align-items-center'>
                                       {item?.combo_item?.unit || '--'}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng dự trữ' }),
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                const totalQuantity = sum(record?.inventories?.map(iv => values[`variant-${record?.sc_variant_id || record?.id}-${iv?.sme_store_id}-quantity`] || 0));

                return (
                    record?.status_ticket_item != 'pending' ? <div className="d-flex flex-column justify-content-center align-items-center">
                        <div className="d-flex align-items-center" onClick={() => setCurrentSmeVariant(record)}>
                            <span className="mr-2">
                                {formatNumberToCurrency(totalQuantity)}
                            </span>
                            <svg style={{ position: 'relative', top: -1 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-primary cursor-pointer bi bi-house-door-fill" viewBox="0 0 16 16">
                                <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                            </svg>
                        </div>
                        {!!record?.is_combo && (
                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                {record?.combo_items?.map(item => (
                                    <div className="d-flex align-items-center" onClick={() => {
                                        setCurrentComboId(record?.id);
                                        setCurrentSmeVariant(item?.combo_item)
                                    }}>
                                        <span className="mr-2">
                                            {formatNumberToCurrency(totalQuantity * item?.quantity)}
                                        </span>
                                        <svg style={{ position: 'relative', top: -1 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-primary cursor-pointer bi bi-house-door-fill" viewBox="0 0 16 16">
                                            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div> : <div className="d-flex flex-column justify-content-center align-items-center">
                        <div className="d-flex align-items-center" onClick={() => setCurrentSmeVariant(record)}>
                            <span className="mr-2">
                                {formatNumberToCurrency(totalQuantity)}
                            </span>
                            <svg style={{ position: 'relative', top: -1 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer bi bi-pencil-square" viewBox="0 0 16 16">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
                            </svg>
                        </div>
                        {!!record?.is_combo && (
                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                {record?.combo_items?.map(item => (
                                    <div
                                        className="d-flex align-items-center"
                                        onClick={() => {
                                            setCurrentComboId(record?.id);
                                            setCurrentSmeVariant(item?.combo_item);
                                        }}
                                    >
                                        <span className="mr-2">
                                            {formatNumberToCurrency(totalQuantity * item?.quantity)}
                                        </span>
                                        <svg style={{ position: 'relative', top: -1 }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-primary cursor-pointer bi bi-house-door-fill" viewBox="0 0 16 16">
                                            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Khấu trừ' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                const totalQuantity = sum(record?.inventories?.map(iv => values[`variant-${record?.sc_variant_id || record?.id}-${iv?.sme_store_id}-quantity`] || 0));

                if (values?.status == 'finished') {
                    return '--'
                }

                return (
                    record?.status_ticket_item != 'pending' ? <div className="d-flex flex-column align-items-center justify-content-center">
                        <div className="d-flex align-items-center">
                            <span className="mr-2">
                                {formatMessage({ defaultMessage: 'Dự trữ: {count}' }, { count: formatNumberToCurrency(totalQuantity) })}
                            </span>
                            {record?.status_ticket_item == 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                </svg>
                            ) : (
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: `{mss}` }, { mss: record?.error_message_ticket_item })}
                                        </Tooltip>
                                    }
                                >
                                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                            )}
                        </div>
                        {!!record?.is_combo && (
                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                {record?.combo_items?.map(item => (
                                    <div className="d-flex align-items-center">
                                        <span className="mr-2">
                                            {formatMessage({ defaultMessage: 'Dự trữ: {count}' }, { count: formatNumberToCurrency(totalQuantity * item?.quantity) })}
                                        </span>
                                        {record?.status_ticket_item == 'success' ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                            </svg>
                                        ) : (
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        {formatMessage({ defaultMessage: `{mss}` }, { mss: record?.error_message_ticket_item })}
                                                    </Tooltip>
                                                }
                                            >
                                                <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                                    </svg>
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div> : <div>--</div>
                )
            }
        },
        values?.status == 'processing' && {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return (
                    variantsReserve?.length > 1 && 
                    <AuthorizationWrapper keys={["product_reserve_action"]}>
                        <i
                            className="fas fa-trash-alt"
                            style={{ color: 'red', cursor: 'pointer' }}
                            onClick={async () => {
                                setFieldValue('__changed__', true);
                                if (record?.status_ticket_item == 'pending') {
                                    onRemoveVariant(record?.id)
                                } else {
                                    setRemoveVariant(record)
                                    setShowConfirm(true)
                                }
                            }}
                        />
                    </AuthorizationWrapper>
                )
            }
        },
    ];

    

    const onRetryMutilTicket = useCallback(async () => {
        try {
            const { data } = await userReserveRetryByVariant({
                variables: {
                    ticket_id: Number(id),
                    reserve_items: ids?.map(item => {
                        return {
                            sc_variant_id: item?.sc_variant_id,
                            variant_id: item?.id
                        }
                    })
                }
            });
            setDataResults(data?.userReserveRetryByVariant);
            setIds([]);
        } catch (err) {
            setIds([]);
            addToast(formatMessage({ defaultMessage: 'Khấu trừ dự trữ thất bại' }), { appearance: "error" });
        }
    }, [ids, id]);

    return (
        <Fragment>
            <LoadingDialog show={loadingUserReserveRetryByVariant} />
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}
            {!!dataResults && (
                <ModalResults
                    dataResults={dataResults}
                    onHide={() => setDataResults(null)}
                    sku
                />
            )}
            {showConfirm && (
                <ModalConfirm 
                show={showConfirm}
                onHide={() => setShowConfirm(false)}
                onConfirm={async() => {
                    const {data} = await userReserveRemoveItem({
                        variables: {
                            sc_variant_id: removeVariant?.sc_variant_id,
                            variant_id: removeVariant?.id,
                            ticket_id: +removeVariant?.warehouse_reserve_ticket?.id
                        }
                    })
                    if (data?.userReserveRemoveItem?.success) {
                        addToast(formatMessage({defaultMessage: "Xoá hàng hóa dự trữ thành công"}), {appearance: 'success'})
                    } else {
                        addToast(data?.userReserveRemoveItem?.message || formatMessage({defaultMessage: "Có lỗi xảy ra, vui lòng thử lại!"}), {appearance: 'error'})
                    }
                    setShowConfirm(false)
                }}
                title={formatMessage({defaultMessage: "Hệ thống sẽ thực hiện xóa và không còn dự trữ cho hàng hóa sàn này. Bạn có đồng ý tiếp tục xóa?"})}
                />
            )}
            {!!currentSmeVariant && <ModalConfigReserve
                currentSmeVariant={currentSmeVariant}
                smeWarehouses={smeWarehousesFilter || []}
                onHide={() => setCurrentSmeVariant(null)}
                currentComboId={currentComboId}
                isReadOnly={currentStatus !== 'pending' || !!currentComboId}
            />}
            <Card>
                <CardHeader
                    title={formatMessage({ defaultMessage: 'Hàng hóa cần dự trữ' })}
                />
                <CardBody>
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <span className="ml-1">
                                {formatMessage({ defaultMessage: 'Tổng hàng hóa cần dự trữ: {count}' }, { count: variantsReserve?.length })}
                            </span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tổng hàng hoá được thêm vào danh sách' })}
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
                        </div>
                        {values?.status == 'processing' && <button
                            className="btn btn-primary d-flex align-items-center"
                            style={{ minWidth: 120, cursor: variantsReserve?.length >= LIMIT_ADD_VARIANT ? 'not-allowed' : 'pointer' }}
                            disabled={variantsReserve?.length >= LIMIT_ADD_VARIANT}
                            onClick={() => {
                                if(isMapping) {
                                    onShowModalAddVariant()
                                } else {
                                    onShowModalWarning()
                                }
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                            <span>{formatMessage({ defaultMessage: "Thêm nhanh hàng hóa" })}</span>
                        </button>}
                    </div>
                        {values?.status == 'processing' && currentStatus == 'error' && (
                            <div className="d-flex align-items-center justify-content-end">
                                <div className="mr-2 text-primary" style={{ fontSize: 14 }}>
                                    {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                                </div>
                                <AuthorizationWrapper keys={['product_reserve_action']}>
                                <button
                                    type="button"
                                    className="btn btn-elevate btn-primary ml-4"
                                    disabled={ids?.length == 0}
                                    style={{
                                        color: "white",
                                        width: 'max-content',
                                        minWidth: 120,
                                        background: ids?.length == 0 ? "#6c757d" : "",
                                        border: ids?.length == 0 ? "#6c757d" : "",
                                    }}
                                    onClick={onRetryMutilTicket}
                                >
                                    {formatMessage({ defaultMessage: "Thử lại" })}
                                </button>
                                </AuthorizationWrapper>
                            </div>
                        )}
                    <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs" id="myTab" role="tablist">
                                {TABS_RESERVE_TICKET_ITEM.map((_tab, index) => {
                                    const { title, status, count } = _tab;
                                    const isActive = status == currentStatus;

                                    return (
                                        <>
                                            <li
                                                key={`tab-reserve-ticket-item-${index}`}
                                                className={clsx(`nav-item cursor-pointer`, { active: isActive })}
                                            >
                                                <span className={clsx(`nav-link font-weight-normal`, { active: isActive })}
                                                    style={{ fontSize: "13px" }}
                                                    onClick={() => {
                                                        setIds([]);
                                                        setCurrentStatus(status);
                                                    }}
                                                >
                                                    {title}
                                                    <span className='ml-2'>
                                                        ({loadingReserveTicketItems ? '--' : count})
                                                    </span>
                                                </span>
                                            </li>
                                        </>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {loadingReserveTicketItems && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                            <span className="spinner spinner-primary" />
                        </div>}
                        <Table
                            className="upbase-table"
                            style={loadingReserveTicketItems ? { opacity: 0.4 } : {}}
                            columns={columns}
                            data={variantsReserve?.filter(item => item?.status_ticket_item == currentStatus)?.slice(25 * (page - 1), 25 + 25 * (page - 1)) || []}
                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}</span>
                            </div>}
                            tableLayout="auto"
                            sticky={{ offsetHeader: 0 }}
                        />
                    </div>
                    {variantsReserve?.filter(item => item?.status_ticket_item == currentStatus)?.length > 0 && (
                        <div style={{ width: '100%', marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                            <PaginationModal
                                page={page}
                                limit={25}
                                onPanigate={(page) => setPage(page)}
                                totalPage={Math.ceil(variantsReserve?.filter(item => item?.status_ticket_item == currentStatus)?.length / 25)}
                                totalRecord={variantsReserve?.filter(item => item?.status_ticket_item == currentStatus)?.length || 0}
                                count={variantsReserve?.filter(item => item?.status_ticket_item == currentStatus)?.slice(25 * (page - 1), 25 + 25 * (page - 1))?.length}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(VariantReserve);