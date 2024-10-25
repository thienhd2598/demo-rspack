import React, { memo, useCallback, useMemo, useState } from "react";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { FastField, useFormikContext } from "formik";
import { InputVertical } from '../../../../components/InputProductMultiple';
import InfoProduct from "../../../../components/InfoProduct";
import { useIntl } from 'react-intl';

const ProductCreateMultipleRow = ({ product, key, onRemoveVariant, variants, variantAttributes, onRemoveProduct, isDelete = true, disabledAction = false }) => {
    const { formatMessage } = useIntl();
    const { setFieldValue } = useFormikContext();
    const assetImage = useMemo(
        () => {
            try {
                let imgOrigin = (product?.productAssets || []).find(_asset => _asset.type == 4)
                return !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (product?.productAssets || []).filter(_asset => _asset.type == 1)[0];
            } catch (error) {
                return null;
            }
        }, [product]
    );

    const renderInforVariant = useCallback(
        (variant) => {
            return (
                <>
                    <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                        <div className="d-flex flex-column">
                            <span className='mb-1'>
                                <InfoProduct
                                    name={''}
                                    short={true}
                                    sku={variant?.sku}
                                    url={`#`}
                                />
                            </span>                            
                            {product?.variantAttributeValues?.length > 0 && (
                                <span className='text-secondary-custom fs-12'>
                                    {variant?.name?.replaceAll(' + ', ' - ')}
                                </span>
                            )}
                        </div>
                    </td>
                    <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                        <div className="d-flex flex-column">
                            <span className="d-flex align-items-start mb-2">
                                <span style={{ minWidth: 55 }}>{formatMessage({ defaultMessage: 'Giá bán' })}:</span>
                                <FastField
                                    name={`variant-${product?.id}-${variant?.codes}-price`}
                                    component={InputVertical}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập giá bán' })}
                                    label={""}
                                    type="number"
                                    nameTxt={"--"}
                                    required
                                    customFeedbackLabel={' '}
                                    addOnRight={'đ'}
                                />
                            </span>
                            <span className="d-flex align-items-start">
                                <span style={{ minWidth: 55 }}>{formatMessage({ defaultMessage: 'Giá vốn' })}:</span>
                                <FastField
                                    name={`variant-${product?.id}-${variant?.codes}-costPrice`}
                                    component={InputVertical}
                                    placeholder={formatMessage({ defaultMessage: 'Nhập giá vốn' })}
                                    label={""}
                                    type="number"
                                    nameTxt={"--"}
                                    required
                                    customFeedbackLabel={' '}
                                    addOnRight={'đ'}
                                />
                            </span>
                        </div>
                    </td>
                    {/* <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                        <span className="d-flex align-items-start">
                            <span style={{ minWidth: 55 }}>{formatMessage({ defaultMessage: 'Tồn đầu' })}:</span>
                            <FastField
                                
                                name={`variant-${product?.id}-${variant?.codes}-stockOnHand`}
                                component={InputVertical}
                                placeholder={formatMessage({ defaultMessage: 'Nhập tồn đầu' })}
                                label={""}
                                type="number"
                                isFieldStock
                                nameTxt={""}
                                required
                                customFeedbackLabel={' '}
                                addOnRight={''}
                            />
                        </span>
                    </td> */}
                </>
            )
        }, [product]
    );

    return (
        <>

            <tr
                key={key}
                style={{ borderBottom: '1px solid #D9D9D9' }}
            >
                <td style={{ verticalAlign: 'top' }} rowSpan={variants?.length}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                backgroundColor: '#F7F7FA',
                                width: 50, height: 50,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 50
                            }}
                            className='mr-6 cursor-pointer'
                            onClick={e => {
                                e.preventDefault();
                                window.open(`/product-stores/edit/${product.id}`, '_blank')
                            }}
                        >
                            {
                                !!assetImage && <img src={assetImage?.sme_url}
                                    style={{ width: 50, height: 50, objectFit: 'contain' }} />
                            }
                        </div>
                        <div className="d-flex flex-column">
                            <InfoProduct
                                short={true}
                                name={product?.name}
                                sku={product?.sku}
                                url={`/product-stores/edit/${product.id}`}
                            />
                        </div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }} rowSpan={variants?.length}>
                    <div className="d-flex flex-column">
                        {variantAttributes?.length == 0 && <span style={{ fontSize: 20 }}>--</span>}
                        {variantAttributes?.map(_variantAttribute => {
                            const enableAction = _variantAttribute?.values?.length > 1;
                            return (
                                <div className="mb-4">
                                    <div className="pb-1 mb-4 " style={{ borderBottom: '1px solid #D9D9D9' }}>
                                        <span >
                                            {_variantAttribute?.name}
                                        </span>
                                    </div>
                                    {_variantAttribute?.values?.map(_value => (
                                        <div className="d-flex justify-content-between align-items-center mb-2 ml-4">
                                            <span>{_value?.value}</span>
                                            <span
                                                className={`text-danger`}
                                                style={{ cursor: enableAction ? 'pointer' : 'not-allowed' }}
                                                onClick={() => {
                                                    if (!enableAction) return;

                                                    setFieldValue('__changed__', true);
                                                    onRemoveVariant(_variantAttribute?.id, _value?.code)
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                                                </svg>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </td>
                {renderInforVariant(variants[0])}
                {isDelete && (
                    <td rowSpan={variants?.length} className="text-center" style={{ verticalAlign: 'top' }}>
                        <i
                            class="fas fa-trash-alt"
                            style={{ color: 'red', cursor: disabledAction ? 'not-allowed' : 'pointer' }}
                            onClick={() => {
                                if (disabledAction) return;

                                setFieldValue('__changed__', true);
                                onRemoveProduct(product?.id);
                            }}
                        />
                    </td>
                )}
            </tr>
            {variants?.slice(1, variants?.length)?.map(
                _variant => <tr>
                    {renderInforVariant(_variant)}
                </tr>
            )}
        </>
    )
}

export default memo(ProductCreateMultipleRow);