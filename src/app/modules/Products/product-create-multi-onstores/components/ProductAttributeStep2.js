/*
 * Created by duydatpham@gmail.com on 04/03/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import { useQuery } from "@apollo/client";
import { useFormik, useFormikContext } from "formik";
import { useCreateMultiContext } from '../CreateMultiContext';
import React, { memo, useCallback, useMemo, useState } from "react";
import { Accordion, useAccordionToggle } from "react-bootstrap";
import { ATTRIBUTE_VALUE_TYPE } from "../../../../../constants";
import query_scGetAttributeByCategory from "../../../../../graphql/query_scGetAttributeByCategory";
import Property from "../../../ProductsStore/product-channel/Property";
import { Switch } from '../../../../../_metronic/_partials/controls/forms/Switch';
import { Field } from "formik";
import { useIntl } from "react-intl";

function CustomToggle({ children, eventKey }) {
    const [isOpen, setIsOpen] = useState(false)
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setIsOpen(!isOpen)
    });

    return (
        <a className="btn btn-link-success font-weight-bold"
            style={{ color: '#000000D9' }}
            onClick={decoratedOnClick}
        >{children} <i className={isOpen ? 'fas fa-angle-down ml-2' : 'fas fa-angle-right ml-2'} style={{ color: '#000000D9' }} > </i></a>
    );
}


export default memo(({ category, index, updateAttribute, connectorChannelCode, storeId }) => {
    const { setFieldValue } = useFormikContext();
    const { formatMessage } = useIntl()
    const { data: dataAttributes, loading: loadingAttribute } = useQuery(query_scGetAttributeByCategory, {
        variables: {
            category_id: category?.id,
            sc_store_id: storeId
        },
        // fetchPolicy: 'cache-and-network'
    })
    const [attributesRequired, attributesNotRequired, warranties] = useMemo(() => {
        if (!!dataAttributes) {
            let _attributes = (dataAttributes?.scGetAttributeByCategory || [])
                .filter(_op => {
                    if (connectorChannelCode == 'shopee') return _op.attribute_type != 1;
                    return ((_op.attribute_type == 1 && _op.is_sale_prop == 0) || _op.attribute_type != 1) && !((_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT || _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) && (_op.attribute_options || []).length == 0)
                })
                .map(_op => {
                    // let unit = !!_op.unit_options && _op.unit_options.length == 1 ? _op.unit_options[0] : null
                    let options = _op.attribute_options;
                    let unit_options = _op.unit_options;
                    if (_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT
                        || _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT
                    ) {
                        unit_options = [];
                    }

                    return { ..._op, options, unit_options }
                });

            let _warranties = _attributes.filter(_att => _att.attribute_type == 2)
            _warranties.sort((_w1, _w2) => -(_w1.is_mandatory || 0) + (_w2.is_mandatory || 0))

            let _attributesRequired = _attributes.filter(_att => _att.attribute_type != 2).filter(_property => _property.is_mandatory)
            let _attributesNotRequired = _attributes.filter(_att => _att.attribute_type != 2).filter(_property => !_property.is_mandatory)

            console.log('_attributes', _attributes.filter(_att => _att.attribute_type != 2), _warranties)
            updateAttribute(index, { productAttributes: _attributes })
            return [_attributesRequired, _attributesNotRequired, _warranties];
        }
        return [[], [], []]
    }, [dataAttributes, index, connectorChannelCode])

    const _onChanged = useCallback(() => {
        setFieldValue('__changed__', true);
        setFieldValue(`${category?.id}::changed`, `${index}::ngành hàng-${Date.now()}`)
    }, [category, index])

    return <div>
        {
            loadingAttribute && <div className='text-center w-100 mt-4' >
                <span className="ml-3 spinner spinner-primary"></span>
            </div>
        }
        <div className="row" >
            {
                attributesRequired.map((_property) => {
                    let name = `${index}-property-${_property.id}`

                    return <Property key={name} property={_property} name={name} onChanged={_onChanged} />
                })
            }
        </div>
        {
            attributesNotRequired.length > 0 && <Accordion >
                <CustomToggle eventKey="0">
                    {formatMessage({ defaultMessage: 'Thuộc tính mở rộng' })}
                </CustomToggle>
                <Accordion.Collapse eventKey="0">
                    <div className="mt-6 row" >
                        {
                            attributesNotRequired.map((_property) => {
                                let name = `${index}-property-${_property.id}`
                                return <Property key={name} property={_property} name={name} onChanged={_onChanged} connectorChannelCode={connectorChannelCode} />
                            })
                        }
                    </div>
                </Accordion.Collapse>
            </Accordion>
        }

        {
            warranties.length > 0 && <>
                <p className='font-weight-bold mt-8' >{formatMessage({ defaultMessage: 'Chế độ bảo hành' })}</p>
                {
                    warranties.map((_property) => {
                        let name = `${index}-property-${_property.id}`

                        return <Property key={name} property={_property} name={name} onChanged={_onChanged} connectorChannelCode={connectorChannelCode} />
                    })
                }
            </>
        }
        {
            connectorChannelCode == 'tiktok' && <div style={{ display: 'flex', alignItems: 'center' }} >
                <span style={{ marginRight: 16 }} >{formatMessage({ defaultMessage: 'Thanh toán khi nhận hàng' })}</span>
                <Field
                    name={`is_cod_open_${index}`}
                    component={Switch}
                    placeholder=""
                    label={""}
                />
            </div>
        }
    </div>
})