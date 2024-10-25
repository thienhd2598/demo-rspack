/*
 * Created by duydatpham@gmail.com on 24/02/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardHeaderToolbar,
    FieldFeedbackLabel,
    Input,
    TextArea,
    // InputVertical
} from "../../../../_metronic/_partials/controls";
import { Switch } from '../../../../_metronic/_partials/controls/forms/Switch'
import { Field, useFormikContext, Form, Formik } from "formik";
import { InputVertical } from '../../../../components/InputNumber';
import ImageDialog from './dialog/ImageDialog';
import { Modal } from 'react-bootstrap';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import TextAreaDialog from "./dialog/TextAreaDialog";
import ShippingDialog from "./dialog/ShippingDialog";
import { useCreateMultiContext } from './CreateMultiContext';
import * as Yup from "yup";
import { useIntl } from "react-intl";
import _ from 'lodash';
import TableProduct from "./components/TableProduct";
import { useHistory } from "react-router-dom";
import { useMutation } from "@apollo/client";
import mutate_scCreateMultipleProduct from "../../../../graphql/mutate_scCreateMultipleProduct";
import { validatePriceVariant } from "../../ProductsStore/ProductsUIHelpers";
import LoadingDialog from "../product-new/LoadingDialog";
import { useElementOnScreen } from '../../../../hooks/useElementOnScreen';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { useToasts } from "react-toast-notifications";
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { getMaxLengthSKU, processDescriptionTiktok, validateOriginVideo } from "../../../../utils";
import SetCache from "./components/SetCache";
import PopupConfirm from "./dialog/PopupConfirm";

const regex = new RegExp("[^\u0000-\u007F]+")
export default memo(() => {
    const { products, setProducts, setCacheStep3, cacheStep3 } = useCreateMultiContext();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();

    const history = useHistory()
    const [isShowDescription, setShowDescription] = useState(false);
    const [isShowShipping, setShowShipping] = useState(false);

    const [indexPopupConfirm, setIndexPopupConfirm] = useState(-1);
    const [productRemoveIndex, setProductRemoveIndex] = useState([]);
    const [indexShowImgPopup, setIndexShowImgPopup] = useState(-1);
    const [indexShowShippingPopup, setIndexShowShippingPopup] = useState(-1);
    const [indexShowTextField, setIndexShowTextField] = useState(-1);

    const [isShowTxtArea, setShowTxtArea] = useState(false);
    const [typeArea, setTypeArea] = useState('');

    const [currentChannel, setCurrentChannel] = useState(null)
    const [errorMessage, setErrorMessage] = useState([]);

    const [createProducts, { loading }] = useMutation(mutate_scCreateMultipleProduct)

    // const [containerRef, isVisible] = useElementOnScreen({
    //     root: null,
    //     rootMargin: "0px",
    //     threshold: 1.0
    // });
    // const [optionsRef, isTop] = useElementOnScreen({
    //     root: null,
    //     rootMargin: "0px",
    //     threshold: 1.0
    // });

    const initialValues = useMemo(() => {
        if (!products || products.length == 0) return null;

        if (Object.keys(cacheStep3).length > 0) return cacheStep3;

        let groupValues = {};
        products.forEach(
            (item, index) => {
                console.log(item)
                Object.keys(item.form).map(
                    _key => {
                        groupValues = {
                            ...groupValues,
                            ...(_key === 'description_html_init' ? {
                                [`description_html_${index}_init`]: item.form[_key]
                            } : {
                                [`${_key}_${index}`]: item.form[_key]
                            })
                        }
                    }
                )
            }
        );

        return {
            ...groupValues,
            __changed__: true
        } || {}
    }, [products, cacheStep3]);

    const property = useMemo(
        () => {
            return products?.map(_product => {
                // if (_product.channel.connector_channel_code === 'tiktok' && _product.variants.length === 0) {
                //     return [{
                //         title: 'Mặc định',
                //         price: `variant-1-price`,
                //         sku: `variant-1-sku`,
                //         stockOnHand: `variant-1-stockOnHand`,
                //         lengthsku: getMaxLengthSKU(_product.channel.connector_channel_code)
                //     }]
                // }

                return _product.variants.map(_variant => ({
                    title: _variant.name,
                    price: `variant-${_variant.code}-price`,
                    sku: `variant-${_variant.code}-sku`,
                    stockOnHand: `variant-${_variant.code}-stockOnHand`,
                    lengthsku: getMaxLengthSKU(_product.channel.connector_channel_code)
                }))
            }) || []
        }, [products]
    );

    const validationSchema = useMemo(() => {
        let schema = {};
        products.forEach((_product, index) => {
            schema[`name_${index}`] = Yup.string()
                .min(_product?.channel?.connector_channel_code == 'tiktok' ? 25 : 10, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: _product?.channel?.connector_channel_code == 'tiktok' ? 25 : 10, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
                .max(_product?.channel?.connector_channel_code == 'shopee' ? 120 : 255, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: _product?.channel?.connector_channel_code == 'shopee' ? 120 : 255, name: formatMessage({ defaultMessage: "Tên sản phẩm" }) }))
                .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên sản phẩm" }).toLowerCase() }))
                .test(
                    'chua-ky-tu-space-o-dau-cuoi',
                    formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa dấu cách ở đầu và cuối' }),
                    (value, context) => {
                        if (!!value) {
                            return value.length == value.trim().length;
                        }
                        return false;
                    },
                )
                .test(
                    'chua-ky-tu-2space',
                    formatMessage({ defaultMessage: 'Tên sản phẩm sàn không được chứa 2 dấu cách liên tiếp' }),
                    (value, context) => {
                        if (!!value) {
                            return !(/\s\s+/g.test(value))
                        }
                        return false;
                    },
                );

            schema[`video_url_${index}`] = Yup.string()
                .notRequired()
                .test(
                    'youtube-format',
                    formatMessage({ defaultMessage: 'Đường dẫn không hợp lệ. Vui lòng chỉ sử dụng link Youtube.' }),
                    (value, context) => {
                        if ((value || '').length == 0) {
                            return true
                        }
                        if (!!value) {
                            return (value || '').toLowerCase().trim().startsWith('https://www.youtube.com') || (value || '').toLowerCase().trim().startsWith('https://youtube.com');
                        }
                        return false;
                    },
                );

            if (_product?.channel?.connector_channel_code == 'tiktok') {
                schema[`sku_${index}`] = Yup.string()
                    .max(getMaxLengthSKU(_product?.channel?.connector_channel_code), `${formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được' })} ${getMaxLengthSKU(_product?.channel?.connector_channel_code)} ${formatMessage({ defaultMessage: 'ký tự' })}`)
                    .notRequired()
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return true;
                        },
                    )
                    .test(
                        'chua-ky-tu-tieng-viet',
                        formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
                        (value, context) => {
                            if (!!value) {
                                return !regex.test(value);
                            }
                            return true;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return true;
                        },
                    );
            } else {
                schema[`sku_${index}`] = Yup.string()
                    .max(getMaxLengthSKU(_product?.channel?.connector_channel_code), formatMessage({ defaultMessage: "Mã SKU tối đa chỉ được {count} ký tự" }, { count: getMaxLengthSKU(_product?.channel?.connector_channel_code) }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-tieng-viet',
                        formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
                        (value, context) => {
                            if (!!value) {
                                return !regex.test(value);
                            }
                            return true;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    );
            }

            console.log({ property })
            if (_product?.channel?.connector_channel_code == 'lazada' && property?.[0].length > 0) {
                delete schema[`sku_${index}`];
            };

            if (_product?.channel?.connector_channel_code == 'shopee') {
                schema[`width_${index}`] = Yup.number()
                    .notRequired()
                    .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
                    .when([`height_${index}`, `length_${index}`], (height, length, schema) => {
                        const minSchemaWidth = (!height && !length) ? 0 : 1;
                        return schema.min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '1.000.000' }))
                    });
                schema[`length_${index}`] = Yup.number()
                    .notRequired()
                    .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
                    .when([`height_${index}`, `width_${index}`], (height, width, schema) => {
                        const minSchemaLength = (!height && !width) ? 0 : 1;
                        return schema.min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '1.000.000' }))
                    });
                schema[`height_${index}`] = Yup.number()
                    .notRequired()
                    .max(1000000, formatMessage({ defaultMessage: 'Kích thước tối đa là 1.000.000 cm' }))
                    .when([`length_${index}`, `width_${index}`], (length, width, schema) => {
                        const minSchemaHeight = (!length && !width) ? 0 : 1;
                        return schema.min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '1.000.000' }))
                    });
                schema[`weight_${index}`] = Yup.number()
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '999.999' }))
                    .max(999999, formatMessage({ defaultMessage: 'Cân nặng tối đa là 999.999 g' }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))

                if (_product?.channel?.special_type != 1) {
                    schema[`description_${index}`] = Yup.string()
                        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}", defaultMessage: 'Vui lòng nhập {name}' }, { name: formatMessage({ defaultMessage: 'mô tả sản phẩm' }) }))
                        .min(100, formatMessage({ defaultMessage: "{name} phải có tối thiểu {length} ký tự" }, { length: 100, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) }))
                        .max(5000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 5000, name: formatMessage({ defaultMessage: 'Mô tả sản phẩm' }) }));
                }
            }

            if (_product?.channel?.connector_channel_code == 'lazada') {
                schema[`width_${index}`] = Yup.number()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'chiều rộng' }) }))
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
                    .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }));
                schema[`length_${index}`] = Yup.number()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'chiều dài' }) }))
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
                    .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }));
                schema[`height_${index}`] = Yup.number()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'chiều cao' }) }))
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300' }))
                    .max(300, formatMessage({ defaultMessage: 'Kích thước tối đa là 300 cm' }))
                schema[`weight_${index}`] = Yup.number()
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '300.000' }))
                    .max(300000, formatMessage({ defaultMessage: 'Cân nặng tối đa là 300.000 g' }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))
            }

            if (_product?.channel?.connector_channel_code == 'tiktok') {
                schema[`width_${index}`] = Yup.number()
                    .notRequired()
                    .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
                    .when([`length_${index}`, `height_${index}`], (length, height, schema) => {
                        const minSchemaWidth = (!height && !length) ? 0 : 1;
                        let maxValueWidth = ((80 * 6000) / ((length * height) + 1)).toFixed();

                        if (minSchemaWidth) {
                            return schema
                                .min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '180' }))
                                .max(maxValueWidth, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
                        }

                        return schema
                            .min(minSchemaWidth, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaWidth, max: '180' }))
                            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
                    });
                schema[`length_${index}`] = Yup.number()
                    .notRequired()
                    .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
                    .when([`width_${index}`, `height_${index}`], (width, height, schema) => {
                        let maxValueLength = ((80 * 6000) / ((width * height) + 1)).toFixed();
                        const minSchemaLength = (!height && !width) ? 0 : 1;

                        if (minSchemaLength) {
                            return schema
                                .min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '180' }))
                                .max(maxValueLength, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
                        }

                        return schema
                            .min(minSchemaLength, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaLength, max: '180' }))
                            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
                    });
                schema[`height_${index}`] = Yup.number()
                    .notRequired()
                    .test('len', formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }), val => !val || val <= 180)
                    .when([`width_${index}`, `length_${index}`], (width, length, schema) => {
                        let maxValueHeight = ((80 * 6000) / ((width * length) + 1)).toFixed();
                        const minSchemaHeight = (!length && !width) ? 0 : 1;

                        if (minSchemaHeight) {
                            return schema
                                .min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '180' }))
                                .max(maxValueHeight, formatMessage({ defaultMessage: 'Trọng lượng thể tích phải nhỏ hơn 80.00kg. Trọng lượng thể tích = chiều dài*chiều rộng*chiều cao/6000.' }))
                        }

                        return schema
                            .min(minSchemaHeight, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: minSchemaHeight, max: '180' }))
                            .max(180, formatMessage({ defaultMessage: 'Kích thước tối đa là 180 cm' }));
                    });
                schema[`weight_${index}`] = Yup.number()
                    .min(1, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 1, max: '70.000' }))
                    .max(70000, formatMessage({ defaultMessage: 'Cân nặng tối đa là 70.000 g' }))
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'Cân nặng' }).toLowerCase() }))

                schema[`description_html_${index}`] = Yup.string()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'mô tả sản phẩm' }) }))
                    .min(56, formatMessage({ defaultMessage: "Mô tả sản phẩm phải có tối thiểu 56 ký tự hoặc có tối thiểu 1 ảnh" }))
                    .max(10000, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 10000, name: 'Mô tả sản phẩm' }));
            }
        });

        if (property.length > 0) {
            property.forEach((_property, _index) => {
                if (_property.length > 0) {
                    _property.forEach(__pro => {
                        schema[`property-sku_boolean`] = Yup.object().notRequired()
                        schema[`${__pro.sku}_${_index}`] = Yup.string()
                            .max(getMaxLengthSKU(products[0]?.channel?.connector_channel_code), `${formatMessage({ defaultMessage: 'Mã SKU tối đa chỉ được' })} ${getMaxLengthSKU(products[0]?.channel?.connector_channel_code)} ${formatMessage({ defaultMessage: 'ký tự' })}`)
                            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'mã SKU' }))
                            .test(
                                'chua-ky-tu-space-o-dau-cuoi',
                                formatMessage({ defaultMessage: 'SKU không được chứa dấu cách ở đầu và cuối' }),
                                (value, context) => {
                                    if (!!value) {
                                        return value.length == value.trim().length;
                                    }
                                    return false;
                                },
                            )
                            .test(
                                'chua-ky-tu-tieng-viet',
                                formatMessage({ defaultMessage: 'Mã SKU không được chứa ký tự Tiếng Việt' }),
                                (value, context) => {
                                    if (!!value) {
                                        return !regex.test(value);
                                    }
                                    return true;
                                },
                            )
                            .test(
                                'chua-ky-tu-2space',
                                formatMessage({ defaultMessage: 'SKU không được chứa 2 dấu cách liên tiếp' }),
                                (value, context) => {
                                    if (!!value) {
                                        return !(/\s\s+/g.test(value))
                                    }
                                    return false;
                                },
                            )

                        schema[`${__pro.price}_${_index}`] = Yup.number().min(1000, formatMessage({ defaultMessage: "Giá tối thiểu {price}đ" }, { price: '1.000' }))
                            .max(120000000, formatMessage({ defaultMessage: "Giá tối đa {price}đ" }, { price: '120.000.000' }))
                            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'giá niêm yết' }));

                        schema[`${__pro.stockOnHand}_${_index}`] = Yup.number()
                            .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                            .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
                            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'số lượng sản phẩm' }));
                    })
                } else {
                    schema[`price_${_index}`] = Yup.number()
                        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'giá niêm yết' }))
                        .min(1000, formatMessage({ defaultMessage: 'Giá tối thiểu là 1.000đ' }))
                        .max(120000000, formatMessage({ defaultMessage: 'Giá tối đa là 120.000.000đ' }));

                    schema[`stockOnHand_${_index}`] = Yup.number()
                        .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                        .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
                        .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: 'số lượng sản phẩm' }));
                }
            })
        };

        let relationShipping = products?.reduce(
            (result, _val, _index) => {
                result = [
                    ...result,
                    [`length_${_index}`, `height_${_index}`], [`width_${_index}`, `length_${_index}`], [`width_${_index}`, `height_${_index}`]
                ]
                return result;
            }, []
        );

        return Yup.object().shape(schema, (products?.[0]?.channel?.connector_channel_code == 'tiktok' || products?.[0]?.channel?.connector_channel_code == 'shopee') ? relationShipping : [])
    }, [products, property]);

    // const renderCssButton = useMemo(
    //     () => {
    //         if (isTop && !isVisible) return 'group-button-fixed-bottom';
    //         if (!isTop && !isVisible) return 'group-button-fixed-top';

    //         return '';
    //     }, [isVisible, isTop]
    // );


    if (!initialValues || initialValues.length == 0) {
        return (
            <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
                <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
            </div>
        );
    }

    const toFindDuplicates = arr => arr.filter((item, index) => arr?.map(__ => __.sku).indexOf(item.sku) !== index);

    const onSave = useCallback(
        async (values, errorObj, handleSubmit, isSold, setFieldError) => {
            let error = false;
            let errorMess = [];

            const errorMapping = Object.keys(errorObj).reduce(
                (resultError, currentKeyError) => {
                    const splitErrorKey = currentKeyError.split('_');
                    const indexErrorKey = splitErrorKey[splitErrorKey.length - 1];

                    const existProductRemove = productRemoveIndex.some(_index => indexErrorKey == _index);
                    if (existProductRemove) delete resultError[currentKeyError];

                    return resultError;
                }, { ...errorObj }
            );

            console.log({ errorMapping })

            if (Object.keys(errorMapping).length > 0) {
                handleSubmit();

                let constantsErr = {
                    'name': formatMessage({ defaultMessage: 'Vui lòng cập nhật tên sản phẩm' }),
                    'sku': formatMessage({ defaultMessage: 'Vui lòng cập nhật mã sku' }),
                    'description': formatMessage({ defaultMessage: 'Vui lòng cập nhật mô tả' }),
                    'price': formatMessage({ defaultMessage: 'Vui lòng cập nhật giá niêm yết' }),
                    'stockOnHand': formatMessage({ defaultMessage: 'Vui lòng cập nhật số lượng sản phẩm' }),
                    'width': formatMessage({ defaultMessage: 'Vui lòng cập nhật kích thước' }),
                    'length': formatMessage({ defaultMessage: 'Vui lòng cập nhật kích thước' }),
                    'height': formatMessage({ defaultMessage: 'Vui lòng cập nhật kích thước' }),
                    'weight': formatMessage({ defaultMessage: 'Vui lòng cập nhật cân nặng' })
                };

                Object.keys(errorMapping).map((_error) => {
                    let errSplit = _error.split('_');
                    let indexErr = errSplit[errSplit.length - 1];
                    let keyErr = ['name', 'sku', 'description', 'stockOnHand', 'price', 'width', 'length', 'height', 'weight'];

                    if (keyErr.some(_key => _error.includes(_key))) {
                        let keyFinded = keyErr?.find(__keyErr => _error.includes(__keyErr));

                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == indexErr)) {
                            errorMess = errorMess.concat({
                                key: indexErr,
                                title: [constantsErr[keyFinded]]
                            })
                        } else {
                            errorMess = errorMess.map(_err => {
                                if (_err?.key == indexErr) {
                                    return {
                                        ..._err,
                                        title: _err.title.concat(constantsErr[keyFinded])
                                    }
                                }
                                return _err;
                            })
                        }
                    }
                })
                error = true;
            }

            let descriptionhtml = await Promise.all(products.map((_product, _index) => {
                return _product.channel.connector_channel_code == 'tiktok' && !error ? processDescriptionTiktok(values[`description_html_${_index}`]) : Promise.resolve(values[`description_html_${_index}`])
            }))

            let productPayload = products
                .map((_product, _index) => {
                    const existProductRemove = productRemoveIndex.some(_idxProduct => _idxProduct === _index);
                    if (existProductRemove) return null;

                    if (_product?.channel?.connector_channel_code == 'tiktok' && !values[`description_html_${_index}`]) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Vui lòng nhập mô tả HTML' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Vui lòng nhập mô tả HTML' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }
                    // let promiseCheckExistSku = [];
                    let totalStockOnHandVariant = 0;
                    //  
                    let newvariants = _product.variants?.map((_variant, indexVariant) => {
                        totalStockOnHandVariant += values[`variant-${_variant.code}-stockOnHand_${_index}`] || 0;
                        return {
                            attribute_values: _variant.attributes.map(_ref => ({ variant_attribute_value_index: _ref.attribute_value_ref_index })),
                            price: values[`variant-${_variant.code}-price_${_index}`],
                            sellable_stock: values[`variant-${_variant.code}-stockOnHand_${_index}`] || 0,
                            sku: values[`variant-${_variant.code}-sku_${_index}`] || '',
                            position: indexVariant,
                            name: _variant.name,
                            ...(!!values[`variant-${_variant.code}-sme_product_variant_id_${_index}`] ? { sme_product_variant_id: values[`variant-${_variant.code}-sme_product_variant_id_${_index}`] } : {})
                        }
                    });

                    const variantCheckSku = _product.variants?.map((_variant) => ({
                        sku: values[`variant-${_variant.code}-sku_${_index}`] || '',
                        key: `variant-${_variant.code}-sku_${_index}`
                    }))

                    let uniqVariants = toFindDuplicates(variantCheckSku)


                    if (uniqVariants.length > 0) {
                        const filterUniqSku = variantCheckSku?.filter(_variant => uniqVariants[0]?.sku == _variant?.sku);
                        filterUniqSku.forEach(_variant => setFieldError([_variant.key], formatMessage({ defaultMessage: `Tên sku phân loại không được trùng nhau` })))
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Tên sku phân loại không được trùng nhau' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Tên sku phân loại không được trùng nhau' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }

                    if (newvariants.length == 0) {
                        totalStockOnHandVariant = values[`stockOnHand_${_index}`]
                        newvariants.push({
                            attribute_values: [],
                            price: values[`price_${_index}`] || null,
                            sellable_stock: values[`stockOnHand_${_index}`],
                            sku: values[`sku_${_index}`],
                            position: 0,
                            name: values[`name_${_index}`],
                            ...(!!values[`variant-noattribute-sme_product_variant_id_${_index}`] ? { sme_product_variant_id: values[`variant-noattribute-sme_product_variant_id_${_index}`] } : {})
                        })
                    }

                    // if (newvariants.length == 0 && _product?.channel?.connector_channel_code == 'tiktok') {
                    //     totalStockOnHandVariant = values[`stockOnHand_${_index}`]
                    //     newvariants.push({
                    //         attribute_values: [{
                    //             variant_attribute_value_index: "1"
                    //         }],
                    //         price: values[`variant-1-price_${_index}`] || null,
                    //         stock_on_hand: values[`variant-1-stockOnHand_${_index}`],
                    //         sku: values[`variant-1-sku_${_index}`],
                    //         position: 0,
                    //         name: 'Mặc định',                            
                    //     })
                    // }
                    console.log('totalStockOnHandVariant', totalStockOnHandVariant, _.sumBy((_product?.raw.sme_catalog_product_variants || []), 'stock_on_hand'))

                    if (_product.channel.connector_channel_code == 'shopee' && (_product.logisticChannels || []).length == 0) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Vui lòng kích hoạt ít nhất 1 đơn vị vận chuyển cho sản phẩm của bạn' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }

                    let variant_attributes = _product.attributesSelected.filter(_att => !_att.isInactive).filter(_attribute => _attribute.isCustom).map((_attribute, _indexAttribute) => {
                        return {
                            sc_attribute_id: !!_attribute?.sc_attribute_id ? parseInt(_attribute.sc_attribute_id) : null,
                            position: _indexAttribute,
                            variant_attribute_index: String(_indexAttribute),
                            sme_variant_attribute_id: !!_attribute.sme_variant_attribute_id ? String(_attribute.sme_variant_attribute_id) : null,
                            name: _attribute.display_name,
                            values: (_attribute.values || []).map((_value, __index) => {
                                let attributeFiles = _product.productAttributeFiles[_value.code] || { files: [] }
                                return {
                                    variant_attribute_value_index: String(_value.code),
                                    sme_variant_attribute_value_id: _value.sme_variant_attribute_value_id,
                                    value: _value.v,
                                    position: __index,
                                    assets_add: (attributeFiles.files || []).map((_file, idxFile) => ({ asset_id: _file.id, url: _file.source, type: 1, position: idxFile })),
                                }
                            }),
                        }
                    })


                    //
                    if (newvariants.length > 0) {
                        let validVariant = validatePriceVariant(newvariants)
                        if (!!validVariant) {
                            if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                                errorMess = errorMess.concat({
                                    key: _index,
                                    title: [formatMessage({ defaultMessage: 'Khoảng giá chênh lệch giữa các phân loại không được vượt quá 5 lần' })]
                                })
                            } else {
                                errorMess = errorMess.map(_error => {
                                    if (_error?.key == _index) {
                                        return {
                                            ..._error,
                                            title: _error.title.concat(formatMessage({ defaultMessage: 'Khoảng giá chênh lệch giữa các phân loại không được vượt quá 5 lần' }))
                                        }
                                    }
                                    return _error;
                                })
                            }
                            error = true;
                        } else {
                            // setErrorMessage([])
                        }
                    }

                    if (_product.productVideFiles.some(__ => !!__.isUploading)) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Hình ảnh/Video đang tải lên. Xin vui lòng thử lại sau.' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }

                    if (_product.productVideFiles.some(__ => !!__.isUploadError)) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Video tải lên không thỏa mãn. Xin vui lòng tải lại video.' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Video tải lên không thỏa mãn. Xin vui lòng tải lại video.' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }

                    let product_images = _product.productFiles.map((_file, _idxFile) => ({
                        asset_id: _file.id, url: _file.merged_image_url || _file.source,
                        origin_image_url: _file.source, template_image_url: _file.template_image_url,
                        type: 1, position: _idxFile
                    }));
                    let product_videos = _product.productVideFiles.map((_file, _idxFile) => ({ asset_id: _file.id, url: _file.source, type: 2, position: _idxFile }));

                    if (product_images?.length == 0) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Vui lòng cập nhật ít nhất 1 ảnh sản phẩm' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Vui lòng cập nhật ít nhất 1 ảnh sản phẩm' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }


                    let categorySelected = _product?.category[_product?.category?.length - 1]

                    if (
                        !!_product.productSizeChart && !!_product.productSizeChart.id
                        && (!!categorySelected?.support_size_chart || (_product.channel.connector_channel_code == 'tiktok' && categorySelected?.size_chart_required))
                        && (_product.channel.connector_channel_code == 'shopee' || _product.channel.connector_channel_code == 'tiktok')) {
                        product_images.push({
                            asset_id: _product.productSizeChart.id, url: _product.productSizeChart.merged_image_url || _product.productSizeChart.source,
                            origin_image_url: _product.productSizeChart.source, template_image_url: _product.productSizeChart.template_image_url,
                            type: 3, position: product_images.length
                        })
                    }

                    if (!!_product.productImageOrigin && !!_product.productImageOrigin.id) {
                        product_images.push({
                            asset_id: _product.productImageOrigin.id, url: _product.productImageOrigin.merged_image_url || _product.productImageOrigin.source,
                            origin_image_url: _product.productImageOrigin.source, template_image_url: _product.productImageOrigin.template_image_url,
                            type: 4, position: product_images.length
                        })
                    }

                    if (_product.channel.connector_channel_code == 'tiktok' && categorySelected?.size_chart_required && !_product.productSizeChart) {
                        if (errorMess?.length == 0 || !errorMess.some(_error => _error?.key == _index)) {
                            errorMess = errorMess.concat({
                                key: _index,
                                title: [formatMessage({ defaultMessage: 'Vui lòng nhập bảng quy đổi kích cỡ' })]
                            })
                        } else {
                            errorMess = errorMess.map(_error => {
                                if (_error?.key == _index) {
                                    return {
                                        ..._error,
                                        title: _error.title.concat(formatMessage({ defaultMessage: 'Vui lòng nhập bảng quy đổi kích cỡ' }))
                                    }
                                }
                                return _error;
                            })
                        }
                        error = true;
                    }

                    let description_extend = [];
                    try {
                        if (_product.channel.connector_channel_code == 'shopee') {
                            let rawDes = convertToRaw(values[`description_extend_${_index}`].getCurrentContent());
                            rawDes.blocks.forEach(__ => {
                                if (__.entityRanges.length > 0) {
                                    description_extend.push({
                                        field_type: 'image',
                                        text: __.text,
                                        image_info: {
                                            sme_url: rawDes.entityMap[__.entityRanges[0]?.key]?.data?.src
                                        }
                                    })
                                } else {
                                    let last = description_extend[description_extend.length - 1]
                                    if (!!last && last.field_type == 'text') {
                                        last.text = `${last.text}\n${__.text}`
                                    } else {
                                        description_extend.push({
                                            field_type: 'text',
                                            text: __.text
                                        })
                                    }
                                }
                            })

                            if (description_extend.length == 0 || (description_extend.length == 1 && description_extend[0].field_type == 'text' && description_extend[0].text.trim().length == 0)) {
                                description_extend = [{
                                    field_type: 'text',
                                    text: values[`description_${_index}`] || ""
                                }]
                            }
                        }
                    } catch (error) {
                        description_extend.push({
                            field_type: 'text',
                            text: values[`description_${_index}`] || ""
                        })
                    }

                    return {
                        sync_up: isSold ? 2 : 0,
                        info: {
                            name: values[`name_${_index}`],
                            description: values[`description_${_index}`] || null,
                            brand_id: parseInt(_product.brand.value),
                            category_id: categorySelected.id,
                            // description_html: values[`description_html_${_index}`],
                            description_html: descriptionhtml[_index],
                            short_description: values[`description_short_${_index}`],
                            description_extend,
                            sku: values[`sku_${_index}`],
                            is_cod_open: values[`is_cod_open_${_index}`] ? 1 : 0,
                            stock_on_hand: totalStockOnHandVariant,
                            price: values[`price_${_index}`] || null,
                            ...(values[`type_video_${_index}`] === 'url' || _product.channel.connector_channel_code != 'lazada' ? {
                                video: _product.form.video_url || undefined,
                            } : {
                                video: undefined,
                            })
                        },
                        is_valid_logistic: 1,
                        logistics: {
                            package_height: _product.channel.connector_channel_code != 'lazada' ? Math.round(values[`height_${_index}`]) : values[`height_${_index}`],
                            package_length: _product.channel.connector_channel_code != 'lazada' ? Math.round(values[`length_${_index}`]) : values[`length_${_index}`],
                            package_width: _product.channel.connector_channel_code != 'lazada' ? Math.round(values[`width_${_index}`]) : values[`width_${_index}`],
                            package_weight: _product.channel.connector_channel_code != 'lazada' ? Math.round(values[`weight_${_index}`]) : values[`weight_${_index}`],
                        },
                        product_images: product_images.length > 0 ? product_images : null,
                        ...(values[`type_video_${_index}`] === 'video' || _product.channel.connector_channel_code != 'lazada' ? {
                            product_videos: product_videos.length > 0 ? product_videos : null,
                        } : {
                            product_videos: null,
                        }),
                        sme_product_id: _product.raw.id,
                        store_id: _product.channel.value,
                        variants: newvariants,
                        variant_attributes: variant_attributes.length > 0 ? variant_attributes : null,
                        product_attributes: _product.productAttributesSelected.length > 0 ? _product.productAttributesSelected : null,
                        ref_logistic_channel_id: _product.logisticChannels
                    }
                })
                .filter(_product => Boolean(_product));

            if (error) {
                let uniqErrorMess = errorMess.map(_err => ({
                    ..._err,
                    title: _.uniq(_err.title)
                }))
                console.log({ uniqErrorMess })
                setErrorMessage(uniqErrorMess);
                return
            }

            console.log({ productPayload });

            let { data, errors } = await createProducts({
                variables: {
                    list_sc_product_data: productPayload,
                }
            })
            if (!!data) {
                if (isSold) {
                    history.push(`/product-stores/list?channel=${products[0].channel.connector_channel_code}`)
                } else {
                    history.push(`/product-stores/draf?channel=${products[0].channel.connector_channel_code}`)
                }
            } else {
                if (!!errors) {
                    addToast(errors[0].message, { appearance: 'error' });
                    // setErrorMessage(errors[0].message)
                }
            }
        }, [products, productRemoveIndex]
    );

    return (
        <>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    setFieldValue,
                    setFieldError,
                    validateForm,
                    ...rest
                }) => {
                    const changed = values['__changed__']
                    return (
                        <>
                            <RouterPrompt
                                when={changed}
                                title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <PopupConfirm
                                show={indexPopupConfirm >= 0}
                                onHide={() => setIndexPopupConfirm(-1)}
                                onConfirm={e => {
                                    e.preventDefault();

                                    if (productRemoveIndex.length == products.length - 1) {
                                        return history.push(`/products/list`);
                                    }

                                    setProductRemoveIndex(prev => [...prev, indexPopupConfirm]);
                                    setIndexPopupConfirm(-1);
                                }}
                            />
                            <Form>
                                <Card>
                                    {/* <div ref={optionsRef}></div> */}
                                    <TableProduct
                                        errorMessage={errorMessage}
                                        property={property}
                                        setIndexShowShippingPopup={setIndexShowShippingPopup}
                                        setIndexShowImgPopup={setIndexShowImgPopup}
                                        setIndexShowTextField={setIndexShowTextField}
                                        setCurrentChannel={setCurrentChannel}
                                        productRemoveIndex={productRemoveIndex}
                                        onShowConfirmPopup={(index) => setIndexPopupConfirm(index)}
                                    // values={values}
                                    />
                                    {/* <div ref={containerRef}></div> */}
                                    <div
                                        // className={`form-group mr-8 mb-8 text-right ${renderCssButton}`}
                                        className={`form-group mr-8 mb-8 text-right group-button-fixed-bottom`}
                                        style={{ marginTop: 20 }}
                                    >
                                        <button
                                            type="button"
                                            className="btn btn-light btn-elevate"
                                            style={{ width: 150 }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                history.push('/products/list')
                                            }}
                                        >
                                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Huỷ bỏ' })}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary ml-3"
                                            style={{ width: 150 }}
                                            disabled={false}
                                            onClick={async e => {
                                                e.preventDefault();
                                                setFieldValue('__changed__', false)
                                                setErrorMessage([]);
                                                let error = await validateForm(values)

                                                onSave(values, error, handleSubmit, false, setFieldError);
                                            }}
                                        >
                                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Lưu' })}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary ml-3"
                                            style={{ width: 150 }}
                                            disabled={false}
                                            onClick={async e => {
                                                e.preventDefault();
                                                setFieldValue('__changed__', false)
                                                setErrorMessage([]);
                                                let error = await validateForm(values);

                                                onSave(values, error, handleSubmit, true, setFieldError)
                                            }}
                                        >
                                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Lưu & Đăng bán' })}</span>
                                        </button>
                                    </div>
                                </Card>

                                <ShippingDialog
                                    isShow={indexShowShippingPopup >= 0}
                                    indexShipping={indexShowShippingPopup}
                                    onHide={() => setIndexShowShippingPopup(-1)}
                                    channel={currentChannel}
                                />
                                <Modal
                                    // show={true}
                                    show={indexShowImgPopup >= 0}
                                    aria-labelledby="example-modal-sizes-title-lg"
                                    centered
                                    backdrop={'true'}
                                    dialogClassName=''
                                    onHide={() => setIndexShowImgPopup(-1)}
                                    size='xl'
                                >
                                    <ImageDialog
                                        index={indexShowImgPopup}
                                        onHide={() => setIndexShowImgPopup(-1)}
                                        setFieldValue={setFieldValue}
                                    />
                                </Modal>
                                <SetCache set={setCacheStep3} />
                            </Form>
                        </>
                    )
                }}
            </Formik>

            <LoadingDialog show={loading} />
        </>
    )
})