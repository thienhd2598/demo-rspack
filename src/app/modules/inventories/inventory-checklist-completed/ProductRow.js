import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useCallback, Fragment } from 'react';

import { Link, useHistory, useLocation } from 'react-router-dom';
import InfoProduct from '../../../../components/InfoProduct';
import { formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { TextArea, InputVerticalWithIncrease } from '../../../../_metronic/_partials/controls';
import { useIntl } from "react-intl";

const InventoryChecklistRow = ({ product, deleteProduct }) => {
    const { values } = useFormikContext()
    const { formatMessage } = useIntl()
    let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;
    console.log('product', product)
    const imgAssets = useMemo(() => {
        if (!!product?.variant?.sme_catalog_product_variant_assets[0] && product?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
            return product?.variant?.sme_catalog_product_variant_assets[0]
        }
        return null //product?.product?.sme_catalog_product_assets[0]
    }, [product])


    const _attributes = useMemo(() => {

        let attributes = [];
        if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
            for (let index = 0; index < product?.variant?.attributes.length; index++) {
                const element = product?.variant?.attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }, [product])


    const _lechText = useMemo(() => {
        if (values[`stock-${product.id}-qty`] == undefined)
            return <td className='text-center'>--</td>
        if (values[`stock-${product.id}-qty`] > product.stock_actual)
            return <td className='text-center' style={{ color: '#0ADC70', fontWeight: 'bold' }} >{`+${formatNumberToCurrency(values[`stock-${product.id}-qty`] - product.stock_actual)}`.slice(0, 8)}{`+${values[`stock-${product.id}-qty`] - product.stock_actual}`.length > 7 ? "..." : ''}</td>
        if (values[`stock-${product.id}-qty`] < product.stock_actual)
            return <td className='text-center' style={{ color: '#FF2A2D', fontWeight: 'bold' }} >{`${formatNumberToCurrency(values[`stock-${product.id}-qty`] - product.stock_actual)}`.slice(0, 8)}{`${values[`stock-${product.id}-qty`] - product.stock_actual}`.length > 7 ? "..." : ''}</td>
        return <td className='text-center' style={{ fontWeight: 'bold' }}>0</td>
    }, [product, values[`stock-${product.id}-qty`]])


    return (
        <Fragment>
            <tr>
                <td>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        <Link to={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`} target="_blank">
                            <div style={{
                                backgroundColor: '#F7F7FA',
                                width: 80, height: 80,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 80
                            }} className='mr-6' >
                                {
                                    !!imgAssets && <img src={imgAssets?.asset_url}
                                        style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                }
                            </div>
                        </Link>
                        <div>
                            <InfoProduct
                                name={product.variant?.sme_catalog_product?.name}
                                sku={product.variant?.sku}
                                url={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`}
                            />

                            {!!_attributes && <p className='font-weight-normal mb-2 text-secondary-custom fs-12' >{_attributes}</p>}
                        </div>
                    </div>
                </td>
                <td className='text-center'>{product?.variant?.unit || '--'}</td>
                <td className='text-center'>{product.stock_actual}</td>
                <td >
                    <Field
                        name={`stock-${product.id}-qty`}
                        component={InputVerticalWithIncrease}
                        label={''}
                        required={false}
                        customFeedbackLabel={' '}
                        cols={['', 'col-12']}
                        countChar
                        maxChar={'255'}
                        rows={4}
                        disabled={true}
                    />
                </td>
                {_lechText}
                <td>
                    <Field
                        name={`stock-${product.id}-note`}
                        component={TextArea}
                        placeholder={formatMessage({ defaultMessage: "Nhập ghi chú" })}
                        label={''}
                        required={false}
                        customFeedbackLabel={' '}
                        cols={['', 'col-12']}
                        countChar
                        maxChar={'255'}
                        rows={4}
                        disabled={true}
                    />
                </td>
            </tr>
            {(product?.status == 'error') && <tr>
                <td colSpan={7} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)', }}>
                    <div style={{
                        paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }} >
                        <span style={{ wordBreak: 'break-all' }}>Kiểm kho lỗi: {product?.error_message}</span>
                    </div>
                </td>
            </tr>}
        </Fragment>
    )
};

export default memo(InventoryChecklistRow);