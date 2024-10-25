import React, { Fragment, memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardHeaderToolbar,
    FieldFeedbackLabel,
    Input,
    InputVertical
} from "../../../../_metronic/_partials/controls";
import { useProductsUIContext } from "../ProductsUIContext";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import { Field, useFormikContext, Form, Formik } from "formik";
import CreatableSelect from 'react-select/creatable';
import { useToasts } from "react-toast-notifications";
import _ from 'lodash';
import { useIntl } from "react-intl";
import { queryCheckExistGtin, queryCheckExistSku, queryCheckExistSkuMain } from "../ProductsUIHelpers";
import { createSKUProduct, createSKUVariant } from "../../../../utils";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useQuery } from "@apollo/client";
import { useParams } from 'react-router-dom'
import query_sme_cataglog_inventories_by_product_id from "../../../../graphql/query_sme_cataglog_inventories_by_product_id";
import ModalProductConnectVariant from "../products-list/dialog/ModalProductConnectVariant";
import { flatten } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import query_sme_product_status from "../../../../graphql/query_sme_product_status";

const TableInventory = ({ isCreating = true, isCombo = false, isSyncVietful, syncedVariants }) => {
    const { formatMessage } = useIntl();
    const { addToast, removeAllToasts } = useToasts();
    const { setFieldValue, values } = useFormikContext()
    const params = useParams()
    const { currentProduct, smeCatalogStores, refetchGetWarehouse, variantsUnit, _filterAttributeSelected, variants } = useProductsUIContext();
    const [showModalStockOnHand, setShowModalStockOnHand] = useState(false);
    const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null)
    const [expandedStores, setExpandedStores] = useState(new Set());

    const user = useSelector((state) => state.auth.user);
    const isFirstRender = useRef(true);

    useEffect(() => {
        isFirstRender.current = false;
      }, []);

    const {data: statusData} = useQuery(query_sme_product_status,
        {fetchPolicy: 'no-cache'})

    const checkExistSku = useCallback(async (code, id = null) => {
        if (code.trim().length == 0) {
            return false;
        }
        let keyErrorUnitSku = {};
        if (id !== 'origin_sku' && (values['origin_sku'] == code || await queryCheckExistSku(currentProduct?.id, code))) {
            setFieldValue(`variant-origin-sku_boolean`, { origin_sku: true })
            keyErrorUnitSku[id] = true
        } else {
            setFieldValue(`variant-origin-sku_boolean`, { origin_sku: false })
        }
        (variantsUnit?.filter(unit => unit?.id !== id) || []).forEach(unit => {
            if (!!values[`unit_variant-${unit.id}-sku`] && (values[`unit_variant-${unit.id}-sku`] === code)) {
                keyErrorUnitSku[unit.id] = true
                keyErrorUnitSku[id] = true
                // setFieldValue(`variant-origin-sku_boolean`, { origin_sku: true })
            } else {
                keyErrorUnitSku[unit.id] = false
            }
        })
        setFieldValue(`variant-unit-sku-boolean`, keyErrorUnitSku)
    }, [currentProduct?.id, values, setFieldValue, variantsUnit]);

    const toggleStoreExpansion = (storeValue) => {
        const newExpandedStores = new Set(expandedStores);
        if (newExpandedStores.has(storeValue)) {
          newExpandedStores.delete(storeValue);
        } else {
          newExpandedStores.add(storeValue);
        }
        setExpandedStores(newExpandedStores);
      };

    const checkExistGtin = useCallback(async (code, id) => {
        if (code.trim().length == 0) {
            return false;
        }
        let keyErrorUnitGtin = {};
        if (id !== 'gtin' && (values['gtin'] == code || await queryCheckExistGtin(currentProduct?.id, code))) {
            setFieldValue(`variant-gtin_boolean`, { gtin: true })
            keyErrorUnitGtin[id] = true
        } else {
            setFieldValue(`variant-gtin_boolean`, { gtin: false })
        }
        (variantsUnit?.filter(unit => unit?.id !== id) || []).forEach(unit => {
            if (!!values[`variant-${unit.id}-gtin`] && (values[`variant-${unit.id}-gtin`] === code)) {
                keyErrorUnitGtin[unit.id] = true
                keyErrorUnitGtin[id] = true
                setFieldValue(`variant-gtin_boolean`, { gtin: true })
            } else {
                keyErrorUnitGtin[unit.id] = false
            }
        })
        setFieldValue(`variant-gtin_boolean`, keyErrorUnitGtin)
    }, [currentProduct?.id, variantsUnit, setFieldValue, values])

    const amount = (id, value) => {
        return (!!value) ? (value * (values[`ratio-unit-${id}`])) : ''
    }

    const recalculateThePrice = (field, value) => {
        (variantsUnit || []).forEach(unit => {
            if (values[`name-unit-${unit?.id}`] && values[`ratio-unit-${unit?.id}`]) {
                setFieldValue(`variant-${unit?.id}-${field}`, amount(unit?.id, value) || undefined)
            }
        })
    }

    useMemo(() => {
        (isCreating ? variantsUnit : variantsUnit?.filter(unit => !unit?.sme_variant_id) || []).forEach(unit => {
            if (values[`name-unit-${unit?.id}`] && values[`ratio-unit-${unit?.id}`]) {
                setFieldValue(`variant-${unit?.id}-costPrice`, values['costPrice'] * values[`ratio-unit-${unit?.id}`] || undefined)
                setFieldValue(`variant-${unit?.id}-price`, values['price'] * values[`ratio-unit-${unit?.id}`] || undefined)
                setFieldValue(`variant-${unit?.id}-priceMinimum`, values['priceMinimum'] * values[`ratio-unit-${unit?.id}`] || undefined)
            }
        })
    }, [
        variantsUnit?.length,
        ...variantsUnit?.map(unit => values[`name-unit-${unit?.id}`]),
        ...variantsUnit?.map(unit => values[`ratio-unit-${unit?.id}`])])

    useMemo(() => {
        (isCreating ? variantsUnit : variantsUnit?.filter(unit => !unit?.sme_variant_id) || []).forEach(unit => {
            if (values[`name-unit-${unit?.id}`] && values[`ratio-unit-${unit?.id}`]) {
                const totalStockOnHand = smeCatalogStores?.map((store) => {
                    const result = Math.floor(((values[`${store?.value}-stockOnHand`] || 0) / values[`ratio-unit-${unit?.id}`]))
                    return { stockOnHand: result, storeId: store?.value }
                });
                setFieldValue(`variant-unit-${unit?.id}-stockOnHand`, totalStockOnHand || undefined)
            }
        })
    }, [
        variantsUnit?.length,
        ...smeCatalogStores?.map(store => values[`${store?.value}-stockOnHand`]),
        ...variantsUnit?.map(unit => values[`name-unit-${unit?.id}`]),
        ...variantsUnit?.map(unit => values[`ratio-unit-${unit?.id}`])])

    const columns = flatten([
        {
            title: formatMessage({ defaultMessage: 'Đơn vị chuyển đổi' }),
            key: 'code',
            dataIndex: 'code',
            fixed: 'left',
            align: 'left',
            width: 150,
            render: (item, record) => {
                return <div className="d-flex flex-column">
                    <div className="d-flex align-items-center" style={{ minHeight: 38 }}>
                        <span>{values[`main-unit`]}</span>
                    </div>
                    {variantsUnit?.map(unit => {
                        return <div className="d-flex align-items-center mt-4" style={{ minHeight: 38 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-return-right mr-2" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5" />
                            </svg>
                            {values[`name-unit-${unit?.id}`]}
                        </div>
                    })}
                </div>
            }
        },
        {
            title: <div className="d-flex flex-column">
                <div>
                    <span> <p className="text-dark-75 mb-0">Mã SKU hàng hóa<span style={{ color: 'red' }} >*</span></p></span>
                </div>
                {(!values['origin_sku'] || variantsUnit.some(_variant => !values[`variant-${_variant.id}-sku`])) &&
                    <a style={{ color: 'red' }} href="#"
                        onClick={e => {
                            e.preventDefault()
                            if (!!values.name) {
                                setFieldValue('origin_sku', values['origin_sku'] || createSKUProduct(user?.sme_id, values.name || '', 0));
                                (variantsUnit?.filter(variant => !values[`unit_variant-${variant.id}-sku`]) || []).forEach((_variant, _index) => {
                                    setFieldValue(`unit_variant-${_variant.id}-sku`, values[`unit_variant-${_variant.id}-sku`] || createSKUProduct(user?.sme_id, values.name || '', _index + 1))
                                    setFieldValue(`variant-sku_boolean`, {})
                                })
                            } else {
                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                            }

                        }}
                    >{formatMessage({ defaultMessage: 'Tự động tạo' })}</a>}
            </div>,
            key: 'sku',
            dataIndex: 'sku',
            align: 'center',
            width: 250,
            render: (item, record) => {
                const isDisabled = syncedVariants?.map(item => item?.id)?.some(item => {
                    return variantsUnit?.map(unit => unit?.sme_variant_id)?.some(unit => unit == item)
                })
                console.log(isDisabled)
                return <div className="d-flex flex-column">
                    <Field
                        name={`origin_sku`}
                        disabled={isDisabled}
                        component={InputVertical}
                        placeholder=""
                        label={false}
                        required
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={50}
                        absolute={true}
                        onBlurChange={async (value) => {
                            await checkExistSku(value, 'origin_sku')
                        }}
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`unit_variant-${unit?.id}-sku`}
                                    disabled={isDisabled}
                                    component={InputVertical}
                                    placeholder=""
                                    label={false}
                                    required
                                    customFeedbackLabel={' '}
                                    countChar
                                    maxChar={50}
                                    absolute={true}
                                    onBlurChange={async (value) => {
                                        await checkExistSku(value, unit?.id)
                                    }}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        {
            title: <div className="d-flex flex-column">
                <span>{formatMessage({ defaultMessage: 'GTIN' })}</span>
            </div>,
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 250,
            render: (item, record) => {
                const isDisabled = syncedVariants?.map(item => item?.id)?.some(item => {
                    return variantsUnit?.map(unit => unit?.sme_variant_id)?.some(unit => unit == item)
                })
                return <div className="d-flex flex-column">
                    <Field
                        name="gtin"
                        component={InputVertical}
                        disabled={!!values['is_has_sell_info'] || isDisabled}
                        placeholder={formatMessage({ defaultMessage: 'Nhập GTIN' })}
                        required={false}
                        countChar
                        maxChar={120}
                        onBlurChange={async (value) => {
                            await checkExistGtin(value, 'gtin')
                        }}
                        tooltip={formatMessage({ defaultMessage: 'Mã vạch sản phẩm từ lúc xuất xưởng. Nếu để trống, mã SKU sẽ được lấy làm mã vạch sản phẩm.' })}
                        customFeedbackLabel={' '}
                        absolute
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-gtin`}
                                    component={InputVertical}
                                    disabled={isDisabled}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập GTIN' })}
                                    label={false}
                                    required
                                    customFeedbackLabel={' '}
                                    countChar
                                    maxChar={120}
                                    absolute={true}
                                    tooltip={formatMessage({ defaultMessage: 'Mã vạch sản phẩm từ lúc xuất xưởng. Nếu để trống, mã SKU sẽ được lấy làm mã vạch sản phẩm.' })}
                                    onBlurChange={async (value) => {
                                        await checkExistGtin(value, unit?.id)
                                    }}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        !isCreating && {
            title: <div className="d-flex flex-column">
                <span>{formatMessage({ defaultMessage: 'Tồn kho' })}</span>
            </div>,
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 150,
            render: (item, record) => {
                const totalStockOnHandVariant = smeCatalogStores?.reduce(
                    (result, store) => {
                        result += values[`${store?.value}-stockOnHand`] || 0;
                        return result;
                    }, 0
                );
                const totalStockVariantUnit = (id) => {

                    if (values[`name-unit-${id}`] && values[`ratio-unit-${id}`]) {
                        const totalStockOnHand = smeCatalogStores?.reduce(
                            (result, store) => {
                                result += Math.floor(((values[`${store?.value}-stockOnHand`] || 0) / values[`ratio-unit-${id}`]))
                                return result;
                            }, 0
                        );

                        return totalStockOnHand
                    }
                    return null
                }
                return <div className="d-flex flex-column ">
                    <div>
                        <Field
                            name="stockOnHand"
                            component={({ }) => {

                                return (
                                    <div className="d-flex flex-column">
                                        <div>
                                            <Field
                                                name={`variant-${values['main-unit']}-${values[`origin_stock`]?.value}-stockOnHand`}
                                                component={({ }) => {
                                                    return (
                                                        <p className="cursor-pointer" onClick={() => { setShowModalStockOnHand(true) }}>
                                                            {totalStockOnHandVariant.toLocaleString("en-US")}
                                                            <span><i className={`ml-2 ` + (!isCreating ? "fas fa-warehouse" : "far fa-edit")} style={{ color: '#000000', fontSize: 14 }} /></span>
                                                        </p>
                                                    )
                                                }}
                                                placeholder=""
                                                label={false}
                                                type='number'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                            />
                                        </div>
                                    </div>
                                )
                            }}
                            type='number'
                            placeholder=""
                            required={false}
                            label={""}
                            tooltip={formatMessage({ defaultMessage: 'Tồn thực tế đã kiểm kho trước đó' })}
                            customFeedbackLabel={' '}
                            absolute
                        />
                    </div>
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-8">
                                <Field
                                    component={({ }) => {
                                        return (
                                            <div className="d-flex flex-column">
                                                <span style={{ width: '100%' }}>

                                                    <p className="cursor-pointer" >
                                                        {totalStockVariantUnit(unit?.id)}
                                                        {!isCreating && unit?.sme_variant_id && <span onClick={() => { 
                                                            console.log(unit)
                                                            setShowModalStockOnHand(unit?.id) }}><i className={`ml-2 ` + (!isCreating ? "fas fa-warehouse" : "far fa-edit")} style={{ color: '#000000', fontSize: 14 }} /></span>}
                                                    </p>
                                                </span>
                                            </div>
                                        )
                                    }}
                                    values={totalStockVariantUnit(unit?.id) || 0}
                                    disable
                                    type='number'
                                    placeholder=""
                                    required={false}
                                    label={""}
                                    tooltip={formatMessage({ defaultMessage: 'Tồn thực tế đã kiểm kho trước đó' })}
                                    customFeedbackLabel={' '}
                                    absolute
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        (!values['switch-unit'] ? {
            title: formatMessage({ defaultMessage: 'Giá vốn' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 200,
            render: (item, record) => {
                return <div className="d-flex flex-column">
                    <Field
                        name="costPrice"
                        component={InputVertical}
                        type='number'
                        placeholder=""
                        label={""}
                        required={false}
                        onIsChangeState={(value) => {
                            if (!isFirstRender.current) { // Only run after initial render
                                recalculateThePrice('costPrice', value);
                              }
                        }}
                        customFeedbackLabel={' '}
                        addOnRight="đ"
                        absolute
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {

                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-costPrice`}
                                    component={InputVertical}
                                    placeholder=""
                                    label={false}
                                    type='number'
                                    addOnRight="đ"
                                    customFeedbackLabel={' '}
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        } : null),
        {
            title: formatMessage({ defaultMessage: 'Giá bán' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 200,
            render: (item, record) => {

                return <div className="d-flex flex-column">
                    <Field
                        name="price"
                        component={InputVertical}
                        type='number'
                        placeholder=""
                        onIsChangeState={(value) => {
                            if (!isFirstRender.current) { // Only run after initial render
                                recalculateThePrice('price', value);
                            }
                        }}
                        label={""}
                        tooltip={formatMessage({ defaultMessage: 'Giá bán dùng để set giá của sản phẩm được hiển thị trên sàn.' })}
                        required={false}
                        customFeedbackLabel={' '}
                        addOnRight="đ"
                        absolute
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-price`}
                                    component={InputVertical}
                                    placeholder=""
                                    required
                                    type='number'
                                    customFeedbackLabel={' '}
                                    addOnRight="đ"
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Giá bán tối thiểu' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 200,
            render: (item, record) => {

                return <div className="d-flex flex-column">
                    <Field
                        name="priceMinimum"
                        component={InputVertical}
                        type='number'
                        placeholder=""
                        label={""}
                        onIsChangeState={(value) => {
                            if (!isFirstRender.current) { // Only run after initial render
                                recalculateThePrice('priceMinimum', value);
                            }
                        }}
                        tooltip={formatMessage({ defaultMessage: 'Giá bán tối thiểu dùng làm căn cứ để set giá ở chương trình khuyến mại. Giá ở chương trình khuyến mại không được nhỏ hơn giá bán tối thiểu.' })}
                        required={false}
                        customFeedbackLabel={' '}
                        addOnRight="đ"
                        absolute
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-priceMinimum`}
                                    component={InputVertical}
                                    placeholder=""
                                    required
                                    type='number'
                                    customFeedbackLabel={' '}
                                    addOnRight="đ"
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        !values[`switch-unit`] ?
        {
            title: formatMessage({ defaultMessage: 'VAT' }),
            key: 'code',
            dataIndex: 'code',
            align: 'left',
            width: 200,
            render: (item, record) => {

                return <div className="d-flex flex-column">
                    <Field
                        name="vatRate"
                        component={InputVertical}
                        type='number'
                        placeholder={formatMessage({ defaultMessage: 'Nhập VAT' })}
                        required={false}
                        tooltip={formatMessage({ defaultMessage: 'Sẽ được sử dụng tính VAT khi xuất hóa đơn' })}
                        customFeedbackLabel={' '}
                        absolute
                    />
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-vatRate`}
                                    component={InputVertical}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập VAT' })}
                                    required
                                    type='number'
                                    customFeedbackLabel={' '}
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            },
        } : null,
        {
            title: formatMessage({ defaultMessage: 'Liên kết' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 150,
            render: (item, record) => {

                return <div className="d-flex flex-column">
                    <span
                        style={{ minHeight: 38 }}
                        className={`${values[`variant-${record?.code}-linked`]?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} d-flex justify-content-center align-items-center`}
                        onClick={() => {
                            if (values[`variant-${record?.code}-linked`]?.length === 0) return;
                            // setCurrentProductVariantLinked(values[`variant-${record?.code}-id`])

                        }}
                    >
                        {values[`variant-${record?.code}-linked`]?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                    </span>
                    <div className="d-flex flex-column">
                        {variantsUnit?.map(unit => {
                            return <span
                                className={`${values[`variant-${unit?.id}-linked`]?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} mt-4 d-flex justify-content-center align-items-center`}
                                style={{ minHeight: 38 }}
                                onClick={() => {
                                    // if (values[`variant-${record?.code}-${unit?.id}-linked`]?.length === 0) return;
                                    // setCurrentProductVariantLinked(values[`variant-${record?.code}-${unit?.id}-id`])

                                }}
                            >
                                {values[`variant-${unit?.id}-linked`]?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                            </span>
                        })}
                    </div>
                </div >
            }
        },
    ])
    function sortArray(a, b) {
        if (a.variant.product_status_id === null && b.variant.product_status_id !== null) {
            return -1;
        } else if (a.variant.product_status_id !== null && b.variant.product_status_id === null) {
            return 1;
        } else {
            return 0;
        }
    }
    return (
        <CardBody>
            <Table
                className="upbase-table mt-4"
                columns={columns?.filter(Boolean)}
                data={[{}]}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                </div>}
                tableLayout="auto"
                scroll={{ x: 'max-content' }}
            />

            <Modal
                show={showModalStockOnHand && !isCreating}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName={isCreating ? "modal-show-stock-product" : "modal-show-detail-stock-product"}
                centered
                onHide={() => {
                    setShowModalStockOnHand(false)
                }}
                backdrop={true}
            >
                {/* {isCreating &&
                    <Formik
                        initialValues={smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = values[`${store?.value}-stockOnHand`] || 0;
                                return result;
                            }, {}
                        )}
                        validationSchema={Yup.object().shape(smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = Yup.number()
                                    .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                                    .max(999999, 'Số lượng sản phẩm tối đa 999.999');

                                return result;
                            }, {}
                        ))}
                        enableReinitialize
                    >
                        {({
                            handleSubmit,
                            values: valuesStockOnHand,
                            validateForm
                        }) => {

                            return (
                                <Form>
                                    <Modal.Header closeButton={true}>
                                        <Modal.Title>
                                            {formatMessage({ defaultMessage: 'Thiết lập tồn kho đầu' })}
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                                        <i
                                            className="fas fa-times"
                                            onClick={() => {
                                                setShowModalStockOnHand(false)
                                            }}
                                            style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                                        />
                                        <div style={{ padding: '0rem 1rem' }}>
                                            <div className="d-flex align-items-center mt-4 mb-2">
                                                <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {values[`origin_sku`] || '--'}</span>
                                                <span style={{ width: '50%' }}>GTIN: {values[`gtin`] || '--'}</span>
                                            </div>
                                            <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                                <thead>
                                                    <tr className="text-left text-uppercase" >
                                                        <th style={{ border: '1px solid', fontSize: '14px' }} width='50%'>
                                                            <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho' })}</span>
                                                        </th>
                                                        <th style={{ border: '1px solid', fontSize: '14px' }} width='50%'>
                                                            <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn đầu' })}</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {smeCatalogStores?.map(
                                                        (_store, index) => {

                                                            return (
                                                                <tr key={`sme-catalog-store-${index}`}>
                                                                    <td style={{ border: '1px solid #c8c7c9' }}>
                                                                        <span className="text-dark-75" >
                                                                            {_store?.label}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ border: '1px solid #c8c7c9', padding: '1.25rem 0.75rem' }}>
                                                                        <Field
                                                                            name={`${_store?.value}-stockOnHand`}
                                                                            component={InputVertical}
                                                                            placeholder=""
                                                                            label={false}
                                                                            type='number'
                                                                            customFeedbackLabel={' '}
                                                                            absolute={true}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )
                                                        }
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Modal.Body>
                                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                        <div className="form-group">
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    let error = await validateForm(valuesStockOnHand);
                                                    const isErrorForm = Object.keys(error)?.length > 0

                                                    if (isErrorForm) {
                                                        handleSubmit();
                                                    } else {
                                                        smeCatalogStores.forEach(
                                                            _store => {
                                                                setFieldValue(
                                                                    `${_store?.value}-stockOnHand`,
                                                                    valuesStockOnHand[`${_store?.value}-stockOnHand`] || 0
                                                                );
                                                            }
                                                        )
                                                        setShowModalStockOnHand(false);
                                                    }
                                                }}
                                                className="btn btn-primary btn-elevate mr-3"
                                                style={{ width: 100 }}
                                            >
                                                {formatMessage({ defaultMessage: 'Cập nhật' })}
                                            </button>
                                        </div>
                                    </Modal.Footer>
                                </Form>
                            )
                        }}
                    </Formik>
                } */}

                {!isCreating && (
                    <>
                        <Modal.Header closeButton={true}>
                            <Modal.Title>
                                {formatMessage({ defaultMessage: 'Tồn kho' })}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                            <i
                                className="fas fa-times"
                                onClick={() => {
                                    setShowModalStockOnHand(false)
                                }}
                                style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                            />
                            <div style={{ padding: '0rem 1rem' }}>
                                <div className="d-flex align-items-center mt-4 mb-2">
                                    <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {typeof showModalStockOnHand == 'number' ? values[`unit_variant-${showModalStockOnHand}-sku`] : values['origin_sku'] || '--'}</span>
                                    <span style={{ width: '50%' }}>GTIN: {typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-gtin`] : values['gtin'] || '--'}</span>
                                </div>
                                <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                    <thead>
                                        <tr className="text-uppercase" >
                                            <th style={{ border: '1px solid' }} width='16%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho vật lý' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Trạng thái hàng hóa' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn thực tế' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm giữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm ứng' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Dự trữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Đang vận chuyển' })}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {smeCatalogStores?.map(
                                            (_store, index) => {
                                                let statusProductArray = values.inventoryStatusVariant.filter(item => item.sme_store_id == _store.value && (item?.variant?.parent_variant_id == values['origin_id']|| item?.variant?.id == values['origin_id']))
                                                statusProductArray.sort(sortArray)
                                                const isStoreExpanded = expandedStores.has(_store.value);
                                                
                                                const stockActual = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockActual`] || 0 : values[`${_store?.value}-stockActual`] || 0;
                                                const stockAllocated = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockAllocated`] || 0 : values[`${_store?.value}-stockAllocated`] || 0;
                                                const stockReserve = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockReserve`] || 0 : values[`${_store?.value}-stockReserve`] || 0;
                                                const stockPreallocate = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockPreallocate`] || 0 : values[`${_store?.value}-stockPreallocate`] || 0;
                                                const stockAvailable = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockAvailable`] || 0 : values[`${_store?.value}-stockAvailable`] || 0;
                                                const stockShipping = typeof showModalStockOnHand == 'number' ? values[`variant-${showModalStockOnHand}-${_store?.value}-stockShipping`] || 0 : values[`${_store?.value}-stockShipping`] || 0;

                                                return (
                                                    <>
                                                    <tr key={`sme-catalog-store-${index}`}>
                                                        <td style={{ border: '1px solid #c8c7c9', 
                                                        display: 'flex',justifyContent: 'space-between', alignItems:'center' }}>
                                                            <span className="text-dark-75" >
                                                                {_store?.label}
                                                            </span>
                                                            {!!statusData?.sme_product_status?.length && (!isStoreExpanded ? <span style={{cursor: 'pointer'}} onClick={() => toggleStoreExpansion(_store.value)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                                        </span> 
                                                        : <span onClick={() => toggleStoreExpansion(_store.value)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg></span>)}
                                                        </td>
                                                        <td
                                                        style={{
                                                          border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                      >
                                                        {statusData?.sme_product_status?.length ? 'Tất cả' : "Mới"}
                                                      </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockActual}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockAllocated}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockPreallocate}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockReserve}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockAvailable}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockShipping}
                                                        </td>
                                                    </tr>
                                                    {!!statusData?.sme_product_status?.length && isStoreExpanded &&statusProductArray?.map(
                                                        (status) => {
                                                          return (
                                                            <tr>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                              >
                                                                <span className="text-dark-75">
                                                                  {status.sku}
                                                                </span>
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.variant.product_status_id ? status.variant
                                                                    .product_status_name : 'Mới'
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_actual
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_allocated
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_preallocate
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_reserve
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_available
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_shipping
                                                                }
                                                              </td>
                                                            </tr>
                                                          );
                                                        }
                                                      )} </>
                                                )
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                            <div className="form-group">
                                <button
                                    type="button"
                                    onClick={() => setShowModalStockOnHand(false)}
                                    className="btn btn-primary btn-elevate mr-3"
                                    style={{ width: 100 }}
                                >
                                    {formatMessage({ defaultMessage: 'Đóng' })}
                                </button>
                            </div>
                        </Modal.Footer>
                    </>
                )}
            </Modal>
        </CardBody>
    )
};

export default memo(TableInventory);