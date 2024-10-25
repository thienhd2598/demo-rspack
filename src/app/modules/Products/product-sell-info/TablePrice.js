/*
 * Created by duydatpham@gmail.com on 08/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import { Field, useFormikContext, Form, Formik } from "formik";
import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import { useProductsUIContext } from "../ProductsUIContext";
import query_sme_catalog_product_variant_aggregate from "../../../../graphql/query_sme_catalog_product_variant_aggregate";
import { createApolloClientSSR } from "../../../../apollo";
import { queryCheckExistGtin, queryCheckExistSku } from "../ProductsUIHelpers";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { createSKUVariant, formatNumberToCurrency } from "../../../../utils";
import { useSelector } from "react-redux";
import { useShowToastAlert } from '../../../../hooks/useShowToastAlert';
import ToastAlert from '../../../../components/ToastAlert';
import { useToasts } from "react-toast-notifications";
import { Modal } from 'react-bootstrap';
import * as Yup from "yup";
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import ModalProductConnectVariant from "../products-list/dialog/ModalProductConnectVariant";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { debounce, flatten } from 'lodash';
import query_sme_product_status from "../../../../graphql/query_sme_product_status";
import { useQuery } from "@apollo/client";

let client = createApolloClientSSR()

export default memo(({ isCreating, refetch, isSyncVietful, syncedVariants }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const {
        attributesSelected,
        variants, variantsUnit,
        currentProduct, smeCatalogStores,
        isUnit
    } = useProductsUIContext();
    const { setFieldValue, values, errors, setFieldTouched } = useFormikContext()
    const user = useSelector((state) => state.auth.user);
    const { isActive, message, openToastAlert } = useShowToastAlert();
    const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null);
    const [codeConfigStock, setCodeConfigStock] = useState('');
    const [expandedStores, setExpandedStores] = useState(new Set());
    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);
    const {data: statusData} = useQuery(query_sme_product_status,
    {fetchPolicy: 'no-cache'}
    )
    const checkExistSku = useCallback(async (sku, code) => {
        if (sku.trim().length == 0) {
            return false;
        }
        if (await queryCheckExistSku(currentProduct?.id, sku)) {
            setFieldValue(`variant-sku_boolean`, { [code]: true })
        } else {
            setFieldValue(`variant-sku_boolean`, { [code]: false })
        }
    }, [currentProduct?.id])

    const checkExistGtin = useCallback(async (gtin, code) => {
        if (gtin.trim().length == 0) {
            return false;
        }
        if (await queryCheckExistGtin(currentProduct?.id, code)) {
            setFieldValue(`variant-gtin_boolean`, { [code]: true })
        } else {
            setFieldValue(`variant-gtin_boolean`, { [code]: false })
        }
    }, [currentProduct?.id])

    const _filterAttributeSelected = useMemo(() => {
        return attributesSelected.filter(_att => !_att.isInactive)
    }, [attributesSelected]);

    const checkExistVariantsUnit = useCallback((code) => {
        return variantsUnit?.some(unit => (values[`attribute-unit-${unit?.id}-${code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == code) && !!values['switch-unit'];
    }, [variantsUnit, values]);

    const amount = (id, value) => {
        return (!!value) ? (value * (values[`ratio-unit-${id}`])) : ''
    }

    const recalculateThePrice = (field, code, value) => {

        (variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${code}`]?.value == code || values[`attribute-unit-${unit?.id}`]?.value == code)) || []).forEach(unit => {
            if (values[`name-unit-${unit?.id}`] && values[`ratio-unit-${unit?.id}`]) {
                setFieldValue(`variant-${unit?.id}-${code}-${field}`, amount(unit?.id, +value || undefined))
            }
        })
    }
    // ========= update lại giá bán , giá bán tối thiểu khi tên unit hoặc ration change =============
    useMemo(() => {
        (variants || []).forEach(variant => {
                const currentUnitChange = variantsUnit?.find(unit => values['curreng_id_unit_change'] == unit?.id)
                if (values[`name-unit-${currentUnitChange?.id}`] && values[`ratio-unit-${currentUnitChange?.id}`]) {
                    setFieldValue(`variant-${currentUnitChange?.id}-${variant?.code}-priceMinimum`, amount(currentUnitChange?.id, values[`variant-${variant?.code}-priceMinimum`] || undefined))

                    setFieldValue(`variant-${currentUnitChange?.id}-${variant?.code}-costPrice`, amount(currentUnitChange?.id, values[`variant-${variant?.code}-costPrice`] || undefined))

                    setFieldValue(`variant-${currentUnitChange?.id}-${variant?.code}-price`, amount(currentUnitChange?.id, values[`variant-${variant?.code}-price`] || undefined))
                } 
        })

    }, [variantsUnit, ...variantsUnit?.map(unit => values[`ratio_name_changed_${unit?.id}`]),])

    // ======== Khi áp dụng tất cả phân loại tính toán lại ==========
    useMemo(() => {
        (variants || []).forEach(variant => {
            (variantsUnit || []).forEach(unit => {
                if (values[`name-unit-${unit?.id}`] && values[`ratio-unit-${unit?.id}`]) {
                    setFieldValue(`variant-${unit?.id}-${variant?.code}-priceMinimum`, amount(unit?.id, values[`variant-${variant?.code}-priceMinimum`] || undefined))
    
                    setFieldValue(`variant-${unit?.id}-${variant?.code}-costPrice`, amount(unit?.id, values[`variant-${variant?.code}-costPrice`] || undefined))
    
                    setFieldValue(`variant-${unit?.id}-${variant?.code}-price`, amount(unit?.id, values[`variant-${variant?.code}-price`] || undefined))
                } 
            })
           
        })
    }, [values['changePrice']])

    // =========== Tính toán tồn kho khi name và ration unit thay đổi ==================
    useMemo(() => {
        (variants || []).forEach(variant => {
            const currentUnitChange = variantsUnit?.find(unit => values['curreng_id_unit_change'] == unit?.id)
                if (values[`name-unit-${currentUnitChange?.id}`] && values[`ratio-unit-${currentUnitChange?.id}`]) {
                    const totalStockOnHand = smeCatalogStores?.map((store) => {
                        const result = Math.floor(((values[`variant-${variant?.code}-${store?.value}-stockOnHand`] || 0) / values[`ratio-unit-${currentUnitChange?.id}`]))
                        return { stockOnHand: result, storeId: store?.value }
                    });

                    setFieldValue(`variant-unit-${currentUnitChange?.id}-${variant?.code}-stockOnHand`, totalStockOnHand || 0)
                }

        })
    }, [...variants?.map(variant => smeCatalogStores?.map(store => values[`variant-${variant?.code}-${store?.value}-stockOnHand`]))?.flat(),
        ...variantsUnit?.map(unit => values[`ratio_name_changed_${unit?.id}`])]);

    const toggleStoreExpansion = (storeValue) => {
        const newExpandedStores = new Set(expandedStores);
        if (newExpandedStores.has(storeValue)) {
          newExpandedStores.delete(storeValue);
        } else {
          newExpandedStores.add(storeValue);
        }
        setExpandedStores(newExpandedStores);
      };

    const columns = flatten([
        _filterAttributeSelected?.map((attribute, index) => ({
            title: attribute?.display_name,
            align: 'center',
            fixed: 'left',
            width: 80,
            onCell: (record, idx) => {
                if (record?.rowSpans?.length > 0) {
                    return {
                        rowSpan: idx % record?.rowSpans[index] === 0 ? record?.rowSpans[index] : 0,
                    };
                }

                return record?.rowSpans;
            },
            render: (item, record) => {
                return record?.namesGenSku[index]
            }
        })),
        values[`switch-unit`] ? {
            title: formatMessage({ defaultMessage: 'Đơn vị chuyển đổi' }),
            key: 'sku',
            dataIndex: 'sku',
            fixed: 'left',
            align: 'left',
            width: 150,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);

                if (!isMutilUnit) return <></>;

                return <div className="d-flex flex-column">
                    <div className="d-flex align-items-center" style={{ minHeight: 38 }}>
                        <span>{values[`main-unit`]}</span>
                    </div>
                    {variantsUnit?.filter(_vUnit => (values[`attribute-unit-${_vUnit?.id}-${record?.code}`]?.value || values[`attribute-unit-${_vUnit?.id}`]?.value) == record?.code)?.map(unit => {
                        return <div className="d-flex align-items-center mt-4" style={{ minHeight: 38 }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-return-right mr-2" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5" />
                            </svg>
                            {values[`name-unit-${unit?.id}`]}
                        </div>
                    })}
                </div>
            }
        } : null,
        {
            title: <div className="d-flex flex-column">
                <span> <p className="text-dark-75 mb-0">Mã SKU<span style={{ color: 'red' }} >*</span></p></span>
                {variants.some(_variant => !values[`variant-${_variant.code}-sku`])
                    &&
                    <div style={{ textTransform: 'none', color: 'red', cursor: 'pointer' }}
                        onClick={e => {
                            e.preventDefault()

                            if (!values.name) {
                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                                return;
                            }

                            if (variants.some(_variant => _variant.names.some(__ => __.trim().length == 0))) {
                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên phân loại con' }), { appearance: 'warning' });
                                return;
                            }

                            variants.forEach(_variant => {
                                setFieldValue(`variant-${_variant.code}-sku`, values[`variant-${_variant.code}-sku`] || createSKUVariant(user?.sme_id, values.name, null, _variant?.namesGenSku))
                                setFieldValue(`variant-sku_boolean`, {});

                                (variantsUnit || []).forEach((unit, _index) => {
                                    setFieldValue(`unit_variant-${unit?.id}-${_variant.code}-sku`,
                                        values[`unit_variant-${unit?.id}-${_variant.code}-sku`] ||
                                        createSKUVariant(user?.sme_id, values.name, null, _variant?.namesGenSku, _index))
                                    setFieldValue(`variant-sku_boolean`, {})
                                })

                            });
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Tự động tạo' })}
                    </div>}
            </div>,
            key: 'sku',
            dataIndex: 'sku',
            align: 'left',
            width: 250,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);
                const isSyncedVar = syncedVariants?.filter(variant => {
                    return variant?.attributes?.map(item => item?.product_attribute_value_ref_index)?.includes(record?.code)
                })
                return <div className="d-flex flex-column">
                    <Field
                        name={`variant-${record?.code}-sku`}
                        component={InputVertical}
                        disabled={isSyncVietful && !!isSyncedVar?.length}
                        placeholder=""
                        label={false}
                        required
                        customFeedbackLabel={' '}
                        countChar
                        maxChar={50}
                        absolute={true}
                        onBlurChange={async (value) => {
                            let validateBoolean = {

                            }
                            let isError = false;
                            variants.forEach(_variant => {
                                if (_variant.code != record.code) {
                                    if (values[`variant-${_variant.code}-sku`] == value) {
                                        isError = true;
                                        validateBoolean[_variant.code] = true;
                                    } else {
                                        validateBoolean[_variant.code] = false;
                                    }
                                }
                            });

                            variantsUnit.forEach(_unit => {
                                if (values[`unit_variant-${_unit?.id}-${_unit.codes}-sku`] == value) {
                                    isError = true;
                                    validateBoolean[`${_unit?.id}-${_unit.codes}`] = true;
                                } else {
                                    validateBoolean[`${_unit?.id}-${_unit.codes}`] = false;
                                }
                            })
                            validateBoolean[record.code] = isError;
                            setFieldValue(`variant-sku_boolean`, validateBoolean)
                            if (!isError) {
                                await checkExistSku(value, record.code)
                            }
                        }}
                    />
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`unit_variant-${unit?.id}-${record?.code}-sku`}
                                    component={InputVertical}
                                    disabled={isSyncVietful && !!isSyncedVar?.length}
                                    placeholder=""
                                    label={false}
                                    required
                                    customFeedbackLabel={' '}
                                    countChar
                                    maxChar={50}
                                    absolute={true}
                                    onBlurChange={async (value) => {
                                        let validateBoolean = {}
                                        let isError = false;

                                        variants.forEach(_variant => {
                                            if (values[`variant-${_variant.code}-sku`] == value) {
                                                isError = true;
                                                validateBoolean[_variant.code] = true;
                                            } else {
                                                validateBoolean[_variant.code] = false;
                                            }
                                        });

                                        variantsUnit.forEach(_unit => {
                                            if (_unit.id != unit.id) {
                                                if (values[`unit_variant-${_unit?.id}-${_unit.codes}-sku`] == value) {
                                                    isError = true;
                                                    validateBoolean[`${_unit?.id}-${_unit.codes}`] = true;
                                                } else {
                                                    validateBoolean[`${_unit?.id}-${_unit.codes}`] = false;
                                                }
                                            }
                                        })
                                        validateBoolean[`${unit?.id}-${unit.codes}`] = isError;
                                        setFieldValue(`variant-sku_boolean`, validateBoolean)
                                        if (!isError) {
                                            await checkExistSku(value, `${unit?.id}-${unit.codes}`)
                                        }
                                    }}
                                />
                            </div>

                        })}
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'GTIN' }),
            key: 'gtin',
            dataIndex: 'gtin',
            align: 'left',
            width: 200,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);
                const isSyncedVar = syncedVariants?.filter(variant => {
                    return variant?.attributes?.map(item => item?.product_attribute_value_ref_index)?.includes(record?.code)
                })
                return <div className="d-flex flex-column">
                    <Field
                        name={`variant-${record?.code}-gtin`}
                        component={InputVertical}
                        disabled={isSyncVietful && !!isSyncedVar?.length}
                        placeholder=""
                        label={false}
                        type='text'
                        customFeedbackLabel={' '}
                        absolute={true}
                        onBlurChange={async (value) => {
                            let validateBoolean = {

                            }
                            let isError = false;
                            variants.forEach(_variant => {
                                if (_variant.code != record?.code) {
                                    if (values[`variant-${_variant.code}-gtin`] == value) {
                                        isError = true;
                                        validateBoolean[_variant.code] = true;
                                    } else {
                                        validateBoolean[_variant.code] = false;
                                    }
                                }
                            });
                            validateBoolean[record?.code] = isError;
                            setFieldValue(`variant-gtin_boolean`, validateBoolean)
                            if (!isError) {
                                await checkExistGtin(value, record?.code)
                            } else {

                            }
                        }}
                    />
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-${record?.code}-gtin`}
                                    component={InputVertical}
                                    disabled={isSyncVietful && !!isSyncedVar?.length}
                                    placeholder=""
                                    label={false}
                                    type='text'
                                    customFeedbackLabel={' '}
                                    absolute={true}
                                    onBlurChange={async (value) => {
                                        let validateBoolean = {

                                        }
                                        let isError = false;
                                        variants.forEach(_variant => {
                                            if (_variant.code != record?.code) {
                                                if (values[`variant-${_variant.code}-gtin`] == value) {
                                                    isError = true;
                                                    validateBoolean[_variant.code] = true;
                                                } else {
                                                    validateBoolean[_variant.code] = false;
                                                }
                                            }
                                        });
                                        validateBoolean[record?.code] = isError;
                                        setFieldValue(`variant-gtin_boolean`, validateBoolean)
                                        if (!isError) {
                                            await checkExistGtin(value, record?.code)
                                        } else {

                                        }
                                    }}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        !isUnit && {
            title: formatMessage({ defaultMessage: 'Đơn vị tính' }),
            key: 'unit',
            dataIndex: 'unit',
            align: 'left',
            width: 200,
            render: (item, record) => {
                const isSyncedVar = syncedVariants?.filter(variant => {
                    return variant?.attributes?.map(item => item?.product_attribute_value_ref_index)?.includes(record?.code)
                })
                return <div className="d-flex flex-column">
                    <Field
                        name={`variant-${record?.code}-unit`}
                        component={InputVertical}
                        disabled={isSyncVietful && !!isSyncedVar?.length}
                        placeholder=""
                        label={false}
                        type='text'
                        customFeedbackLabel={' '}
                        absolute={true}
                    />
                </div>
            }
        },
        !isCreating && {
            title: formatMessage({ defaultMessage: 'Tồn kho' }),
            key: 'sku',
            dataIndex: 'sku',
            align: 'center',
            width: 120,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);
                const totalStockOnHandVariant = (id) => {
                    return smeCatalogStores?.reduce(
                        (result, store) => {
                            result += values[`variant-${id}-${store?.value}-stockOnHand`] || 0;
                            return result;
                        }, 0
                    );
                }

                const totalStockVariantUnit = (id, variantID) => {

                    if (values[`name-unit-${id}`] && values[`ratio-unit-${id}`]) {
                        const totalStockOnHand = smeCatalogStores?.reduce(
                            (result, store) => {
                                result += Math.floor(((values[`variant-${variantID}-${store?.value}-stockOnHand`] || 0) / values[`ratio-unit-${id}`]))
                                return result;
                            }, 0
                        );
                        return totalStockOnHand
                    }
                    return null
                }
                return <div className="d-flex flex-column">
                    <div style={{ minHeight: 38 }} className="d-flex justify-content-center align-items-center">
                        <Field
                            name={`variant-${record?.code}-${values[`origin_stock`]?.value}-stockOnHand`}
                            component={({ }) => {
                                return (
                                    <p
                                        className="text-center cursor-pointer"
                                        onClick={() => {
                                            setCodeConfigStock(record?.code);
                                        }}
                                    >
                                        {totalStockOnHandVariant(record?.code).toLocaleString("en-US")}
                                        <span><i className={`ml-2 ` + (!isCreating && values[`variant-${record?.code}-active`] ? "fas fa-warehouse" : "far fa-edit")} style={{ color: '#000000', fontSize: 14 }} /></span>
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
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: 38 }}>
                                <Field
                                    name={`variant-unit-${unit?.id}-${record?.code}-stockOnHand`}
                                    component={({ }) => {
                                        return (
                                            <div className="text-center cursor-pointer">
                                                <span>{totalStockVariantUnit(unit?.id, record?.code)}</span>
                                                {!isCreating && unit?.sme_variant_id && <span onClick={() => {
                                                    setCodeConfigStock(unit?.id);
                                                }}><i className={`ml-2 ` + (!isCreating ? "fas fa-warehouse" : "far fa-edit")} style={{ color: '#000000', fontSize: 14 }} /></span>}
                                            </div>

                                        )
                                    }}
                                    placeholder=""
                                    label={false}
                                    type='number'
                                    customFeedbackLabel={' '}
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        // {
        //     title: formatMessage({ defaultMessage: 'Giá vốn' }),
        //     key: 'code',
        //     dataIndex: 'code',
        //     align: 'left',
        //     width: 200,
        //     render: (item, record) => {
        //         const isMutilUnit = checkExistVariantsUnit(record?.code);

        //         return <div className="d-flex flex-column">
        //             <Field
        //                 name={`variant-${record?.code}-costPrice`}
        //                 component={InputVertical}
        //                 placeholder=""
        //                 label={false}
        //                 type='number'
        //                 onIsChangeState={(value) => {
        //                     recalculateThePrice('costPrice', record?.code, value)
        //                 }}
        //                 customFeedbackLabel={' '}
        //                 absolute={true}
        //             />
        //             <div className="d-flex flex-column">
        //                 {isMutilUnit && variantsUnit?.map(unit => {

        //                     if ((values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code) {
        //                         return <div className="mt-4">
        //                             <Field
        //                                 name={`variant-${unit?.id}-${record?.code}-costPrice`}
        //                                 component={InputVertical}
        //                                 placeholder=""
        //                                 label={false}
        //                                 type='number'
        //                                 customFeedbackLabel={' '}
        //                                 absolute={true}
        //                             />
        //                         </div>
        //                     } else {
        //                         return <></>
        //                     }

        //                 })}
        //             </div>
        //         </div>
        //     }
        // },
        {
            title: formatMessage({ defaultMessage: 'Giá bán' }),
            key: 'code',
            dataIndex: 'code',
            align: 'left',
            width: 200,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);

                return <div className="d-flex flex-column">
                    <Field
                        name={`variant-${record?.code}-price`}
                        component={InputVertical}
                        placeholder=""
                        required
                        type='number'
                        onIsChangeState={(value) => {
                            if (!isFirstRender.current) { // Only run after initial render
                                recalculateThePrice('price', record?.code, value)
                            }
                        }}
                        customFeedbackLabel={' '}
                        // addOnRight="đ"
                        absolute={true}
                    />
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-${record?.code}-price`}
                                    component={InputVertical}
                                    placeholder=""
                                    required
                                    type='number'
                                    customFeedbackLabel={' '}
                                    // addOnRight="đ"
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
            align: 'left',
            width: 200,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);

                return <div className="d-flex flex-column">
                    <Field
                        name={`variant-${record?.code}-priceMinimum`}
                        component={InputVertical}
                        placeholder=""
                        required
                        type='number'
                        onIsChangeState={(value) => {
                            if (!isFirstRender.current) { 
                                recalculateThePrice('priceMinimum', record?.code, value)
                            }
                        }}
                        customFeedbackLabel={' '}
                        // addOnRight="đ"
                        absolute={true}
                    />
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="mt-4">
                                <Field
                                    name={`variant-${unit?.id}-${record?.code}-priceMinimum`}
                                    component={InputVertical}
                                    placeholder=""
                                    required
                                    type='number'
                                    customFeedbackLabel={' '}
                                    // addOnRight="đ"
                                    absolute={true}
                                />
                            </div>
                        })}
                    </div>
                </div>
            }
        },
        // {
        //     title: formatMessage({ defaultMessage: 'VAT' }),
        //     key: 'code',
        //     dataIndex: 'code',
        //     align: 'left',
        //     width: 200,
        //     render: (item, record) => {
        //         const isMutilUnit = checkExistVariantsUnit(record?.code);

        //         return <div className="d-flex flex-column">
        //             <Field
        //                 name={`variant-${record?.code}-vatRate`}
        //                 component={InputVertical}
        //                 placeholder=""
        //                 required
        //                 type='number'
        //                 customFeedbackLabel={' '}
        //                 // addOnRight="đ"
        //                 absolute={true}
        //             />
        //             <div className="d-flex flex-column">
        //                 {isMutilUnit && variantsUnit?.map(unit => {

        //                     if ((values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code) {
        //                         return <div className="mt-4">
        //                             <Field
        //                                 name={`variant-${unit?.id}-${record?.code}-vatRate`}
        //                                 component={InputVertical}
        //                                 placeholder=""
        //                                 required
        //                                 type='number'
        //                                 customFeedbackLabel={' '}
        //                                 // addOnRight="đ"
        //                                 absolute={true}
        //                             />
        //                         </div>
        //                     } else {
        //                         return <></>
        //                     }
        //                 })}
        //             </div>
        //         </div>
        //     },
        // },
        {
            title: formatMessage({ defaultMessage: 'Liên kết' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 150,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);

                return <div className="d-flex flex-column">
                    <span
                        style={{ minHeight: 38 }}
                        className={`${values[`variant-${record?.code}-linked`]?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} d-flex justify-content-center align-items-center`}
                        onClick={() => {
                            if (values[`variant-${record?.code}-linked`]?.length === 0) return;
                            setCurrentProductVariantLinked(values[`variant-${record?.code}-id`])

                        }}
                    >
                        {values[`variant-${record?.code}-linked`]?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                    </span>
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <span
                                className={`${values[`variant-${record?.code}-${unit?.id}-linked`]?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} mt-4 d-flex justify-content-center align-items-center`}
                                style={{ minHeight: 38 }}
                                onClick={() => {
                                    if (values[`variant-${record?.code}-${unit?.id}-linked`]?.length === 0) return;
                                    setCurrentProductVariantLinked(values[`variant-${record?.code}-${unit?.id}-id`])

                                }}
                            >
                                {values[`variant-${record?.code}-${unit?.id}-linked`]?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                            </span>

                        })}
                    </div>
                </div >
            }
        },
        !isCreating ? {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            key: 'code',
            dataIndex: 'code',
            align: 'center',
            width: 150,
            render: (item, record) => {
                const isMutilUnit = checkExistVariantsUnit(record?.code);

                return <div className="d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 38, borderRight: '1px solid #F0F0F0' }} >
                        {!!values[`variant-${record?.code}-active`] &&
                            <Link to={`/products/stocks/detail/${values[`variant-${record?.code}-id`]}`}>
                                <p>
                                    {formatMessage({ defaultMessage: 'Sửa' })}
                                </p>
                            </Link>
                        }
                    </div>
                    <div className="d-flex flex-column">
                        {isMutilUnit && variantsUnit?.filter(unit => (values[`attribute-unit-${unit?.id}-${record?.code}`]?.value || values[`attribute-unit-${unit?.id}`]?.value) == record?.code)?.map(unit => {
                            return <div className="d-flex align-items-center justify-content-center mt-4" style={{ borderRight: '1px solid #F0F0F0', minHeight: 38 }} >
                                {!!values[`variant-${unit?.id}-active`] &&
                                    <Link to={`/products/stocks/detail/${values[`variant-${record?.code}-${unit?.id}-id`]}`}>
                                        <p>
                                            {formatMessage({ defaultMessage: 'Sửa' })}
                                        </p>
                                    </Link>}
                            </div>

                        })}
                    </div>
                </div >
            }
        } : null
    ]);
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
        <>
            <ToastAlert message={message} isActive={isActive} />
            <ModalProductConnectVariant
                variantId={currentProductVariantLinked}
                onHide={() => {
                    refetch()
                    setCurrentProductVariantLinked(null)
                }
                }
            />

            <Table
                className="upbase-table mt-4"
                columns={columns?.filter(Boolean)}
                data={variants || []}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                </div>}
                tableLayout="auto"
                scroll={{ x: 'max-content' }}
            />

            {/* <div className="table-responsive mt-10">
                <table className={"table product-list table-head-bg table-borderless  table-vertical-center fixed " + (!isCreating ? 'fixed-column ' : '')} style={{ tableLayout: 'fixed', borderRight: '1px solid transparent', minWidth: '1600px' }}>
                    <thead>
                        <tr className="text-left" >
                            {
                                _filterAttributeSelected.map(_attribute => {
                                    return (
                                        <th style={{ fontSize: '14px' }} key={`header--${_attribute.id}`} >
                                            <span className="text-dark-75">{_attribute.display_name}</span>
                                        </th>
                                    )
                                })
                            }

                            <th style={{ fontSize: '14px' }} width='20%'>
                                <p className="text-dark-75 mb-0">Mã SKU<span style={{ color: 'red' }} >*</span></p>


                                {!variants.every(_variant => values[`variant-${_variant.code}-sku`]) && <a href="#" style={{ textTransform: 'none' }}
                                    onClick={e => {
                                        e.preventDefault()

                                        if (!values.name) {
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                                            return;
                                        }

                                        if (variants.some(_variant => _variant.names.some(__ => __.trim().length == 0))) {
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên phân loại con' }), { appearance: 'warning' });
                                            return;
                                        }

                                        variants.forEach(_variant => {
                                            setFieldValue(`variant-${_variant.code}-sku`, createSKUVariant(user?.sme_id, values.name, null, _variant.namesGenSku), false)
                                            setFieldValue(`variant-sku_boolean`, {})
                                        })
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tự động tạo' })}
                                </a>}


                            </th>
                            <th style={{ fontSize: '14px' }} width='10%'><span className="text-dark-75">GTIN</span></th>
                            <th style={{ fontSize: '14px' }} width='10%' className="text-center"><span className="text-dark-75">{isCreating ? formatMessage({ defaultMessage: 'Tồn đầu' }) : formatMessage({ defaultMessage: 'Tồn kho' })}</span></th>
                            <th style={{ fontSize: '14px' }} width='10%'><span className="text-dark-75">{formatMessage({ defaultMessage: 'Giá vốn' })}</span></th>
                            <th style={{ fontSize: '14px' }} width='10%'><span className="text-dark-75">{formatMessage({ defaultMessage: 'Giá bán' })}</span></th>
                            <th style={{ fontSize: '14px' }} width='10%'><span className="text-dark-75">{formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}</span></th>
                            <th style={{ fontSize: '14px' }} width='10%'><span className="text-dark-75">{formatMessage({ defaultMessage: 'VAT' })}</span></th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width='8%'><span className="text-dark-75">{formatMessage({ defaultMessage: 'Liên kết' })}</span></th>
                            {!isCreating && <th width='5%'></th>}
                        </tr>
                    </thead>
                    <tbody  >
                        {
                            variants.map(_row => {
                                return (
                                    <tr key={`row-table-${_row.code}`} style={{ borderBottom: '1px solid #F0F0F0', }} >
                                        {
                                            _row.names.map((_text, index) => {
                                                return (
                                                    <td key={`row-table-${_row.code}--${index}`} rowSpan={index == 0 ? _row.rowSpan : 1} style={{ borderLeft: '1px solid #F0F0F0' }} >
                                                        <span className="text-muted font-weight-bold">
                                                            {_text}
                                                        </span>
                                                    </td>
                                                )
                                            })
                                        }
                                        <td style={{ borderRight: '1px solid #F0F0F0', borderLeft: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-sku`}
                                                component={InputVertical}
                                                placeholder=""
                                                label={false}
                                                required
                                                customFeedbackLabel={' '}
                                                countChar
                                                maxChar={50}
                                                absolute={true}
                                                onBlurChange={async (value) => {
                                                    let validateBoolean = {

                                                    }
                                                    let isError = false;
                                                    variants.forEach(_variant => {
                                                        if (_variant.code != _row.code) {
                                                            if (values[`variant-${_variant.code}-sku`] == value) {
                                                                isError = true;
                                                                validateBoolean[_variant.code] = true;
                                                            } else {
                                                                validateBoolean[_variant.code] = false;
                                                            }
                                                        }
                                                    });
                                                    validateBoolean[_row.code] = isError;
                                                    setFieldValue(`variant-sku_boolean`, validateBoolean)
                                                    if (!isError) {
                                                        await checkExistSku(value, _row.code)
                                                    } else {

                                                    }
                                                }}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-gtin`}
                                                component={InputVertical}
                                                placeholder=""
                                                label={false}
                                                type='text'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                                onBlurChange={async (value) => {
                                                    let validateBoolean = {

                                                    }
                                                    let isError = false;
                                                    variants.forEach(_variant => {
                                                        if (_variant.code != _row.code) {
                                                            if (values[`variant-${_variant.code}-gtin`] == value) {
                                                                isError = true;
                                                                validateBoolean[_variant.code] = true;
                                                            } else {
                                                                validateBoolean[_variant.code] = false;
                                                            }
                                                        }
                                                    });
                                                    validateBoolean[_row.code] = isError;
                                                    setFieldValue(`variant-gtin_boolean`, validateBoolean)
                                                    if (!isError) {
                                                        await checkExistGtin(value, _row.code)
                                                    } else {

                                                    }
                                                }}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-${values[`origin_stock`]?.value}-stockOnHand`}
                                                component={({ }) => {
                                                    const totalStockOnHandVariant = smeCatalogStores?.reduce(
                                                        (result, store) => {
                                                            result += values[`variant-${_row.code}-${store?.value}-stockOnHand`] || 0;
                                                            return result;
                                                        }, 0
                                                    );

                                                    return (
                                                        <p
                                                            className="text-center cursor-pointer"
                                                            onClick={() => {
                                                                setCodeConfigStock(_row.code);
                                                            }}
                                                        >
                                                            {totalStockOnHandVariant.toLocaleString("en-US")}
                                                            <span><i className={`ml-2 ` + (!isCreating && values[`variant-${_row.code}-active`] ? "fas fa-warehouse" : "far fa-edit")} style={{ color: '#000000', fontSize: 14 }} /></span>
                                                        </p>
                                                    )
                                                }}
                                                placeholder=""
                                                label={false}
                                                type='number'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-costPrice`}
                                                component={InputVertical}
                                                placeholder=""
                                                label={false}
                                                type='number'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0', padding: '15px 5px' }}>
                                            <Field
                                                name={`variant-${_row.code}-price`}
                                                component={InputVertical}
                                                placeholder=""
                                                required
                                                type='number'
                                                customFeedbackLabel={' '}
                                                // addOnRight="đ"
                                                absolute={true}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-priceMinimum`}
                                                component={InputVertical}
                                                placeholder=""
                                                required
                                                type='number'
                                                customFeedbackLabel={' '}
                                                // addOnRight="đ"
                                                absolute={true}
                                            />
                                        </td>
                                        <td style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <Field
                                                name={`variant-${_row.code}-vatRate`}
                                                component={InputVertical}
                                                placeholder=""
                                                required
                                                type='number'
                                                customFeedbackLabel={' '}
                                                // addOnRight="đ"
                                                absolute={true}
                                            />
                                        </td>

                                        <td className="text-center" style={{ borderRight: '1px solid #F0F0F0' }}>
                                            <span
                                                className={`${values[`variant-${_row.code}-linked`]?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                                                onClick={() => {
                                                    if (values[`variant-${_row.code}-linked`]?.length === 0) return;
                                                    setCurrentProductVariantLinked(values[`variant-${_row.code}-id`])

                                                }}
                                            >
                                                {values[`variant-${_row.code}-linked`]?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                                            </span>
                                        </td>

                                        {
                                            !isCreating && <td className="text-center" style={{ borderRight: '1px solid #F0F0F0' }} >
                                                {!!values[`variant-${_row.code}-active`] &&
                                                    <Link to={`/products/stocks/detail/${values[`variant-${_row.code}-id`]}`}>
                                                        <p>
                                                            {formatMessage({ defaultMessage: 'Sửa' })}
                                                        </p>
                                                    </Link>
                                                }
                                            </td>
                                        }
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div > */}

            <Modal
                show={!!codeConfigStock && !(isCreating || !values[`variant-${codeConfigStock}-active`])}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName={isCreating ? "modal-show-stock-product" : "modal-show-detail-stock-product"}
                centered
                onHide={() => {
                    setCodeConfigStock('')
                }}
                backdrop={true}
            >
                {/* {(isCreating || !values[`variant-${codeConfigStock}-active`]) && (
                    <Formik
                        initialValues={smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = values[`variant-${codeConfigStock}-${store?.value}-stockOnHand`] || 0;
                                return result;
                            }, {}
                        )}
                        validationSchema={Yup.object().shape(smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = Yup.number()
                                    .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                                    .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa 999.999' }));

                                return result;
                            }, {}
                        ))}
                    >
                        {({
                            handleSubmit,
                            values: valuesPrice,
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
                                                setCodeConfigStock('')
                                            }}
                                            style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                                        />
                                        <div style={{ padding: '0rem 1rem' }}>
                                            <div className="d-flex align-items-center mt-4 mb-2">
                                                <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {values[`variant-${codeConfigStock}-sku`] || '--'}</span>
                                                <span style={{ width: '50%' }}>GTIN: {values[`variant-${codeConfigStock}-gtin`] || '--'}</span>
                                            </div>
                                            <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                                <thead>
                                                    <tr className="text-left text-uppercase" >
                                                        <th style={{ border: '1px solid' }} width='50%'>
                                                            <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho vật lý' })}</span>
                                                        </th>
                                                        <th style={{ border: '1px solid' }} width='50%'>
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
                                                                            // name={`variant-${codeConfigStock}-${_store?.value}-costPrice`}
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
                                                    let error = await validateForm(valuesPrice);

                                                    const isErrorForm = Object.keys(error)?.length > 0

                                                    if (isErrorForm) {
                                                        handleSubmit();
                                                    } else {
                                                        smeCatalogStores.forEach(
                                                            _store => {
                                                                setFieldValue(
                                                                    `variant-${codeConfigStock}-${_store?.value}-stockOnHand`,
                                                                    valuesPrice[`${_store?.value}-stockOnHand`] || 0
                                                                );
                                                            }
                                                        )
                                                        setCodeConfigStock('');
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
                )} */}
                {(!isCreating && values[`variant-${codeConfigStock}-active`]) && (
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
                                    setCodeConfigStock('')
                                }}
                                style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                            />
                            <div style={{ padding: '0rem 1rem' }}>
                                <div className="d-flex align-items-center mt-4 mb-2">
                                    <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {values[`variant-${codeConfigStock}-sku`] || '--'}</span>
                                    <span style={{ width: '50%' }}>GTIN: {values[`variant-${codeConfigStock}-gtin`] || '--'}</span>
                                </div>
                                <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                    <thead>
                                        <tr className="text-uppercase" >
                                            <th style={{ border: '1px solid' }} width='19%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} width='16%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Trạng thái hàng hóa' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn thực tế' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='13%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm giữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='13%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm ứng' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='13%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Dự trữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Đang vận chuyển' })}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {smeCatalogStores?.map(
                                            (_store, index) => {
                                                let statusProductArray = values.inventoryStatusVariant.filter(item => item.sme_store_id == _store.value && (item?.variant?.parent_variant_id == values[`variant-${codeConfigStock}-id`] || item?.variant?.id == values[`variant-${codeConfigStock}-id`]))

                                                statusProductArray.sort(sortArray)
                                                const isStoreExpanded = expandedStores.has(_store.value);
                                                const stockActual = values[`variant-${codeConfigStock}-${_store?.value}-stockActual`] || 0;
                                                const stockReserve = values[`variant-${codeConfigStock}-${_store?.value}-stockReserve`] || 0;
                                                const stockAllocated = values[`variant-${codeConfigStock}-${_store?.value}-stockAllocated`] || 0;
                                                const stockPreallocate = values[`variant-${codeConfigStock}-${_store?.value}-stockPreallocate`] || 0;
                                                const stockAvailable = values[`variant-${codeConfigStock}-${_store?.value}-stockAvailable`] || 0;
                                                const stockShipping = values[`variant-${codeConfigStock}-${_store?.value}-stockShipping`] || 0;

                                                return (
                                                <>
                                                    <tr
                                                    key={`sme-catalog-store-${index}`}
                                                    >
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                            display:'flex',
                                                            alignItems:'center',
                                                            justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <span className="text-dark-75"
                                                        style={{fontWeight: 'bold'}}>
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
                                                        {!!statusData?.sme_product_status?.length ? 'Tất cả' : "Mới"}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
                                                        {stockActual}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
                                                        {stockAllocated}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
                                                        {stockPreallocate}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
                                                        {stockReserve}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
                                                        {stockAvailable}
                                                    </td>
                                                    <td
                                                        style={{
                                                        border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                    >
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
                                                    )}
                                                </>
                                                );
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
                                    onClick={() => setCodeConfigStock('')}
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
        </>
    )
})