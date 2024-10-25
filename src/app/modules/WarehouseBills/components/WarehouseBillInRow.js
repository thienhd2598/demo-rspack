import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useCallback, Fragment } from 'react';

import { Link, useHistory, useLocation } from 'react-router-dom';
import InfoProduct from '../../../../components/InfoProduct';
import { formatNumberToCurrency } from '../../../../utils';
import { TextArea, InputVerticalWithIncrease } from '../../../../_metronic/_partials/controls';
import { useIntl } from "react-intl";

const WarehouseBillInRow = ({ _wareHouseBill, setDataCombo }) => {
    const { values } = useFormikContext()
    const { formatMessage } = useIntl()
    const linkProduct = () => {
        if (_wareHouseBill?.variant?.is_combo == 1) {
            return `/products/edit-combo/${_wareHouseBill?.variant?.product_id}`
        }
        if (_wareHouseBill?.variant?.attributes?.length > 0) {
            return `/products/stocks/detail/${_wareHouseBill?.variant_id}`
        } else {
            return `/products/edit/${_wareHouseBill?.variant?.product_id}`
        }
    }


    const _lechText = useMemo(() => {
        if (values[`${_wareHouseBill?.id}-quantity`] == undefined)
            return <td className='text-center'>--</td>
        if (values[`${_wareHouseBill?.id}-quantity`] > _wareHouseBill?.quantity_plan)
            return <td className='text-center' style={{ color: '#0ADC70', fontWeight: 'bold' }} >{`+${formatNumberToCurrency(values[`${_wareHouseBill?.id}-quantity`] - _wareHouseBill?.quantity_plan)}`.slice(0, 8)}{`+${values[`${_wareHouseBill?.id}-quantity`] - _wareHouseBill?.quantity_plan}`.length > 7 ? "..." : ''}</td>
        if (values[`${_wareHouseBill?.id}-quantity`] < _wareHouseBill?.quantity_plan)
            return <td className='text-center' style={{ color: '#FF2A2D', fontWeight: 'bold' }} >{`${formatNumberToCurrency(values[`${_wareHouseBill?.id}-quantity`] - _wareHouseBill?.quantity_plan)}`.slice(0, 8)}{`${values[`${_wareHouseBill?.id}-quantity`] - _wareHouseBill?.quantity_plan}`.length > 7 ? "..." : ''}</td>
        return <td className='text-center' style={{ fontWeight: 'bold' }}>0</td>
    }, [_wareHouseBill, values[`${_wareHouseBill?.id}-quantity`]])


    return (
        <Fragment>
            <tr key={`warehouse-bill-item-${_wareHouseBill?.id}`} style={{ borderBottom: '1px solid #D9D9D9' }}>
                <td>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        <Link to={linkProduct()} target="_blank">
                            <div style={{
                                backgroundColor: '#F7F7FA',
                                width: 80, height: 80,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 80
                            }} className='mr-6' >
                                {
                                    !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                        style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                }
                            </div>
                        </Link>
                        <div>
                            <InfoProduct
                                name={_wareHouseBill?.variant?.sme_catalog_product?.name}
                                sku={_wareHouseBill?.variant?.sku}
                                setDataCombo={setDataCombo}
                                combo_items={_wareHouseBill?.variant?.combo_items}
                                url={linkProduct()}
                            />

                            {
                                !!_wareHouseBill?.variant?.attributes?.length > 0 && <p className='text-secondary-custom mt-2'>
                                    {_wareHouseBill?.variant?.name?.replaceAll(' + ', ' - ')}
                                </p>
                            }
                        </div>
                    </div>
                </td>
                <td className="text-center">{_wareHouseBill?.variant?.unit || '--'}</td>
                <td className="text-center">
                    {formatNumberToCurrency(_wareHouseBill?.quantity_plan)}
                </td>
                
                <td className="text-center">
                    <Field 
                        name={`${_wareHouseBill?.id}-quantity`}
                        component={InputVerticalWithIncrease}
                        label={''}
                        required={false}
                        customFeedbackLabel={' '}
                        cols={['', 'col-12']}
                        setValueZero={true}
                        rows={4}
                    />
                </td>
                {_lechText}
                <td className="text-center">
                    <Field
                        name={`${_wareHouseBill?.id}-note`}
                        component={TextArea}
                        placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                        required={false}
                        customFeedbackLabel={' '}
                        cols={['', 'col-12']}
                        countChar
                        rows={4}
                        maxChar={'255'}
                    />
                </td>
            </tr>
        </Fragment>
    )
};

export default memo(WarehouseBillInRow);