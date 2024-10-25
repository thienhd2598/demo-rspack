
/*
 * Created by duydatpham@gmail.com on 21/07/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { useMemo, useRef, useState } from "react";
import { useField, useFormikContext } from "formik";

import Select from 'react-select'
import { Button } from "react-bootstrap";
import { FieldFeedbackLabel } from "../_metronic/_partials/controls";

import AsyncPaginate from 'react-select-async-paginate';
import { createApolloClientSSR } from "../apollo";
import { useIntl } from "react-intl";
import query_sme_catalog_product_for_create from "../graphql/query_sme_catalog_product_for_create";
let client = createApolloClientSSR()

async function loadOptions(search = "", loadedOptions, { page }, storeId) {
    let { data } = await client.query({
        query: query_sme_catalog_product_for_create,
        variables: {
            where: {
                _or: [
                    { name: { _ilike: `%${search.trim()}%` } }, 
                    { sme_catalog_product_variants: { sku: { _ilike: `%${search.trim()}%` } } }
                ],
            },
            limit: 20,
            offset: (page - 1) * 20,
            order_by: { updated_at: 'desc_nulls_last' }
        },
        fetchPolicy: 'no-cache'
    })
    return {
        options: data?.sme_catalog_product?.map(_product => {
            return {
                value: _product.id,
                label: `${_product.name} - ${_product.sku || ''} - Tồn kho: ${_product.stock_on_hand || 0}`,
                raw: _product,
                // isDisabled: !!storeId && _product.scProduct?.some(_store => _store.store_id == storeId)
            }
        }),
        hasMore: data?.sme_catalog_product?.length == 20,
        additional: {
            page: page + 1,
        },
    };
}

const Menu = props => {
    const shadow = 'hsla(218, 50%, 10%, 0.1)';
    return (
        <div
            style={{
                backgroundColor: 'white',
                borderRadius: 4,
                boxShadow: `0 0 0 1px ${shadow}, 0 4px 11px ${shadow}`,
                marginTop: 8,
                position: 'absolute',
                zIndex: 2,
                width: '100%'
            }}
            {...props}
        />
    );
};
const Blanket = props => (
    <div
        style={{
            bottom: 0,
            left: 0,
            top: 0,
            right: 0,
            position: 'fixed',
            zIndex: 1,
        }}
        {...props}
    />
);
const Dropdown = ({ children, isOpen, target, onClose }) => (
    <div style={{ position: 'relative' }}>
        {target}
        {isOpen ? <Menu>{children}</Menu> : null}
        {isOpen ? <Blanket onClick={onClose} /> : null}
    </div>
);
const Svg = p => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        focusable="false"
        role="presentation"
        {...p}
    />
);
const DropdownIndicator = () => (
    <div style={{ color: '#2684FF', height: 24, width: 32 }}>
        <Svg>
            <path
                d="M16.436 15.085l3.94 4.01a1 1 0 0 1-1.425 1.402l-3.938-4.006a7.5 7.5 0 1 1 1.423-1.406zM10.5 16a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"
                fill="currentColor"
                fillRule="evenodd"
            />
        </Svg>
    </div>
);
const selectStyles = {
    control: provided => ({ ...provided, minWidth: 240, margin: 8, borderColor: '#D9D9D9' }),
    menu: () => ({ boxShadow: 'inset 0 1px 0 rgba(0, 0, 0, 0.1)' }),
};

export function ReSelectSmeProduct({ selected, onSelect, storeId }) {
    const [isOpen, setIsOpen] = useState(false)
    const _toggleOpen = () => {
        setIsOpen(prev => !prev)
    };
    const {formatMessage} = useIntl()
    return (<Dropdown
        isOpen={isOpen}
        onClose={_toggleOpen}
        target={
            <input type="text" className={`form-control `} placeholder={formatMessage({defaultMessage:'Nhập tên sản phẩm kho/SKU sản phẩm kho'})}
                value={selected?.label || ''}
                onFocus={_toggleOpen}
                onChange={() => { }}
                // style={{ background: '#F7F7FA', border: errors[field.name] && isTouched ? '1px solid #F5222D' : 'none' }}
                autoComplete='off'
            />
        }
    >
        <AsyncPaginate
            autoFocus
            backspaceRemovesValue={false}
            components={{ DropdownIndicator, IndicatorSeparator: null }}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            isClearable={false}
            menuIsOpen={true}
            styles={selectStyles}
            tabSelectsValue={false}
            onChange={value => {
                _toggleOpen()
                // setFieldValue(field.name, value || undefined)
                // setFieldValue('__changed__', true)
                !!onSelect && onSelect(value)
            }}
            loadOptions={async (inputValue, prevOptions, additional) => loadOptions(inputValue, prevOptions, additional, storeId)}
            openMenuOnFocus
            openMenuOnClick
            // isClearable
            isLoading={false}
            placeholder={formatMessage({defaultMessage:'Tên sản phẩm/SKU'})}
            additional={{
                page: 1,
            }}
            debounceTimeout={300}
            value={selected}
        />
    </Dropdown>
    );
}
