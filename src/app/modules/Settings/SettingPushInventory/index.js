import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import { Card, CardBody, InputVertical } from "../../../../_metronic/_partials/controls";
import query_scGetSettingPushInventory from '../../../../graphql/query_scGetSettingPushInventory'
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic'
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { ArrowBackIos } from '@material-ui/icons';
import { Formik, Field } from 'formik';
import { Switch } from '../../../../_metronic/_partials/controls/forms/Switch'
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import TableStore from './TableStore';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import * as Yup from 'yup'
import DialogProductSmeLinked from './dialogProductSmeLinked';
import query_scGetWarehouseMapping from '../../../../graphql/query_scGetWarehouseMapping';
import mutate_scUpdateSettingPushInventory from '../../../../graphql/mutate_scUpdateSettingPushInventory';
import query_sme_catalog_stores from '../../../../graphql/query_sme_catalog_stores';
import { useFormikContext } from 'formik';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import TableProduct from './TableProduct';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import PopoverPush from './PopoverPush';
import ConfirmDialog from './confirmDialog';
import EditVertical from './EditVertical';

const SettingPushInventory = () => {
    const { setBreadcrumbs } = useSubheader();
    const { addToast } = useToasts()
    const { formatMessage } = useIntl()
    const location = useLocation();
    const history = useHistory()
    const params = queryString.parse(location.search.slice(1, 100000))

    const [initialValues, setInitialValues] = useState({});
    const [initValidates, setInitValidates] = useState({});
    const [dialogProduct, setDialogProduct] = useState(false)
    const [radioChange, setRadioChange] = useState(false)

    const [querySearch, setQuerySearch] = useState(params?.query || '')
    const [currentTypePushInventory, setCurrentTypePushInventory] = useState()
    const [currentMergeStock, setCurrentMergeStock] = useState()
    const creationMethod = [
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Toàn bộ gian hàng" }),
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: "Theo hàng hóa" }),
        },
    ];

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: "Cài đặt" }) },
            { title: formatMessage({ defaultMessage: "Xử lý tồn đa kênh" }) },
            { title: formatMessage({ defaultMessage: "Cài đặt đẩy tồn" }) },
        ]);
    }, []);

    const { loading: loadingStores, data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataWarehouseMapping } = useQuery(query_scGetWarehouseMapping, {
        fetchPolicy: "cache-and-network",
    });
    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    })

    const [updateSettingPushInventory, { loading: loadingUpdateSettingPushInventory }] = useMutation(mutate_scUpdateSettingPushInventory,
        { awaitRefetchQueries: true, refetchQueries: ['scGetSettingPushInventory'] }
    );

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const search_variant = useMemo(() => {
        if (params?.query) {
            return { search_variant: params?.query }
        }
        return {}
    }, [params?.query]);

    const store_id = useMemo(() => {
        if (params?.store) {
            return { store_id: +params.store }
        }
        return {}
    }, [params.store]);

    const per_page = useMemo(() => {
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
    }, [params.limit]);


    const { loading, data, refetch } = useQuery(query_scGetSettingPushInventory, {
        fetchPolicy: "cache-and-network",
        variables: {
            page,
            per_page,
            ...search_variant,
            ...store_id,
        },
        skip: !params.store
    });

    useMemo(() => {
        let initValues = []
        let validates = []
        const channels = dataStores?.op_connector_channels?.map(cn => ({ name: cn?.code, logo: cn?.logo_asset_url }))
        const { list_warehouse_mapping, info_store, list_variant_push } = data?.scGetSettingPushInventory ?? {}

        const store = dataStores?.sc_stores?.map(store => {
            const warehouseMappingId = dataWarehouseMapping?.scGetWarehouseMapping.filter(wh => wh?.store_id == store?.id)?.map(store => store?.sme_warehouse_id)

            const getInfoImageByChannel = channels?.find(cn => cn?.name == store?.connector_channel_code) || {}

            const smeWarehouses = dataSmeWarehouse?.sme_warehouses?.flatMap(wh => warehouseMappingId?.includes(wh?.id) ? ({ id: wh?.id, name: wh?.name, address: wh?.address }) : [])

            const listWarehouseMapping = list_warehouse_mapping?.flatMap(wh => {
                initValues[`inventory_push_percent-${wh?.sme_warehouse_id}`] = wh?.inventory_push_percent || 0

                initValues[`protection_threshold-${wh?.sme_warehouse_id}`] = wh?.protection_threshold || 0

                initValues[`inventory_push_percent_store-${wh?.sme_warehouse_id}`] = wh?.inventory_push_percent || 0

                validates[`inventory_push_percent-${wh?.sme_warehouse_id}`] = Yup.number().required('Không được bỏ trống').min(0, formatMessage({ defaultMessage: 'Tỷ lệ đây từ 0 đến 100%' })).max(100, formatMessage({ defaultMessage: 'Tỷ lệ đây tối đa 100%' })).nullable()

                const smeWarehouse = smeWarehouses?.find(whmp => whmp?.id == wh?.sme_warehouse_id)

                return smeWarehouse ? ({ ...smeWarehouse, ...wh }) : ({ ...wh })

            })

            const listWarehouseMappingLinked = list_warehouse_mapping?.flatMap(wh => {
                if (smeWarehouses?.find(whmp => whmp?.id == wh?.sme_warehouse_id)) {
                    return { ...wh }
                }
                return []
            })

            return {
                ...getInfoImageByChannel,
                ...store,
                warehouseMapping: listWarehouseMapping,
                listWarehouseMappingLinked
            }
        })?.find(store => store?.id == info_store?.id)

        const listVariantPushInventory = list_variant_push?.list_variant

        const scProductVariantPushInventory = listVariantPushInventory?.map(variant => {

            (variant?.scProductVariantPushInventory?.flatMap(variant => variant?.scWarehouseMapping?.sme_warehouse_id ? variant : []) || []).forEach(item => {
                initValues[`inventory_push_percent-product-${variant?.id}-${item?.scWarehouseMapping?.sme_warehouse_id}`] = item?.inventory_push_percent || 0
                initValues[`inventory_push_variant-${variant?.id}-${item?.scWarehouseMapping?.sme_warehouse_id}`] = item?.inventory_push_percent || 0
                initValues[`protection_threshold-product-${variant?.id}-${item?.scWarehouseMapping?.sme_warehouse_id}`] = item?.protection_threshold || 0
            })

            return variant?.scProductVariantPushInventory
        })?.flat()

        const warehouseMappingProduct = scProductVariantPushInventory?.flatMap(wh => {
            const findSmeWarehouse = dataSmeWarehouse?.sme_warehouses?.find(smewh => smewh?.id == wh?.scWarehouseMapping?.sme_warehouse_id)
            if (findSmeWarehouse) {
                return {
                    ...wh,
                    id: findSmeWarehouse?.id,
                    name: findSmeWarehouse?.name,
                    address: findSmeWarehouse?.address
                }
            }
        })
        const typePushInventory = currentTypePushInventory == info_store?.type_push_inventory ?
            { typePushInventory: !!info_store?.type_push_inventory ? info_store?.type_push_inventory : currentTypePushInventory } :
            { typePushInventory: !!currentTypePushInventory ? currentTypePushInventory : info_store?.type_push_inventory }

        setInitValidates(Yup.object().shape(validates))
        setInitialValues(prev => ({
            ...prev,
            typePush: currentMergeStock ? currentMergeStock : info_store?.merge_stock,
            stateChange: false,
            listWarehouseMapping: store?.warehouseMapping,
            warehouseMappingProduct: warehouseMappingProduct,
            listWarehouseMappingLinked: store?.listWarehouseMappingLinked,
            listVariantPush: list_variant_push,
            inventory_push_percent_multi: 100,
            info_store: {
                ...info_store,
                name: store?.name,
                logo: store?.logo,
            },
            enableMultiWarehouse: info_store?.enable_multi_warehouse,
            ...typePushInventory,
            hasSyncWarehouse: !!info_store?.has_sync_warehouse,
            ...initValues,
        }));

    }, [data, dataStores, dataSmeWarehouse, currentMergeStock, currentTypePushInventory, dataWarehouseMapping])

    const ViewTable = () => {
        const { values, setFieldValue, setFieldError } = useFormikContext()
        let view = null

        const STATUS_CHECK = {
            SINGLE_SC_STORE_PUSH_BY_ALL_STORE: (values['typePushInventory'] == 1 && values['enableMultiWarehouse'] == 0 && !!values['listWarehouseMappingLinked']?.length),
            SINGLE_SC_STORE_NOT_LINKED_SME_WAREHOUSE: (values['typePushInventory'] == 1 && values['enableMultiWarehouse'] == 0 && !values['listWarehouseMappingLinked']?.length),
            MULTI_SC_STORE_PUSH_BY_ALL_STORE: (values['typePushInventory'] == 1 && !!values['enableMultiWarehouse']),
            SINGLE_SC_STORE_PUSH_BY_GOODS: (values['typePushInventory'] == 2 && values['enableMultiWarehouse'] == 0),
            MULTI_SC_STORE_PUSH_BY_GOODS: (values['typePushInventory'] == 2 && !!values['enableMultiWarehouse']),
        }

        if (STATUS_CHECK['SINGLE_SC_STORE_PUSH_BY_ALL_STORE']) {
            view = <div style={{ display: 'flex', flexDirection: 'column' }}>
                {values['listWarehouseMapping']?.map(wh => (
                    <>
                        <div className='d-flex align-items-center mb-2 mt-2'>
                            <div className='d-flex align-items-center'>
                                <span>{formatMessage({ defaultMessage: 'Kho vật lý' })}: </span>
                                <div className='d-flex align-items-center ml-2'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                        <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z"></path>
                                    </svg>
                                    <span>{wh?.name}</span>
                                </div>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='d-flex align-items-center col-3 mt-2'>
                                <span>{formatMessage({ defaultMessage: "Tỷ lệ đẩy" })}: </span>
                                <TooltipWrapper note={formatMessage({ defaultMessage: "Tự động đẩy tồn sản phẩm kho lên sàn (Với những sản phẩm sàn liên kết với kho) mỗi khi có thay đổi. Ví dụ: có đơn hàng từ kênh bán hoặc bạn điều chỉnh tồn kho." })}>
                                    <i className="fas fa-info-circle fs-14"></i>
                                </TooltipWrapper>
                                <div>
                                    <div style={{ pointerEvents: !Boolean(values['typePush']) ? 'none' : 'auto' }} className='ml-2 d-flex align-items-center justify-content-center' >
                                        <span className='mr-2'>{values[`inventory_push_percent-${wh?.sme_warehouse_id}`]}%</span>
                                        <EditVertical type="push" title={formatMessage({ defaultMessage: "Tỷ lệ đẩy" })} field={`inventory_push_percent-${wh?.sme_warehouse_id}`} onConfirm={(value) => setFieldValue(`inventory_push_percent-${wh?.sme_warehouse_id}`, value)} />
                                    </div>
                                </div>
                            </div>
                                <div className='d-flex align-items-center col-3 mt-2'>
                                    <span className='mr-2'>{formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })}</span>
                                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Khi đến ngưỡng bảo vệ, tồn kho của hàng hóa sàn sẽ về 0.' })}>
                                        <i className="fas fa-info-circle fs-14"></i>
                                    </TooltipWrapper>
                                    <div style={{ pointerEvents: !Boolean(values['typePush']) ? 'none' : 'auto' }} className='ml-2 d-flex align-items-center justify-content-center' >
                                        <span className='ml-2 mr-2'>{values[`protection_threshold-${wh?.sme_warehouse_id}`]}</span>
                                        <EditVertical type="protection" title={formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })} field={`protection_threshold-${wh?.sme_warehouse_id}`} onConfirm={(value) => setFieldValue(`protection_threshold-${wh?.sme_warehouse_id}`, value)} />
                                    </div>

                                </div>

                        </div>

                    </>
                ))}
            </div>
        }

        if (STATUS_CHECK['SINGLE_SC_STORE_NOT_LINKED_SME_WAREHOUSE']) {
            view = <div className='d-flex align-items-center'>
                <span>{formatMessage({ defaultMessage: "Kho vật lý" })}: </span>
                <span className='text-danger ml-2'>{formatMessage({ defaultMessage: "Không có liên kết nên không thể đẩy tồn được" })}</span>
            </div>
        }

        if (STATUS_CHECK['MULTI_SC_STORE_PUSH_BY_ALL_STORE']) {
            view = <TableStore loading={loading} />
        }

        if (STATUS_CHECK['SINGLE_SC_STORE_PUSH_BY_GOODS']) {
            if (!!values['listWarehouseMappingLinked']?.length) {
                view = <TableProduct single={true} perPage={per_page} page={page} loading={loading} />

            } else {
                view = <div className='d-flex align-items-center'>
                    <span>{formatMessage({ defaultMessage: "Kho vật lý" })}: </span>
                    <span className='text-danger ml-2'>{formatMessage({ defaultMessage: "Không có liên kết nên không thể đẩy tồn được" })}</span>
                </div>
            }

        }

        if (STATUS_CHECK['MULTI_SC_STORE_PUSH_BY_GOODS']) {
            view = <TableProduct perPage={per_page} page={page} loading={loading} />
        }

        return view

    }

    return (
        <>
            <Helmet titleTemplate={formatMessage({ defaultMessage: `Cài đặt đẩy tồn {key}` }, { key: " - UpBase" })} defaultTitle={formatMessage({ defaultMessage: `Cài đặt đẩy tồn {key}` }, { key: " - UpBase" })}>
                <meta name="description" content={formatMessage({ defaultMessage: `Cài đặt đẩy tồn {key}` }, { key: " - UpBase" })} />
            </Helmet>

            <a href={`/setting/sync-warehouse`} className="mb-5" style={{ display: "block", color: "#ff5629" }}>
                <ArrowBackIos />
                {formatMessage({ defaultMessage: "Quay lại Xử lý tồn đa kênh" })}
            </a>
            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={initValidates}
                onSubmit={async (values) => {
                    const listWarehouseUpdate = values['listWarehouseMapping']?.map(wh => ({
                        sc_warehouse_id: wh?.scWarehouse?.id,
                        inventory_push_percent: wh?.sme_warehouse_id ? +values[`inventory_push_percent-${wh?.sme_warehouse_id}`] : 100,
                       protection_threshold: wh?.sme_warehouse_id ? +values[`protection_threshold-${wh?.sme_warehouse_id}`] : 0 
                    }))

                    const listVariantUpdate = values['listVariantPush']?.list_variant?.map(variant => {
                        const scWarehouseMapping = variant?.scProductVariantPushInventory?.map(whMaping => {
                            return {
                                sc_variant_id: variant?.id,
                                inventory_push_percent: whMaping?.scWarehouseMapping?.sme_warehouse_id ? +values[`inventory_push_percent-product-${variant?.id}-${whMaping?.scWarehouseMapping?.sme_warehouse_id}`] : 100,
                                sc_warehouse_id: whMaping?.scWarehouseMapping?.scWarehouse?.id,
                                 protection_threshold: whMaping?.scWarehouseMapping?.sme_warehouse_id ? +values[`protection_threshold-product-${variant?.id}-${whMaping?.scWarehouseMapping?.sme_warehouse_id}`] : 0 
                            }

                        })
                        return scWarehouseMapping
                    }).flat()

                    const variablesPost = {
                        store_id: values['info_store']?.id,
                        merge_stock: !!values['typePush'] ? 1 : 0,
                        type_push: +values['typePushInventory'],
                        list_warehouse_update: listWarehouseUpdate,
                        list_variant_update: listVariantUpdate,
                    }

                    const { data } = await updateSettingPushInventory({
                        variables: {
                            ...variablesPost
                        }
                    })
                    if (!!data?.scUpdateSettingPushInventory?.success) {
                        addToast(data?.scUpdateSettingPushInventory?.message || '', { appearance: 'success' })
                        setRadioChange(false)
                        return
                    }
                    addToast(data?.scUpdateSettingPushInventory?.message || '', { appearance: 'error' })
                }}
            >
                {({ values, setFieldValue, handleSubmit, formik }) => {
                    setCurrentTypePushInventory(values['typePushInventory'])
                    setCurrentMergeStock(values['typePush'])
                    return (
                        <>

                            <RouterPrompt
                                forkWhen={!!values['stateChange'] || !!radioChange}
                                when={!!values['stateChange'] || !!radioChange}
                                title={formatMessage({ defaultMessage: "Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?", })}
                                cancelText={formatMessage({ defaultMessage: "Quay lại" })}
                                okText={formatMessage({ defaultMessage: "Tiếp tục" })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <LoadingDialog show={loadingUpdateSettingPushInventory} />
                            {dialogProduct && <DialogProductSmeLinked totalVariant={values['listVariantPush']?.total} radioChange={radioChange} variantAdded={values['listVariantPush']?.list_variant} show={dialogProduct} onHide={() => setDialogProduct(false)} />}
                            <Card>
                                <CardBody>
                                    <div className="mb-2" style={{ borderBottom: '1px solid #d9d9d9', padding: '10px 0px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'black' }}>Quy tắc đẩy tồn</span>
                                    </div>
                                    <div className='d-flex align-items-center mb-4'>
                                        <span className='mr-2'>{formatMessage({ defaultMessage: "Gian hàng" })}:</span>
                                        <div className='d-flex align-items-center'>
                                            <img style={{ width: '20px' }} className='mx-2' src={values['info_store']?.logo} alt="" />
                                            <span>{values['info_store']?.name}</span>
                                        </div>
                                    </div>
                                    <div className='mb-2 row col-12 d-flex align-items-center'>
                                        <div className='d-flex align-items-center'>
                                            <span className='mr-2'>
                                                {formatMessage({ defaultMessage: 'Tồn từ kho' })}
                                            </span>
                                            <TooltipWrapper note={formatMessage({ defaultMessage: "Tự động đẩy tồn sản phẩm kho lên sàn (Với những sản phẩm sàn liên kết với kho) mỗi khi có thay đổi. Ví dụ: có đơn hàng từ kênh bán hoặc bạn điều chỉnh tồn kho." })}>
                                                <i className="fas fa-info-circle fs-14"></i>
                                            </TooltipWrapper>
                                        </div>
                                        <div className='ml-3' style={{ marginTop: '-7px' }}>
                                            <Field name={`typePush`}
                                                disabled={!values['hasSyncWarehouse'] && !Boolean(values['typePush'])}
                                                value={!!values['typePush']}
                                                component={Switch}
                                                onChangeState={() => setFieldValue('stateChange', true)}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <Field
                                            disabled={!Boolean(!!values['typePush'])}
                                            name="typePushInventory"
                                            label={formatMessage({ defaultMessage: 'Hình thức đẩy tồn' })}
                                            component={RadioGroup}
                                            customFeedbackLabel={" "}
                                            options={creationMethod}
                                            onChangeState={() => {
                                                setRadioChange(true)
                                            }}
                                        ></Field>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody>
                                    <div className="mb-2" style={{ borderBottom: '1px solid #d9d9d9', padding: '10px 0px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'black' }}>Thông tin đẩy tồn</span>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap py-2" style={{ background: "#fff", zIndex: 1, marginBottom: "5px", }}>
                                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                                        <span className="fs-14 text-danger">
                                            {formatMessage({ defaultMessage: 'Hệ thống chỉ thực hiện đẩy tồn với những hàng hóa sàn đã liên kết với hàng hóa kho.' })}
                                        </span>
                                    </div>
                                    {(values['typePushInventory'] == 2 && (!!values['enableMultiWarehouse'] || (!values['enableMultiWarehouse'] && !!values['listWarehouseMappingLinked']?.length))) && (
                                        <div className='d-flex align-items-center justify-content-between mb-4'>
                                            <div className="input-icon pl-0" style={{ height: "fit-content", width: '60%' }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={formatMessage({ defaultMessage: 'Tên/SKU' })}
                                                    style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                                                    onBlur={(e) => {
                                                        history.push(`${location.pathname}?${queryString.stringify({ ...params, query: e.target.value })}`);
                                                    }}
                                                    value={querySearch}
                                                    onChange={(e) => {
                                                        setQuerySearch(e.target.value)
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.keyCode == 13) {
                                                            history.push(`${location.pathname}?${queryString.stringify({ ...params, query: e.target.value })}`);
                                                        }
                                                    }}
                                                />

                                                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                            </div>

                                            <button disabled={!Boolean(!!values['typePush'])} onClick={() => setDialogProduct(true)} type="submit" style={{ width: 'max-content', position: 'relative' }} className="text-white btn btn-primary btn-elevate">
                                                {formatMessage({ defaultMessage: "Thêm nhanh hàng hóa" })}
                                            </button>
                                        </div>
                                    )}

                                    <ViewTable />
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody>
                                    <div className="d-flex justify-content-end">
                                        <div className="d-flex align-items-center">
                                            <button type="button" onClick={() => history.push('/setting/sync-warehouse')}
                                                disabled={!values['listWarehouseMappingLinked']?.length}
                                                className="btn btn-secondary mr-6"
                                                style={{ background: "#6C757D", border: "#6C757D", width: "max-content", color: "white", }}
                                            >
                                                {formatMessage({ defaultMessage: "Hủy bỏ" })}
                                            </button>
                                            <button onClick={() => handleSubmit()} disabled={!values['listWarehouseMappingLinked']?.length} type="submit" className="text-white btn btn-primary btn-elevate mr-6" style={{ width: "max-content" }}
                                            >
                                                {formatMessage({ defaultMessage: "Cập nhật" })}
                                            </button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </>
                    )
                }}
            </Formik>
            <div id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => { window.scrollTo({ letf: 0, top: document.body.scrollHeight, behavior: "smooth" }); }}>
                <span className="svg-icon"><SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={" "}></SVG>
                </span>
            </div>
        </>
    )
}

export default SettingPushInventory