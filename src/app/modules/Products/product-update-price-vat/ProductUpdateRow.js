import React, { useMemo, useCallback, Fragment, memo } from 'react';
import { Field, useFormikContext } from "formik";
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { InputVertical } from '../../../../_metronic/_partials/controls';

const ProductUpdateRow = ({ product, key, onRemoveProduct, disabledAction, setDataCombo }) => {
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();

    const renderInforVariant = (variant) => {
        return (
            <Fragment>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <div className="d-flex flex-column">
                        <div className='mb-1'>
                            <InfoProduct
                                name={''}
                                sku={variant?.sku}
                            />
                        </div>
                        {variant?.attributes?.length > 0 && (
                            <span className='text-secondary-custom fs-12'>
                                {variant?.name?.replaceAll(' + ', ' - ')}
                            </span>
                        )}
                    </div>
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <div className="d-flex flex-column align-items-end">
                        <Field
                            name={`variant-${product?.id}-${variant?.id}-price`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập giá bán' })}
                            label={""}
                            type="number"
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />
                    </div>
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <div className="d-flex justify-content-end align-items-start">
                        <Field
                            name={`variant-${product?.id}-${variant?.id}-priceMinimum`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập giá bán tối thiểu' })}
                            label={""}
                            type="number"
                            nameTxt={"--"}
                            required
                            customFeedbackLabel={' '}
                            addOnRight={'đ'}
                        />
                    </div>
                </td>
            </Fragment >
        )
    }

    return (
        <>
            <tr
                key={key}
                style={{ borderBottom: '1px solid #D9D9D9' }}
            >
                <td style={{ verticalAlign: 'top' }} rowSpan={product?.sme_catalog_product_variants?.length}>
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
                                window.open(`/products/edit/${product.id}`, '_blank')
                            }}
                        >
                            <img
                                src={product?.imgAssets?.asset_url || ""}
                                style={{ width: 60, height: 60, objectFit: 'contain' }}
                            />
                        </div>
                        <div className="w-100 d-flex align-items-start">
                            <InfoProduct
                                name={product?.name}
                                sku={product?.sku}
                                url={`/products/edit/${product?.id}`}
                            />
                            {!!product?.is_combo && (
                                <span
                                    onClick={() =>
                                        setDataCombo(product?.combo_items)
                                    }
                                    className="text-primary cursor-pointer ml-2"
                                >
                                    Combo
                                </span>
                            )}
                        </div>
                    </div>
                </td>
                {renderInforVariant(product?.sme_catalog_product_variants?.[0])}
                <td rowSpan={product?.sme_catalog_product_variants?.length} className="text-center" style={{ verticalAlign: 'top' }}>
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
            </tr>
            {product?.sme_catalog_product_variants?.slice(1, product?.sme_catalog_product_variants?.length)?.map(
                _variant => <tr>
                    {renderInforVariant(_variant)}
                </tr>
            )}
        </>
    )
};

export default memo(ProductUpdateRow);