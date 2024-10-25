
/*
 * Created by duydatpham@gmail.com on 21/07/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { useState } from "react";
import { useIntl } from "react-intl";
import AsyncPaginate from 'react-select-async-paginate';
import { createApolloClientSSR } from "../apollo";
import query_sme_catalog_inventory_items from "../graphql/query_sme_catalog_inventory_items";
import { formatNumberToCurrency } from "../utils";
let client = createApolloClientSSR()

const shadow = 'hsla(218, 50%, 10%, 0.1)';

async function loadOptions(search = "", loadedOptions, { page }, currentScanBy, warehouseSelected) {
    const { data: dataInventoryItem } = await client.query({
        query: query_sme_catalog_inventory_items,
        fetchPolicy: 'no-cache',
        variables: {
            limit: 20,
            offset: (page - 1) * 20,
            where: {
                ...(!!search ? {
                    _or: [
                        { variant: { sme_catalog_product: { name: { _ilike: `%${search.trim()}%` } } } },
                        { variant: { [currentScanBy?.value || 'gtin']: { _eq: search } } },
                    ],
                } : ""),
                sme_store_id: {
                    _eq: warehouseSelected?.value
                },
                variant: { product_status_id: { _is_null: true } }
            },
            order_by: {
                updated_at: 'desc',
                variant_id: 'desc',
                stock_actual: 'desc_nulls_last'
            }
        },
    });
    return {
        options: dataInventoryItem?.sme_catalog_inventory_items?.map(item => {
            return {
                value: item?.variant?.id,
                label: `${item?.variant?.sme_catalog_product?.name} - Sẵn sàng bán: ${formatNumberToCurrency(item?.stock_available || 0)}`,
                raw: item,
            }
        }),
        hasMore: dataInventoryItem?.sme_catalog_inventory_items?.length == 20,
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
                zIndex: 9,
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
    <div style={{ color: '#ff5629', height: 24, width: 32 }}>
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
    // control: provided => ({ ...provided, minWidth: 140, margin: 8, borderColor: '#D9D9D9' }),
    container: (styles) => ({ ...styles, zIndex: 9 }),
};

export function ReSelectSearchVariant({ selected, onSelect, currentScanBy, warehouseSelected, disabled }) {
    const [isOpen, setIsOpen] = useState(false)
    const _toggleOpen = () => {
        setIsOpen(prev => !prev)
    };
    const { formatMessage } = useIntl()

    return (
        <AsyncPaginate
            autoFocus            
            inputId="input-search"
            isDisabled={disabled}
            backspaceRemovesValue={false}
            components={{ DropdownIndicator, IndicatorSeparator: null }}
            controlShouldRenderValue={false}
            hideSelectedOptions={false}
            isClearable={false}
            menuIsOpen={true}
            styles={selectStyles}            
            tabSelectsValue={false}
            theme={(theme) => ({
                ...theme,
                borderRadius: 0,
                colors: {
                    ...theme.colors,
                    primary: '#ff5629'
                }
            })}       
            onChange={value => {
                _toggleOpen()
                !!onSelect && onSelect(value)
            }}
            loadOptions={async (inputValue, prevOptions, additional) => loadOptions(inputValue, prevOptions, additional, currentScanBy, warehouseSelected)}
            openMenuOnFocus
            openMenuOnClick
            // isClearable
            isLoading={false}
            placeholder={formatMessage({ defaultMessage: '(F2) Quét mã hoặc nhập tên hh' })}
            additional={{
                page: 1,
            }}
            debounceTimeout={300}
            value={selected}
        />
    );
}
