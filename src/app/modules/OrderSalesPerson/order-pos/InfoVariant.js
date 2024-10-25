import { Field, useFormikContext } from "formik";
import Table from "rc-table";
import React, { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Link } from "react-router-dom";
import Select from 'react-select';
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody, Checkbox, InputVertical, InputVerticalWithIncrease } from "../../../../_metronic/_partials/controls";
import client from "../../../../apollo";
import InfoSmeProduct from '../../../../components/InfoProduct';
import { ReSelectSearchVariant } from "../../../../components/ReSelectSearchVariant";
import query_sme_catalog_inventory_items from "../../../../graphql/query_sme_catalog_inventory_items";
import useScanDetection from "../../../../hooks/useScanDetection";
import { formatNumberToCurrency } from "../../../../utils";
import ModalCombo from "../../Products/products-list/dialog/ModalCombo";
import { useOrderPosContext } from "../OrderPosContext";
import { OPTIONS_SCAN } from "../OrderSalesPersonHelper";
import ModalHotKeys from "./modals/ModalHotKeys";
import HoverImage from "../../../../components/HoverImage";

const InfoVariant = () => {
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const { values, setFieldValue, setValues } = useFormikContext();
    const { warehouseSelected, storeSelected, currentScanBy, setCurrentScanBy, setOrderPos, orderPos, currentOrderPos } = useOrderPosContext();
    const [showHotKeys, setShowHotKeys] = useState(false);
    const [loadingScan, setLoadingScan] = useState(false);
    const [dataCombo, setDataCombo] = useState(null);
    const selectScanRef = useRef(null);

    useEffect(() => {
        const inputSearchElement = document.getElementById('input-search');
        inputSearchElement.focus();
    }, [currentOrderPos]);

    const isCompleteOrder = useMemo(() => {
        const currentPos = orderPos?.find(item => item?.code == currentOrderPos);
        return !!currentPos?.isComplete
    }, [orderPos, currentOrderPos]);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Hàng hóa kho' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '25%',
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
                                    !!imgAssets && <HoverImage
                                        styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', textAlign: 'right' }}
                                        size={{ width: 320, height: 320 }}
                                        defaultSize={{ width: '100%' }}
                                        placement={'right'}
                                        url={imgAssets?.asset_url}
                                    />
                                }
                            </div>
                        </Link>
                        <div className='d-flex flex-column'>
                            {record?.is_gift && <span style={{ display: 'inline-block', padding: '4px', border: '1px solid #FF0000', marginRight: 'auto', borderRadius: '4px', color: '#FF0000' }}>Quà tặng</span>}
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
            title: formatMessage({ defaultMessage: 'Quà tặng' }),
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '10%',
            render: (item, record) => {
                return <div className="d-flex align-items-center justify-content-center">
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            "aria-label": "checkbox",
                        }}
                        disabled={isCompleteOrder}
                        isSelected={values[`variant_${record?.variant?.id}_gift_${currentOrderPos}`]}
                        onChange={(e) => {
                            setFieldValue([`variant_${record?.variant?.id}_gift_${currentOrderPos}`], values[`variant_${record?.variant?.id}_gift_${currentOrderPos}`] == 1 ? 0 : 1);
                        }}
                    />
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Đơn giá' }),
            dataIndex: 'price',
            key: 'price',
            align: 'center',
            width: '20%',
            render: (item, record) => {
                return (
                    <div className="d-flex flex-column align-items-end">
                        {!!values[`variant_${record?.variant?.id}_gift_${currentOrderPos}`] ? <Field
                            name={`variant_gift_price`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập đơn giá' })}
                            values={0}
                            label={""}
                            type="number"
                            disabled={true}
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        /> : <Field
                            id={`variant-price-${record?.variant?.id}`}
                            name={`variant_${record?.variant?.id}_price_${currentOrderPos}`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập đơn giá' })}
                            label={""}
                            type="number"
                            disabled={!!values[`variant_${record?.variant?.id}_gift_${currentOrderPos}`] || isCompleteOrder}
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng' }),
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                return <Field
                    id={`variant-quantity-${record?.variant?.id}`}
                    name={`variant_${record?.variant?.id}_quantity_${currentOrderPos}`}
                    component={InputVerticalWithIncrease}
                    label={''}
                    required={false}
                    disabled={isCompleteOrder}
                    customFeedbackLabel={' '}
                    cols={['', 'col-12']}
                    countChar
                    maxChar={'255'}
                    rows={4}
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
                const [variantPrice, variantQuantity] = [
                    values[`variant_${record?.variant?.id}_price_${currentOrderPos}`],
                    values[`variant_${record?.variant?.id}_quantity_${currentOrderPos}`],
                ];
                const price = !!values[`variant_${record?.variant?.id}_gift_${currentOrderPos}`] ? 0 : variantQuantity * variantPrice;

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
                        style={{ color: 'red', cursor: isCompleteOrder ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                            if (isCompleteOrder) return;
                            setFieldValue('__changed__', true);
                            setOrderPos(prev => prev.map(order => {
                                if (order?.code == currentOrderPos) {
                                    return {
                                        ...order,
                                        variants: order?.variants?.filter(item => item?.variant?.id != record?.variant?.id)
                                    }
                                }

                                return order
                            }));
                            const newValues = { ...values };

                            Object.keys(newValues).forEach(key => {
                                if (key.startsWith(`variant_${record?.variant?.id}`) && key.endsWith(currentOrderPos)) delete newValues[key]
                            });
                            setValues(newValues);
                        }}
                    />
                )
            }
        },
    ];

    const onScanVariant = async (value) => {        
        setLoadingScan(true);
        const { data: dataInventoryItem } = await client.query({
            query: query_sme_catalog_inventory_items,
            fetchPolicy: 'no-cache',
            variables: {
                limit: 10,
                offset: 0,
                where: {
                    ...(!!value ? {
                        _or: [
                            { variant: { sme_catalog_product: { name: { _ilike: `%${value.trim()}%` } } } },
                            { variant: { [currentScanBy?.value || 'gtin']: { _eq: value } } },
                        ],
                    } : ""),
                    sme_store_id: {
                        _eq: warehouseSelected?.value
                    },
                    variant: { product_status_id: { _is_null: true } }
                },
                order_by: {
                    updated_at: 'desc',
                    variant_id: 'desc',
                    stock_actual: 'desc_nulls_last'
                }
            },
        });

        setLoadingScan(false);
        if (dataInventoryItem?.sme_catalog_inventory_items?.length > 0) {
            const inventory = dataInventoryItem?.sme_catalog_inventory_items?.[0];

            const isExistVariant = orderPos
                ?.find(order => order?.code == currentOrderPos)
                ?.variants?.some(variant => variant?.variant?.id == inventory?.variant?.id);

            if (isExistVariant) {
                setFieldValue(`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`,
                    (values[`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`] || 0) + 1
                );
            } else {
                setFieldValue(`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`, 1);
                setFieldValue(`variant_${inventory?.variant?.id}_price_${currentOrderPos}`, inventory?.variant?.price || 0);
                setOrderPos(prev => prev.map(order => {
                    if (order?.code == currentOrderPos) {
                        return {
                            ...order,
                            variants: order?.variants?.concat(inventory)
                        }
                    }

                    return order
                }));
            }
        } else {
            setLoadingScan(false);
            addToast(formatMessage({ defaultMessage: 'Mã không tồn tại trong kho' }), { appearance: 'error' })
        }
        const inputSearchElement = document.getElementById('input-search');
        inputSearchElement.blur();
        inputSearchElement.focus();
    }

    // Scan variant by device
    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement?.id != 'input-search' && loadingScan) return;
            onScanVariant(value);
        }
    });

    return (
        <Fragment>
            <ModalHotKeys
                show={showHotKeys}
                onHide={() => setShowHotKeys(false)}
            />
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}
            <Card style={{ borderTopLeftRadius: 0 }}>
                <CardBody className="px-4 py-4">
                    <div className="d-flex align-items-center">
                        <svg onClick={() => setShowHotKeys(true)} className="bi bi-lightbulb cursor-pointer mr-4" style={{ color: '#2584fe' }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1" />
                        </svg>
                        <div className="row w-100">
                            <div className="col-3 d-flex align-items-center">
                                <span className="text-secondary-custom">
                                    {formatMessage({ defaultMessage: 'Cửa hàng' })}:
                                </span>
                                <div className="ml-2 d-flex align-items-center">
                                    <img src={storeSelected?.logo} width={14} height={14} />
                                    <span className="ml-2">{storeSelected?.label}</span>
                                </div>
                            </div>
                            <div className="col-3 d-flex align-items-center">
                                <span className="text-secondary-custom">
                                    {formatMessage({ defaultMessage: 'Kho' })}:
                                </span>
                                <span className="ml-2">{warehouseSelected?.label}</span>
                            </div>
                            <div className="col-6">
                                <div className="row d-flex align-items-center">
                                    <div className="col-4 pr-0 d-flex align-items-center">
                                        <Select
                                            id="scan-by"
                                            ref={selectScanRef}
                                            className='w-100 custom-select-warehouse'
                                            theme={(theme) => ({
                                                ...theme,
                                                borderRadius: 0,
                                                colors: {
                                                    ...theme.colors,
                                                    primary: '#ff5629'
                                                }
                                            })}
                                            isDisabled={isCompleteOrder}
                                            isLoading={false}
                                            value={currentScanBy}
                                            options={OPTIONS_SCAN}
                                            onChange={value => {
                                                setCurrentScanBy(value);
                                            }}
                                            formatOptionLabel={(option, labelMeta) => {
                                                return <div>{option.label}</div>
                                            }}
                                        />
                                    </div>
                                    <div className="col-8 pl-0" style={{ height: 'fit-content', position: 'relative', width: '100%' }} >
                                        <ReSelectSearchVariant
                                            selected={null}     
                                            disabled={isCompleteOrder}                                       
                                            onSelect={(value) => {
                                                setLoadingScan(true);
                                                setTimeout(() => {
                                                    const inventory = value?.raw;
                                                    const isExistVariant = orderPos
                                                        ?.find(order => order?.code == currentOrderPos)
                                                        ?.variants?.some(variant => variant?.variant?.id == inventory?.variant?.id);
    
                                                    if (isExistVariant) {
                                                        setFieldValue(`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`,
                                                            (values[`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`] || 0) + 1
                                                        );
                                                    } else {
                                                        setFieldValue(`variant_${inventory?.variant?.id}_quantity_${currentOrderPos}`, 1);
                                                        setFieldValue(`variant_${inventory?.variant?.id}_price_${currentOrderPos}`, inventory?.variant?.price || 0);
                                                        setOrderPos(prev => prev.map(order => {
                                                            if (order?.code == currentOrderPos) {
                                                                return {
                                                                    ...order,
                                                                    variants: order?.variants?.concat(inventory)
                                                                }
                                                            }
    
                                                            return order
                                                        }));
                                                    }
                                                    setLoadingScan(false);
                                                }, 150)
                                            }}
                                            currentScanBy={currentScanBy}
                                            warehouseSelected={warehouseSelected}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4" style={{ position: 'relative' }}>
                        {loadingScan && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                <span className="spinner spinner-primary" />
                            </div>
                        )}
                        <Table
                            className="upbase-table"
                            style={loadingScan ? { opacity: 0.4 } : {}}
                            columns={columns}
                            data={orderPos?.find(order => order?.code == currentOrderPos)?.variants || []}
                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa' })}</span>
                            </div>}
                            tableLayout="auto"
                            scroll={{ y: 650 }}
                            sticky={{ offsetHeader: 0 }}
                        />
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(InfoVariant);