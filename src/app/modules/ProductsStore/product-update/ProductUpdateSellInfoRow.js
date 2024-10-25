import React, { Fragment, memo, useCallback, useMemo } from 'react';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { FastField, Field, useFormikContext } from "formik";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import _ from 'lodash';

const ProductUpdateSellInfoRow = ({ setIdStore, product, scWarehouses, key, onRemoveProduct, disabledAction = false, setCurrentCodesVariant }) => {
    const { setFieldValue, values, errors } = useFormikContext();
    const { formatMessage } = useIntl();

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
    
    const renderInforVariant = (variant) => {
        const isReverse = !!values[`variant-${product?.id}-${variant?.id}-stockReverse`]
        const hasErrorKey = Object.keys(errors)?.some(key => key.startsWith(`variant-${product?.id}-${variant?.id}`));
        
        return (
            <Fragment>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <div className="d-flex flex-column">
                        <span className='mb-1'>
                            <InfoProduct
                                name={''}
                                sku={variant?.sku}
                                url={`#`}
                            />
                        </span>
                        <span className='text-secondary-custom fs-12'>
                            {product?.variantAttributeValues?.length > 0 ? variant?.name?.replaceAll(' + ', ' - ') : ''}
                        </span>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <span className={`d-flex align-items-start ${(!isReverse && !hasErrorKey) ? "mb-2" : 'mb-6'}`}>
                        <Field
                            name={`variant-${product?.id}-${variant?.id}-price`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: "Nhập giá niêm yết" })}
                            label={""}
                            type="number"
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />
                    </span>
                    {!!values[`variant-${product?.id}-${variant?.id}-disabled`] && (
                        <div className='d-flex justify-content-center align-items-center' style={{ background: '#ffcbbd', height: 30, width: 'calc(300% + 40px)', borderRadius: 2, color: 'red', fontWeight: 500 }}>
                            {formatMessage({ defaultMessage: 'Đã kết nối kho và bật đẩy tồn' })}
                        </div>
                    )}
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <span className={`d-flex align-items-start ${!isReverse ? "mb-2" : 'mb-8'}`}>
                        <Field
                            name={`variant-${product?.id}-${variant?.id}-priceMinimum`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: "Nhập giá bán tối thiểu" })}
                            label={""}
                            type="number"
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />
                    </span>
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    {!!product?.store?.enable_multi_warehouse ? (
                        <div className="d-flex align-items-center justify-content-center">
                            <span className="mr-2">{_.sum(scWarehouses?.map(wh => values[`variant-${product?.id}-${variant?.id}-${wh?.id}-stockOnHand`] || 0))}</span>

                            <i
                                style={{ cursor: !!values[`variant-${product?.id}-${variant?.id}-disabled`] ? 'not-allowed' : 'pointer' }}
                                role="button"
                                className="text-dark far fa-edit"
                                onClick={() => {
                                    if (!!values[`variant-${product?.id}-${variant?.id}-disabled`]) {
                                        return
                                    }
                                    setIdStore(product?.store_id)
                                    setCurrentCodesVariant(`${product?.id}-${variant?.id}`)
                                }}
                            />
                        </div>
                    ) : (
                        <span className="d-flex flex-column align-items-center">
                            <Field
                                name={`variant-${product?.id}-${variant?.id}-stockOnHand`}
                                component={InputVertical}
                                placeholder={formatMessage({ defaultMessage: "Nhập có sẵn" })}
                                label={""}
                                type="number"
                                isFieldStock
                                nameTxt={""}
                                required
                                customFeedbackLabel={' '}
                                addOnRight={''}
                                disabled={values[`variant-${product?.id}-${variant?.id}-disabled`]}
                            />
                            {isReverse && <span>Dự trữ: {values[`variant-${product?.id}-${variant?.id}-stockReverse`]}</span>}
                        </span>
                    )}
                </td>
            </Fragment>
        )
    }

    return (
        <>
            <tr
                key={key}
                style={{ borderBottom: '1px solid #D9D9D9' }}
            >
                <td style={{ verticalAlign: 'top' }} rowSpan={product?.productVariants?.length}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                backgroundColor: '#F7F7FA',
                                width: 60, height: 60,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 60
                            }}
                            className='mr-6 cursor-pointer'
                            onClick={e => {
                                e.preventDefault();
                                window.open(`/product-stores/edit/${product.id}`, '_blank')
                            }}
                        >
                            {
                                !!assetImage && <img src={assetImage?.sme_url}
                                    style={{ width: 60, height: 60, objectFit: 'contain' }} />
                            }
                        </div>
                        <div className="d-flex flex-column">
                            <InfoProduct
                                name={product?.name}
                                sku={product?.sku}
                                url={`/product-stores/edit/${product.id}`}
                            />

                            <span className="d-flex align-items-center" >
                                <img
                                    style={{ width: 20, height: 20 }}
                                    src={product?.store?.logo}
                                    className="mr-2"
                                />
                                <span >{product?.store?.label}</span>
                            </span>
                        </div>
                    </div>
                </td>
                {renderInforVariant(product?.productVariants?.[0])}
                <td rowSpan={product?.productVariants?.length} className="text-center" style={{ verticalAlign: 'top' }}>
                    <i
                        className="fas fa-trash-alt"
                        style={{ color: 'red', cursor: disabledAction ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                            if (disabledAction) return;

                            setFieldValue('__changed__', true);
                            onRemoveProduct(product?.id);
                        }}
                    />
                </td>
            </tr>
            {product?.productVariants?.slice(1, product?.productVariants?.length)?.map(
                _variant => <tr>
                    {renderInforVariant(_variant)}
                </tr>
            )}
        </>
    )
};

export default memo(ProductUpdateSellInfoRow);
