import { Field, useFormikContext } from "formik";
import _ from "lodash";
import queryString from 'querystring';
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { defineMessages, useIntl } from 'react-intl';
import { Link, useHistory, useLocation } from "react-router-dom";
import Select from 'react-select';
import { useToasts } from "react-toast-notifications";
import * as Yup from "yup";
import { Card, CardBody, CardHeader, Checkbox, InputVerticalWithIncrease } from "../../../../../_metronic/_partials/controls";
import client from "../../../../../apollo";
import InfoProduct from "../../../../../components/InfoProduct";
import Pagination from '../../../../../components/Pagination';
import useScanDetection from "../../../../../hooks/useScanDetection";
import { formatNumberToCurrency } from "../../../../../utils";
import ModalCombo from "../../../Products/products-list/dialog/ModalCombo";
import { UNIT_ADDONS } from "../../WarehouseBillsUIHelper";
import ModalQuicklyAddProducts from "../../components/ModalQuicklyAddProducts";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import query_sme_catalog_inventory_items from "../../../../../graphql/query_sme_catalog_inventory_items";

const mss = defineMessages({
    phSku: {
        defaultMessage: 'Nhập SKU hàng hoá'
    },
    phGtin: {
        defaultMessage: 'Nhập GTIN'
    }
})

const SEARCH_OPTIONS = [
    { value: 'sku', label: 'SKU hàng hóa', placeholder: mss.phSku },
    { value: 'gtin', label: 'GTIN', placeholder: mss.phGtin },
];

