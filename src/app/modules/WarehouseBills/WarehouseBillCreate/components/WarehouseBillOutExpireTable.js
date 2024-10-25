import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, CardHeader, InputVerticalWithIncrease } from "../../../../../_metronic/_partials/controls";
import Select from 'react-select';
import Pagination from '../../../../../components/Pagination';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from 'querystring';
import { Modal } from 'react-bootstrap';
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import { useMutation, useQuery } from "@apollo/client";
import { Link } from 'react-router-dom';
import ModalCombo from "../../../Products/products-list/dialog/ModalCombo";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Field, useFormikContext } from "formik";
import * as Yup from "yup";
import { formatNumberToCurrency } from "../../../../../utils";
import ModalQuicklyAddProducts from "../../components/ModalQuicklyAddProducts";
import InputScan from "../../../../../components/InputScan";
import useScanDetection from "../../../../../hooks/useScanDetection";
import client from "../../../../../apollo";
import InfoProduct from "../../../../../components/InfoProduct";
import { defineMessages, useIntl } from 'react-intl';
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import DatePicker from "rsuite/DatePicker";
import dayjs from "dayjs";
import { InputVertical } from "../../../../../_metronic/_partials/controls";
import query_sme_catalog_inventory_items from "../../../../../graphql/query_sme_catalog_inventory_items";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

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

