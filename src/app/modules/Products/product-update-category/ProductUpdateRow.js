import React, { useMemo, useCallback, Fragment, memo } from 'react';
import { Field, useFormikContext } from "formik";
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { InputVertical } from '../../../../_metronic/_partials/controls';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

const ProductUpdateRow = ({ product, key, onRemoveProduct, disabledAction, optionsCategory }) => {
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();
    const isSyncVietful = useMemo(() => {
        return product?.sme_catalog_product_variants?.some(
             (variant) => variant.provider_links?.length > 0 && variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg)
           );    
     }, [product])
     console.log(isSyncVietful)
    return (
        <>
            <tr
                key={key}
                style={{ borderBottom: '1px solid #D9D9D9' }}
            >
                <td style={{ verticalAlign: 'top' }}>
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
                                window.open( !!product.is_combo ? `/products/edit-combo/${product.id}` : `/products/edit/${product.id}`, '_blank')
                            }}
                        >
                            <img
                                src={product?.imgAssets?.asset_url || ""}
                                style={{ width: 60, height: 60, objectFit: 'contain' }}
                            />
                        </div>
                        <div className="w-100 d-flex align-items-start">
                            <InfoProduct
                                name={product?.name_seo}
                                sku={product?.sku}
                                url={!!product.is_combo ? `/products/edit-combo/${product.id}` : `/products/edit/${product.id}`}
                            />
                        </div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top', border: 'none', borderBottom: '0.5px solid #cbced4', borderTop: '0.5px solid #cbced4' }}>
                    <div className="d-flex flex-column align-items-center">
                        <Field
                            name={`product-${product?.id}-name`}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập tên sản phẩm kho' })}
                            label={""}
                            nameTxt={"--"}
                            disabled={isSyncVietful}
                            required
                            customFeedbackLabel={' '}
                            countChar
                            minChar={"0"}
                            maxChar={"255"}
                        />
                    </div>
                </td>
                <td 
                    style={{ 
                        verticalAlign: 'top', 
                        border: 'none', 
                        borderBottom: '0.5px solid #cbced4', 
                        borderTop: '0.5px solid #cbced4', 
                        pointerEvents: isSyncVietful ? 'none' : '',
                    }} 
                >
                    <Field
                        name={`product-${product?.id}-category`}
                        component={ReSelectVertical}
                        placeholder={formatMessage({ defaultMessage: 'Chọn danh mục' })}
                        label={""}
                        onChange={(item) => {
                            setFieldValue(`product-${product?.id}-category`, item || null);
                        }}
                        disabled={isSyncVietful}
                        customFeedbackLabel={' '}
                        components={animatedComponents}
                        options={optionsCategory}
                        isClearable={true}
                    />
                    
                </td>
                <td className="text-center" style={{ verticalAlign: 'top' }}>
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
        </>
    )
};

export default memo(ProductUpdateRow);