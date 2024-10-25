/*
 * Created by duydatpham@gmail.com on 09/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client';
import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useState } from 'react'
import { Accordion, useAccordionToggle } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl';
import { CardBody, DatePickerField, Input } from '../../../../_metronic/_partials/controls'
import { InputDate } from '../../../../_metronic/_partials/controls/forms/InputDate';
import { ReSelect } from '../../../../_metronic/_partials/controls/forms/ReSelect';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers'
import Property from './Property';
import { useIntl } from 'react-intl';

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

export default memo(({ properties, brand, loading, isShowAll }) => {
    const { formatMessage } = useIntl();
    const { values, } = useFormikContext()

    const propertiesRequires = useMemo(() => {
        if (isShowAll)
            return properties
        return properties.filter(_property => _property.is_mandatory) || [];
    }, [properties, isShowAll])
    const propertiesNotRequires = useMemo(() => {
        if (isShowAll) return []
        return properties.filter(_property => !_property.is_mandatory) || [];
    }, [properties, isShowAll])    

    if (loading) {
        return <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
            <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
        </div>
    }

    return <>
        <div className="row" >
            {
                propertiesRequires.map((_property, index) => {
                    let name = `property-${_property.id}`

                    return <Property key={name} property={_property} name={name} />
                })
            }
        </div>
        {
            propertiesNotRequires.length > 0 && <Accordion >
                <CustomToggle eventKey="0">
                    {formatMessage({ defaultMessage: 'Thuộc tính mở rộng' })}
                </CustomToggle>
                <Accordion.Collapse eventKey="0">
                    <div className="mt-6 row" >
                        {
                            propertiesNotRequires.map((_property, index) => {
                                let name = `property-${_property.id}`
                                return <Property key={name} property={_property} name={name} />
                            })
                        }
                    </div>
                </Accordion.Collapse>
            </Accordion>
        }
    </>
})