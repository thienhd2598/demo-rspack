/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client';
import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useState } from 'react'
import { Accordion, useAccordionToggle } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl';
import { CardBody, Input } from '../../../../_metronic/_partials/controls'
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import { useIntl } from 'react-intl';
function CustomToggle({ children, eventKey }) {
    const [isOpen, setIsOpen] = useState(false)
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setIsOpen(!isOpen)
    });

    return (
        <a className="btn btn-link-success font-weight-bold"
            onClick={decoratedOnClick}
        >{children} <i className={isOpen ? 'fas fa-angle-down ml-2' : 'fas fa-angle-right ml-2'} > </i></a>
    );
}

export default memo(({ properties, name, brand, graphql }) => {
    const { values, } = useFormikContext()
    const {formatMessage} = useIntl()
    const propertiesRequires = useMemo(() => {
        return properties.filter(_property => _property.is_mandatory) || [];
    }, [properties])
    const propertiesNotRequires = useMemo(() => {
        return properties.filter(_property => !_property.is_mandatory) || [];
    }, [properties])

    return <CardBody >
        <div className="form-group mb-4">
            <h6 style={{fontWeight: 'normal'}} ><FormattedMessage defaultMessage="Thuộc tính sản phẩm của {name}" values={{ name }} /></h6>
        </div>
        {
            propertiesRequires.map((_property, index) => {
                let name = `${brand}-property-${_property.id}`

                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT)
                    return <Field
                        key={name}
                        name={name}
                        component={ReSelect}
                        placeholder=""
                        label={_property.display_name}
                        required
                        customFeedbackLabel={' '}
                        options={_property.options?.map(_op => {
                            return {
                                label: _op.name,
                                value: _op.name,
                            }
                        })}
                    />
                if (_property.input_type == ATTRIBUTE_VALUE_TYPE.TEXT)
                    return <Field
                        key={name}
                        name={name}
                        component={Input}
                        placeholder=""
                        label={_property.display_name}
                        required
                        customFeedbackLabel={' '}
                    />
            })
        }
        {
            propertiesNotRequires.length > 0 && <Accordion >
                <CustomToggle eventKey="0">
                    {formatMessage({defaultMessage: 'Thuộc tính mở rộng'})}
            </CustomToggle>
                <Accordion.Collapse eventKey="0">
                    <div className="mt-6" >
                        {
                            propertiesNotRequires.map((_property, index) => {
                                let name = `${brand}-property-${_property.id}`
                                return <Field
                                    key={`-properties-${brand}-${_property.id}`}
                                    name={name}
                                    component={Input}
                                    placeholder=""
                                    label={_property.display_name}
                                    customFeedbackLabel={' '}
                                />
                            })
                        }
                    </div>
                </Accordion.Collapse>
            </Accordion>
        }
    </CardBody>
})