const TableWarehouseBillIn = ({ warehouse, typeProduct, onSetSchema, selectedVariants, setSelectedVariants }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { handleSubmit, setFieldValue, values, validateForm, errors, setValues } = useFormikContext();
    const [dataCombo, setDataCombo] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const inputScanRef = useRef(null);
    const [searchType, setSearchType] = useState('sku');
    const state = useLocation().state
    useEffect(() => {
        setSelectedVariants([])
    }, [warehouse, typeProduct])

    useEffect(() => {
        if (state?.dataVariants) {
            setSelectedVariants(state?.dataVariants)
        }
    }, [state])
    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputScanRef?.current) return;
            inputScanRef.current.value = "";

            const { data: dataInventoryItem } = await client.query({
                query: query_sme_catalog_inventory_items,
                fetchPolicy: 'cache-first',
                variables: {
                    limit: 1,
                    offset: 0,
                    where: {
                        variant: {
                            sme_catalog_product: { is_expired_date: { _eq: false } },
                            is_combo: { _eq: 0 },
                            product_status_id: { _is_null: true },
                            ...(searchType == 'sku' ? {
                                sku: { _eq: value.trim() }
                            } : {
                                gtin: { _eq: value.trim() }
                            }),
                        },
                    }
                },
            });

            if (dataInventoryItem?.sme_catalog_inventory_items?.length > 0) {
                const item = dataInventoryItem?.sme_catalog_inventory_items?.[0];
                if (!selectedVariants?.map(item => item?.variant?.id).includes(item?.variant?.id)) {                    
                    setSelectedVariants(pre => ([...pre, item]))                    
                    addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Hàng hoá kho đã được thêm vào phiếu trước đó' }), { appearance: 'error' })
                }
            } else {
                addToast(formatMessage({ defaultMessage: 'Hàng hoá kho không tồn tại trên hệ thống' }), { appearance: 'error' })
            }
        }
    });


    const page = useMemo(
        () => {
            try {
                if (selectedVariants?.length == 0) {
                    return 1
                }
                let _page = Number(params.page);
                if (!Number.isNaN(_page)) {
                    return Math.max(1, _page)
                } else {
                    return 1
                }
            } catch (error) {
                return 1;
            }
        }, [params.page]
    );

    const limit = useMemo(
        () => {
            try {
                let _value = Number(params.limit)
                if (!Number.isNaN(_value)) {
                    return Math.max(25, _value)
                } else {
                    return 25
                }
            } catch (error) {
                return 25
            }
        }, [params.limit]
    );

    useMemo(() => {
        if (!!selectedVariants) {
            const fieldValues = { ...values }
            const warehouseBillItems = selectedVariants?.reduce(
                (result, bill) => {
                    fieldValues[`bill-${bill?.variant?.id}-stock_preallocate`] = !!bill?.is_include_stock_preallocate;
                    fieldValues[`bill-${bill?.variant?.id}-stock_preallocate-qty`] = bill?.stock_preallocate;
                    if(!params?.billId) {
                        fieldValues[`bill-${bill?.variant?.id}-qty`] = bill?.expire_info?.quantity != null ? bill?.expire_info?.quantity : undefined;
                    }
                    fieldValues[`bill-${bill?.variant?.id}-price`] = bill?.price || 0;
                    fieldValues[`bill-${bill?.variant?.id}-discount`] = bill?.discount_value || 0;
                    fieldValues[`bill-${bill?.variant?.id}-discount-unit`] = _.find(UNIT_ADDONS, _unit => _unit.value == bill?.discount_type) || UNIT_ADDONS[0];
                    return result;
                }, {}
            );
            setTimeout(() => {
                setFieldValue('__changed__', false)
            }, 50);
            setValues(fieldValues)
        }
    }, [selectedVariants, params?.billId])
    
    useMemo(() => {
        if (!!selectedVariants) {
            let validateSchema = {};
            const warehouseBillItems = selectedVariants?.reduce(
                (result, bill) => {
                    validateSchema[`bill-${bill?.variant?.id}-qty`] = Yup.number()
                    .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng nhập kho' }))
                    .moreThan(bill?.stock_preallocate == 0 ? bill?.stock_preallocate : bill?.stock_preallocate - 1,
                        bill?.stock_preallocate == 0 ? formatMessage({ defaultMessage: 'Số lượng nhập kho phải lớn hơn 0.' }) :
                        values[`bill-${bill?.variant?.id}-stock_preallocate`] ? formatMessage({ defaultMessage: 'Số lượng nhập kho phải lớn hơn hoặc bằng tồn tạm ứng.' }) : '')
                        .max(999999, formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' }))
                        return result;
                    }, {}
                );
                
                validateSchema[`note`] = Yup.string()
                .notRequired()
                .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))
                validateSchema[`bill-vat`] = Yup.number()
                .max(100, formatMessage({ defaultMessage: 'Thuế tối đa 100%' }))
                onSetSchema(Yup.object().shape(validateSchema))
                
            }
    }, [selectedVariants, ...selectedVariants?.map(bill => values[`bill-${bill?.variant?.id}-stock_preallocate`])]);
    const renderTableHeader = useMemo(
        () => {
            return (
                <tr className="text-left" >
                    <th style={{ fontSize: '14px' }} width='45%'>
                        <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='10%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} width='15%' className="text-center">
                        <span>{formatMessage({ defaultMessage: 'Tồn kho sẵn sàng' })}</span>
                    </th>

                    <th style={{ fontSize: '14px' }} className="text-center" width='20%'>
                        <span>{formatMessage({ defaultMessage: 'Số lượng nhập kho' })}</span>
                    </th>
                    <th style={{ fontSize: '14px' }} className='text-center' width='10%'>
                        <span>{formatMessage({ defaultMessage: 'Thao tác' })}</span>
                    </th>
                </tr>
            )
        }, []
    );

    const onDeleteWarehouseBill = (id) => {
        const newSelectedVariants = selectedVariants?.filter(item => item?.variant?.id != id)
        setSelectedVariants(newSelectedVariants)
    }        

    return (
        <>
            <Card>
                <CardHeader title={<div className="d-flex flex-column">
                    <span>{formatMessage({ defaultMessage: 'SẢN PHẨM NHẬP KHO' })}</span>
                </div>}>
                </CardHeader>
                <ModalCombo
                    dataCombo={dataCombo}
                    onHide={() => setDataCombo(null)}
                />
                <ModalQuicklyAddProducts
                    show={showAddProduct}
                    type="in"
                    warehouse={warehouse}
                    onHide={() => setShowAddProduct(false)}
                    isExpireItems={false}
                    selectedVariants={selectedVariants}
                    setSelectedVariants={setSelectedVariants}
                />
                <CardBody>
                    <div className="row mb-8 d-flex align-items-center">
                        <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                            <div className="col-3 pr-0 d-flex align-items-center">
                                <span className="mr-4"><strong>{formatMessage({ defaultMessage: 'QUÉT/NHẬP' })}</strong></span>
                                <Select
                                    className='w-100 custom-select-warehouse'
                                    theme={(theme) => ({
                                        ...theme,
                                        borderRadius: 0,
                                        colors: {
                                            ...theme.colors,
                                            primary: '#ff5629'
                                        }
                                    })}
                                    isLoading={false}
                                    value={
                                        _.find(_.omit(SEARCH_OPTIONS, ['placeholder']), _bill => _bill?.value == searchType)
                                        || _.omit(SEARCH_OPTIONS[0], ['placeholder'])
                                    }
                                    defaultValue={_.omit(SEARCH_OPTIONS[0], ['placeholder'])}
                                    options={_.map(SEARCH_OPTIONS, _bill => _.omit(_bill, ['placeholder']))}
                                    onChange={value => {
                                        setSearchType(value.value)
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>
                                    }}
                                />
                            </div>
                            <div className="col-6 pl-0" style={{ height: 'fit-content' }} >
                                <input
                                    type="text"
                                    className="form-control"
                                    ref={inputScanRef}
                                    style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                    placeholder={formatMessage(_.find(SEARCH_OPTIONS, _bill => _bill.value == searchType)?.placeholder || SEARCH_OPTIONS[0].placeholder)}
                                    onKeyDown={async e => {
                                        if (e.keyCode == 13) {
                                            const value = e.target.value;
                                            inputScanRef.current.value = "";

                                            const { data: dataInventoryItem } = await client.query({
                                                query: query_sme_catalog_inventory_items,
                                                fetchPolicy: 'network-only',
                                                variables: {
                                                    limit: 1,
                                                    offset: 0,
                                                    where: {
                                                        variant: {
                                                            sme_catalog_product: { is_expired_date: { _eq: false } },
                                                            is_combo: { _eq: 0 },
                                                            product_status_id: { _is_null: true },
                                                            ...(searchType == 'sku' ? {
                                                                sku: { _eq: value.trim() }
                                                            } : {
                                                                gtin: { _eq: value.trim() }
                                                            }),
                                                        },
                                                    }
                                                },
                                            });

                                            if (dataInventoryItem?.sme_catalog_inventory_items?.length > 0) {
                                                const item = dataInventoryItem?.sme_catalog_inventory_items?.[0];
                                                if (!selectedVariants?.map(item => item?.variant?.id).includes(item?.variant?.id)) {
                                                    setSelectedVariants(pre => ([...pre, item]))                                                    
                                                    addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
                                                } else {
                                                    addToast(formatMessage({ defaultMessage: 'Hàng hoá kho đã được thêm vào phiếu trước đó' }), { appearance: 'error' })
                                                }
                                            } else {
                                                addToast(formatMessage({ defaultMessage: 'Hàng hoá kho không tồn tại trên hệ thống' }), { appearance: 'error' })
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </AuthorizationWrapper>
                        <div className="col-3">
                            <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                                <button
                                    className="float-right btn btn-primary"
                                    onClick={() => setShowAddProduct(true)}
                                >
                                    {formatMessage({ defaultMessage: 'Thêm nhanh sản phẩm' })}
                                </button>
                            </AuthorizationWrapper>
                        </div>
                    </div>
                    <div style={{
                        boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                        borderRadius: 6, minHeight: 220
                    }} >
                        <table className="table product-list table-borderless table-vertical-center fixed">
                            <thead style={{
                                borderBottom: '1px solid #F0F0F0',
                                borderLeft: '1px solid #d9d9d9'
                            }}>
                                {renderTableHeader}
                            </thead>
                            <tbody>
                                {
                                    selectedVariants?.slice(limit * (page - 1), limit + limit * (page - 1))?.map(_wareHouseBill => {

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
                                        const stockAvailableWarehouse = _wareHouseBill?.variant?.inventories?.find(iv => iv?.sme_store_id == values?.warehouseId?.value)?.stock_available;
                                        return (
                                            <tr key={`warehouse-bill-item-${_wareHouseBill?.variant?.id}`} style={{ borderBottom: '1px solid #D9D9D9' }}>
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
                                                    {formatNumberToCurrency(stockAvailableWarehouse)}
                                                </td>
                                                <td className="text-center">
                                                    <>
                                                        <Field
                                                            name={`bill-${_wareHouseBill?.variant?.id}-qty`}
                                                            component={InputVerticalWithIncrease}
                                                            label={''}
                                                            required={false}
                                                            customFeedbackLabel={' '}
                                                            cols={['', 'col-12']}
                                                            countChar
                                                            maxChar={'255'}
                                                            rows={4}
                                                        />

                                                        {(!!_wareHouseBill.stock_preallocate > 0) && (
                                                            <>
                                                                <div className="mt-2 mb-2">
                                                                    <span className="text-primary">{formatMessage({ defaultMessage: 'Tồn tạm ứng' })}: {formatNumberToCurrency(_wareHouseBill.stock_preallocate)}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center justify-content-center">
                                                                    <Checkbox
                                                                        size="checkbox-md"
                                                                        inputProps={{
                                                                            "aria-label": "checkbox",
                                                                        }}
                                                                        isSelected={values[`bill-${_wareHouseBill?.variant?.id}-stock_preallocate`]}
                                                                        onChange={(e) => {
                                                                            setFieldValue([`bill-${_wareHouseBill?.variant?.id}-stock_preallocate`], !values[`bill-${_wareHouseBill?.variant?.id}-stock_preallocate`]);
                                                                        }}
                                                                    />

                                                                    <span>{formatMessage({ defaultMessage: 'Bao gồm tạm ứng' })}</span>
                                                                </div>
                                                            </>
                                                        )}

                                                    </>
                                                </td>
                                                <td className="text-center">
                                                    <AuthorizationWrapper keys={['warehouse_bill_in_create']}>
                                                        <i
                                                            class="fas fa-trash-alt"
                                                            role="button"
                                                            style={{ color: 'red' }}
                                                            onClick={() => {
                                                                setFieldValue('__changed__', true);
                                                                onDeleteWarehouseBill(_wareHouseBill?.variant?.id)
                                                            }}
                                                        />
                                                    </AuthorizationWrapper>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>

                        <Pagination
                            page={page}
                            totalPage={Math.ceil(selectedVariants?.length / limit)}
                            limit={limit}
                            totalRecord={selectedVariants?.length}
                            count={page * limit >= selectedVariants?.length ? selectedVariants?.length - (page - 1) * limit : limit}
                            basePath={`/products/warehouse-bill/create`}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nhập kho' })}
                        />
                    </div>
                </CardBody>
            </Card>
        </>
    )
}

export default memo(TableWarehouseBillIn);