const TableWarehouseBillOutExpire = ({ onSetSchema, warehouse, typeProduct, selectedVariants, setSelectedVariants}) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { validateForm, handleSubmit, setFieldValue, values, errors } = useFormikContext();
    const [dataCombo, setDataCombo] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [loadingScan, setLoadingScan] = useState(false);
    const inputScanRef = useRef(null);

    const [searchText, setSearchText] = useState(null);
    const [searchType, setSearchType] = useState('sku');
    const state = location.state

    useEffect(() => {
        setSelectedVariants([])
    }, [warehouse, typeProduct])

    useEffect(() => {
        if(state?.dataVariants) {
            setSelectedVariants(state?.dataVariants)
        }
    }, [state])

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputScanRef?.current) return;

            inputScanRef.current.value = "";

            setLoadingScan(true);
            const { data: dataInventoryItem } = await client.query({
                query: query_sme_catalog_inventory_items,
                fetchPolicy: 'cache-first',
                variables: {
                    limit: 1,
                    offset: 0,
                    where: {
                        variant: {
                            sme_catalog_product: {is_expired_date: {_eq: true}},
                            is_combo: { _eq: 0 },
                            product_status_id: {_is_null: true},
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
                    setLoadingScan(false);
                    addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
                } else {
                    setLoadingScan(false);
                    addToast(formatMessage({ defaultMessage: 'Hàng hoá kho đã được thêm vào phiếu trước đó' }), { appearance: 'error' })
                }
            } else {
                setLoadingScan(false);
                addToast(formatMessage({ defaultMessage: 'Hàng hoá kho không tồn tại trên hệ thống' }), { appearance: 'error' })
            }
        }
    });

    const page = useMemo(
        () => {
            try {
                let _page = Number(params.page);
                if(selectedVariants?.length == 0) {
                    return 1
                }
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

    let totalRecord = selectedVariants?.length || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    useEffect(
        () => {
            if (!!selectedVariants) {
                let validateSchema = {};

                const warehouseBillItems = selectedVariants?.reduce(
                    (result, bill) => {

                        // const stockQuantity = Math.max(
                        //     bill?.variant?.inventories?.find(iv => iv?.sme_store_id == values?.warehouseId?.value)?.stock_available,
                        //     0
                        // );
                        const stockAvailableWarehouse = bill?.variant?.inventories?.find(iv => iv?.sme_store_id == values?.warehouseId?.value)?.stock_available;

                        const isCheckStock = stockAvailableWarehouse <= 999999;
                        validateSchema[`bill-${bill?.variant?.id}-qty`] = Yup.number()
                            .required(formatMessage({ defaultMessage: 'Vui lòng nhập số lượng xuất kho' }))
                            .moreThan(0, formatMessage({ defaultMessage: 'Số lượng sản phẩm xuất kho phải lớn hơn 0' }))
                            .max(
                                isCheckStock ? stockAvailableWarehouse : 999999,
                                isCheckStock ? formatMessage({ defaultMessage: 'Số lượng sản phẩm xuất kho phải nhỏ hơn số lượng sản phẩm sẵn sàng bán' }) : formatMessage({ defaultMessage: 'Số lượng sản phẩm phải nhỏ hơn 999.999' })
                            )
                        // validateSchema[`bill-${bill?.variant?.id}-lot-code`] = Yup.string()
                        //     .nullable()
                        //     .max(35, 'Mã lô tối đa 35 kí tự')
                        return result;
                    }, {}
                );

                validateSchema[`note`] = Yup.string()
                    .notRequired()
                    .max(255, formatMessage({ defaultMessage: 'Ghi chú tối đa 255 ký tự' }))

                setTimeout(() => {
                    setFieldValue('__changed__', false)
                }, 100);

                onSetSchema(Yup.object().shape((validateSchema)));
            }
        }, [selectedVariants, values]
    );

    const renderTableHeader = useMemo(
        () => {
                return (
                    <tr className="text-left" >
                        <th style={{ fontSize: '14px' }} width='25%'>
                            <span>{formatMessage({ defaultMessage: 'Sản phẩm' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='20%'>
                            <span>{formatMessage({ defaultMessage: 'SKU' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} width='5%' className="text-center">
                            <span>{formatMessage({ defaultMessage: 'ĐVT' })}</span>
                        </th>
                        <th style={{ fontSize: '14px' }} className="text-center" width='15%'>
                            <span>
                                {formatMessage({ defaultMessage: 'Tồn kho sẵn sàng' })}
                            </span>
                        </th>
                        <th style={{ fontSize: '14px' }} className="text-center" width='15%'>
                            <span>{formatMessage({ defaultMessage: 'Số lượng xuất kho' })}</span>
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
    };

    useEffect(
        () => {
            if (!!selectedVariants) {
                const warehouseBillItems = selectedVariants?.reduce(
                    (result, bill) => {
                        setFieldValue([`bill-${bill?.variant?.id}-qty`], bill?.expire_info?.quantity != null ? bill?.expire_info?.quantity : undefined);
                    }, {}
                );
            }
        }, [selectedVariants]
    );

    return (
        <>
            <Card>
                <CardHeader title={<div className="d-flex flex-column">
                    <span>{formatMessage({ defaultMessage: 'SẢN PHẨM XUẤT KHO' })}</span>
                </div>}>
                </CardHeader>
                <ModalCombo
                    dataCombo={dataCombo}
                    onHide={() => setDataCombo(null)}
                />
                <ModalQuicklyAddProducts
                    show={showAddProduct}
                    type="out"
                    warehouse={warehouse}
                    onHide={() => setShowAddProduct(false)}
                    selectedVariants={selectedVariants}
                    setSelectedVariants={setSelectedVariants}
                    isExpireItems={true}
                />

                <CardBody>
                    <div className="row mb-8 d-flex align-items-center">
                        <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
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

                                        setLoadingScan(true);
                                        const { data: dataInventoryItem } = await client.query({
                                            query: query_sme_catalog_inventory_items,
                                            fetchPolicy: 'network-only',
                                            variables: {
                                                limit: 1,
                                                offset: 0,
                                                where: {
                                                    variant: {
                                                        sme_catalog_product: {is_expired_date: {_eq: true}},
                                                        is_combo: { _eq: 0 },
                                                        product_status_id: {_is_null: true},
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
                                                setLoadingScan(false);
                                                addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
                                            } else {
                                                setLoadingScan(false);
                                                addToast(formatMessage({ defaultMessage: 'Hàng hoá kho đã được thêm vào phiếu trước đó' }), { appearance: 'error' })
                                            }
                                        } else {
                                            setLoadingScan(false);
                                            addToast(formatMessage({ defaultMessage: 'Hàng hoá kho không tồn tại trên hệ thống' }), { appearance: 'error' })
                                        }
                                    }
                                }}
                            />
                        </div>
                        </AuthorizationWrapper>
                        <div className="col-3">
                            <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
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
                        <table className="table product-list  table-borderless table-vertical-center fixed">
                            <thead style={{
                                borderBottom: '1px solid #F0F0F0',
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
                                                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'column'}}>
                                                        <div className='d-flex align-items-center'>
                                                            <OverlayTrigger
                                                                overlay={
                                                                <Tooltip title='#1234443241434'>
                                                                    <div style={{
                                                                    backgroundColor: '#F7F7FA',
                                                                    width: 160, height: 160,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    minWidth: 160
                                                                    }} className='mr-2' >
                                                                    {
                                                                        !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                                                        style={{ width: 160, height: 160, objectFit: 'contain' }} />
                                                                    }
                                                                    </div>
                                                                </Tooltip>
                                                                }
                                                            >
                                                                <Link to={linkProduct()} target="_blank">
                                                                <div style={{
                                                                    backgroundColor: '#F7F7FA',
                                                                    width: 20, height: 20,
                                                                    borderRadius: 4,
                                                                    overflow: 'hidden',
                                                                    minWidth: 20
                                                                }} className='mr-2' >
                                                                    {
                                                                    !!_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url && <img src={_wareHouseBill?.variant?.sme_catalog_product_variant_assets[0]?.asset_url}
                                                                        style={{ width: 20, height: 20, objectFit: 'contain' }} />
                                                                    }
                                                                </div>
                                                                </Link>
                                                            </OverlayTrigger>
                                                            <div>
                                                                <div className='d-flex flex-column'>
                                                                    <InfoProduct
                                                                        name={_wareHouseBill?.variant?.sme_catalog_product?.name}
                                                                        isSingle
                                                                        url={linkProduct()}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {
                                                                !!_wareHouseBill?.variant?.attributes?.length > 0 && <p className='text-secondary-custom font-weight-normal mt-2' >
                                                                    {_wareHouseBill?.variant?.name?.replaceAll(' + ', ' - ')}
                                                                </p>
                                                            }
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className='d-flex ml-2'>
                                                        <Link style={{ color: 'black' }} to={linkProduct()} target="_blank" >
                                                                <InfoProduct
                                                                sku={_wareHouseBill?.variant?.sku}
                                                                // isSingle
                                                                />
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="text-center">{_wareHouseBill?.variant?.unit || '--'}</td>
                                                {/* <td className="text-center">
                                                    <Field 
                                                        name={`bill-${_wareHouseBill?.variant?.id}-lot-code`}
                                                        component={InputVertical}
                                                        label={''}
                                                        required={false}
                                                        customFeedbackLabel={' '}
                                                        cols={['', 'col-12']}
                                                        rows={4}
                                                    />
                                                </td> */}
                                                <td className="text-center">
                                                {formatNumberToCurrency(stockAvailableWarehouse)}

                                                </td>
                                                <td className="text-center">
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
                                                </td>
                                                    <td className="text-center">
                                                        <AuthorizationWrapper keys={['warehouse_bill_out_action']}>
                                                            <i
                                                                class="fas fa-trash-alt"
                                                                role="button"
                                                                style={{ color: 'red' }}
                                                                onClick={() => {
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
                            totalPage={Math.ceil(selectedVariants?.length/limit)}
                            limit={limit}
                            totalRecord={selectedVariants?.length}
                            count={page * limit >= selectedVariants?.length ? selectedVariants?.length - (page-1)*limit : limit}
                            basePath={`/products/warehouse-bill/create`}
                            emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nhập kho' })}
                        />
                    </div>
                </CardBody>
            </Card>
        </>
    )
}

export default memo(TableWarehouseBillOutExpire);