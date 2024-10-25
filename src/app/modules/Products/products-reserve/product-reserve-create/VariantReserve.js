import React, { Fragment, memo, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, InputVertical } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useFormikContext } from "formik";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import query_sme_catalog_product_variant from "../../../../../graphql/query_sme_catalog_product_variant";
import client from "../../../../../apollo";
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
import query_scGetWarehouseMapping from "../../../../../graphql/query_scGetWarehouseMapping";
import { useQuery } from "@apollo/client";

const LIMIT_ADD_VARIANT = 100;

const VariantReserve = ({
    onShowModalAddVariant,
    variantsReserve,
    onRemoveVariant,
    dataSmeWarehouses,
    onShowModalVariant,
    onShowModalWarning,
    smeWarehousesFilter,
    setSmeWarehousesFilter,
    scVariants
}) => {
    console.log(variantsReserve)
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();
    const [currentComboId, setCurrentComboId] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [dataCombo, setDataCombo] = useState(null);
    const [currentSmeVariant, setCurrentSmeVariant] = useState(null);
    const {data: dataWarehouseMapping} = useQuery(query_scGetWarehouseMapping, {
        variables: {
            store_id: +values?.store?.value
        },
        onCompleted: (data) => {
            setSmeWarehousesFilter(dataSmeWarehouses?.sme_warehouses?.filter(wh => {
                return !!data?.scGetWarehouseMapping?.find(item => item?.sme_warehouse_id == wh?.id)
            }))
        }
    })
    //Check if there was atleast a sme warehouse connect to the store
    const isMapping = dataWarehouseMapping?.scGetWarehouseMapping?.some(item => !!item?.sc_warehouse_id && !!item?.sme_warehouse_id)

    // Filter warehouse that connect to the selected store only
    // const smeWarehouses = dataSmeWarehouses?.sme_warehouses?.filter(wh => {
    //     return !!dataWarehouseMapping?.scGetWarehouseMapping?.find(item => item?.sme_warehouse_id == wh?.id)
    // })
    // useMemo(async () => {
    //     const listIds = variantsReserve?.map(item => item?.sc_variant_id)
    //     const listScVariants = await queryGetScVariantsByIds(listIds)
    //     setScVariants(listScVariants)
    // }, [variantsReserve])
    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên sản phẩm sàn' }),
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
                                productOrder={true}
                                sku={scVariant?.sku}
                                url={() => window.open(url, "_blank")}
                            />
                            <div className='text-muted'>
                                {scVariant?.name || ''}
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
                                isSingle
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
                                            isSingle
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
                console.log(_item)
                console.log(record)
                return (
                    <div>
                        {record?.unit || '--'}
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
                const totalQuantity = sum(record?.inventories?.map(iv => values[`variant-${record?.id}-${iv?.sme_store_id}-quantity`] || 0));

                return (
                    <div className="d-flex flex-column justify-content-center align-items-center">
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
        // {
        //     title: formatMessage({ defaultMessage: 'Liên kết' }),
        //     dataIndex: 'name',
        //     key: 'name',
        //     align: 'center',
        //     width: '10%',
        //     render: (_item, record) => {
        //         return (
        //             <span className="text-primary cursor-pointer" onClick={() => onShowModalVariant(record?.id)}>
        //                 {formatMessage({ defaultMessage: '{count} liên kết' }, { count: record?.sc_variant_linked?.length })}
        //             </span>
        //         )
        //     }
        // },
        {
            title: <></>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '5%',
            render: (_item, record) => {
                return (
                    <i
                        className="fas fa-trash-alt"
                        style={{ color: 'red', cursor: 'pointer' }}
                        onClick={() => {
                            setFieldValue('__changed__', true);
                            onRemoveVariant(record?.id)
                        }}
                    />
                )
            }
        },
    ];

    return (
        <Fragment>
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}
            {!!currentSmeVariant && <ModalConfigReserve
                currentSmeVariant={currentSmeVariant}
                currentComboId={currentComboId}
                isReadOnly={!!currentComboId}
                smeWarehouses={smeWarehousesFilter || []}
                onHide={() => {
                    setCurrentSmeVariant(null);
                    setCurrentComboId(null);
                }}
            />}
            <Card>
                <CardHeader
                    title={formatMessage({ defaultMessage: 'Hàng hóa cần dự trữ' })}
                />
                <CardBody>
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <span className="ml-1">
                                {formatMessage({ defaultMessage: 'Tổng hàng hóa cần dự trữ: {count} / {max}' }, { count: variantsReserve?.length, max: LIMIT_ADD_VARIANT })}
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
                        <button
                            className="btn btn-primary d-flex align-items-center"
                            style={{ minWidth: 120, cursor: variantsReserve?.length >= LIMIT_ADD_VARIANT ? 'not-allowed' : 'pointer' }}
                            disabled={variantsReserve?.length >= LIMIT_ADD_VARIANT || !values?.store}
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
                        </button>
                    </div>
                    {variantsReserve?.length > 0 && (
                        <div>
                            <Table
                                className="upbase-table"
                                columns={columns}
                                data={variantsReserve?.slice(limit * (page - 1), limit + limit * (page - 1)) || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                    )}
                    {variantsReserve?.length > 0 && (
                        <div style={{ width: '100%', marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                            <PaginationModal
                                page={page}
                                limit={limit}
                                onSizePage={(limit) => setLimit(limit)}
                                onPanigate={(page) => setPage(page)}
                                totalPage={Math.ceil(variantsReserve?.length / limit)}
                                totalRecord={variantsReserve?.length || 0}
                                count={variantsReserve?.slice(limit * (page - 1), limit + limit * (page - 1))?.length}
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