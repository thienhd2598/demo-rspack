import React, { useMemo, memo, Fragment, useState } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody, CardHeader, InputVertical, InputVerticalWithIncrease, TextArea } from "../../../../../../_metronic/_partials/controls";
import { Accordion, useAccordionToggle } from 'react-bootstrap';
import { Field, useFormikContext } from "formik";
import { ReSelectVertical } from "../../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import { useOrderManualContext } from "../../OrderManualContext";
import ModalAddVariants from "../../dialogs/ModalAddVariants";
import { formatNumberToCurrency } from "../../../../../../utils";
import Table from "rc-table";
import { Link, useLocation } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import PaginationModal from "../../../../../../components/PaginationModal";
import ModalCombo from "../../../../Products/products-list/dialog/ModalCombo";
import InfoSmeProduct from "../../../../../../components/InfoProduct";
import { InputSelectAddons } from "../../../../../../_metronic/_partials/controls/forms/InputSelectAddons";
import { OPTIONS_UNIT } from "../../OrderManualHelper";

const LIMIT_ADD_VARIANT = 30;

const InfoProduct = () => {
    const { formatMessage } = useIntl();
    const { variantsOrder, setVariantsOrder, loadingProduct, smeWarehouseSelected } = useOrderManualContext();
    const { setFieldValue, values, setValues } = useFormikContext();
    const [showAddVariants, setShowAddVariants] = useState(false);
    const [search, setSearch] = useState("");
    const [dataCombo, setDataCombo] = useState(null);
    const [page, setPage] = useState(1);
    const location = useLocation()
    const [limit, setLimit] = useState(30);

    const dataFiltered = useMemo(() => {
        return variantsOrder?.filter(variant => variant?.variant?.name?.includes(search) || variant?.variant?.sku?.includes(search)).map(variant => {
            if (variant?.is_gift) {
                return {
                    ...variant,
                    variant: {
                        ...variant.variant,
                        cost_price: 0,
                        price: 0
                    }
                }
            }
            return variant
        });
    }, [search, variantsOrder]);
    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Hàng hóa kho' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (_item, record) => {
                let imgAssets = null;
                if (record?.variant?.sme_catalog_product_variant_assets?.[0]?.asset_url) {
                    imgAssets = record?.variant?.sme_catalog_product_variant_assets[0]
                }

                let url = "";
                if (record?.variant?.is_combo) {
                    url = `/products/edit-combo/${record?.variant?.sme_catalog_product?.id}`;
                } else if (record?.variant?.attributes?.length > 0) {
                    url = `/products/stocks/detail/${record?.variant?.id}`;
                } else {
                    url = `/products/edit/${record?.variant?.sme_catalog_product?.id}`;
                }

                return (
                    <div className="d-flex">
                        <Link to={url} target="_blank">
                            <div style={{
                                backgroundColor: '#F7F7FA',
                                width: 40, height: 40,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 40
                            }} className='mr-4' >
                                {
                                    !!imgAssets && <img src={imgAssets?.asset_url}
                                        style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                }
                            </div>
                        </Link>
                        <div className='d-flex flex-column'>
                            {!!record?.is_gift && <span style={{ display: 'inline-block', padding: '4px', border: '1px solid #FF0000', marginRight: 'auto', borderRadius: '4px', color: '#FF0000' }}>Quà tặng</span>}
                            <InfoSmeProduct
                                name={record?.variant?.sme_catalog_product?.name}
                                productOrder={true}
                                isSingle
                                url={() => window.open(url, "_blank")}
                            />
                            <InfoSmeProduct
                                sku={record?.variant?.sku}
                                isSingle
                            />
                            {!!record?.variant?.attributes?.length > 0 && <p className='font-weight-normal text-secondary-custom' >{record?.variant?.name?.replaceAll(' + ', ' - ')}</p>}
                        </div>
                        {
                            record?.variant?.combo_items?.length > 0 && (
                                <span
                                    className='text-primary cursor-pointer ml-2'
                                    style={{ minWidth: 'fit-content' }}
                                    onClick={() => setDataCombo(record?.variant?.combo_items)}
                                >
                                    Combo
                                </span>
                            )
                        }
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
                    <div>
                        {record?.variant?.unit || '--'}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Đơn giá' }),
            dataIndex: 'variantUnit',
            key: 'variantUnit',
            align: 'center',
            width: '28%',
            render: (_item, record) => {
                console.log(record)
                return (
                    <div className="d-flex flex-column align-items-end">
                        <Field
                            name={`variant_${record?.variant?.id}_price_step1`}
                            values={0}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập đơn giá' })}
                            label={""}
                            type="number"
                            disabled={location?.state?.isSale || values['related_order_id'] || record.is_gift}
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />
                        <span className="mt-4 mb-1">{formatMessage({ defaultMessage: 'Chiết khấu' })}:</span>
                        <Field
                            name={`variant_${record?.variant?.id}_discount_step1`}
                            component={InputSelectAddons}
                            addOnRight="đ"
                            disabled={location?.state?.isSale || values['related_order_id'] || record.is_gift}
                            unitOptions={OPTIONS_UNIT}
                            keyUnit={`variant_${record?.variant?.id}_unit_step1`}
                            label={''}
                            required={false}
                            customFeedbackLabel={' '}
                        />
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng' }),
            dataIndex: 'variantUnit',
            key: 'variantUnit',
            align: 'center',
            width: '12%',
            render: (_item, record) => {
                return <Field
                    name={`variant_${record?.variant?.id}_quantity_step1`}
                    component={InputVertical}
                    label={''}
                    required={false}
                    type="number"
                    style={{ textAlign: 'center', background: '#F7F7FA', border: 'none', }}
                    placeholder="--"
                    customFeedbackLabel={' '}
                    onChangedValue={() => setFieldValue('__quantity_changed__', true)}
                />
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thành tiền' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                const [variantDiscountUnit, variantPrice, variantQuantity, variantDiscount] = [
                    values[`variant_${record?.variant?.id}_unit_step1`],
                    values[`variant_${record?.variant?.id}_price_step1`],
                    values[`variant_${record?.variant?.id}_quantity_step1`],
                    values[`variant_${record?.variant?.id}_discount_step1`],
                ]
                let price;

                if (variantDiscountUnit?.value) {
                    price = variantQuantity * (variantPrice - Math.round((variantDiscount * variantPrice) / 100))
                } else {
                    price = variantQuantity * (variantPrice - variantDiscount)
                };

                return <span>{formatNumberToCurrency(Number(price))}đ</span>
            }
        },
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
                            setVariantsOrder(prev => prev?.filter(item => item?.variant?.id != record?.variant?.id));
                            const newValues = { ...values };

                            Object.keys(newValues).forEach(key => {
                                if (key.startsWith(`variant_${record?.variant?.id}`)) delete newValues[key]
                            });
                            setValues(newValues);
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
            {showAddVariants && <ModalAddVariants
                show={showAddVariants}
                onHide={() => setShowAddVariants(false)}
                variantsOrder={variantsOrder}
                onAddVariantsOrder={(variants) => {
                    setFieldValue('__changed__', true)
                    setVariantsOrder(prev => prev.concat(variants));
                    (variants || []).forEach(variant => {
                        setFieldValue(`variant_${variant?.variant?.id}_price_step1`, variant?.variant?.price || 0);
                        setFieldValue(`variant_${variant?.variant?.id}_discount_step1`, 0);
                        setFieldValue(`variant_${variant?.variant?.id}_unit_step1`, OPTIONS_UNIT[0]);
                    })
                }}
            />}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="input-icon" style={{ width: '50%' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={formatMessage({ defaultMessage: "Tên/SKU" })}
                        style={{ height: 40 }}
                        onBlur={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                setSearch(e.target.value);
                                setPage(1);
                            }
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md"></i></span>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center justify-content-center"
                    style={{ minWidth: 120, cursor: variantsOrder?.length >= LIMIT_ADD_VARIANT ? 'not-allowed' : 'pointer' }}
                    disabled={variantsOrder?.length >= LIMIT_ADD_VARIANT || !smeWarehouseSelected}
                    onClick={() => setShowAddVariants(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                    </svg>
                    <span>{formatMessage({ defaultMessage: 'Thêm nhanh hàng hóa' })}</span>
                </button>
            </div>
            <div style={{ position: 'relative' }}>
                {loadingProduct && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingProduct ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataFiltered?.slice(limit * (page - 1), limit + limit * (page - 1)) || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa' })}</span>
                    </div>}
                    tableLayout="auto"
                    scroll={{ y: 450 }}
                    sticky={{ offsetHeader: 0 }}
                />
            </div>
            {dataFiltered?.length > 0 && (
                <div style={{ width: '100%' }}>
                    <PaginationModal
                        page={page}
                        limit={limit}
                        // onSizePage={(limit) => setLimit(limit)}
                        onPanigate={(page) => setPage(page)}
                        totalPage={Math.ceil(dataFiltered?.length / limit)}
                        totalRecord={dataFiltered?.length || 0}
                        count={dataFiltered?.slice(limit * (page - 1), limit + limit * (page - 1))?.length}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                    />
                </div>
            )}
        </Fragment>
    )
};

export default memo(InfoProduct);