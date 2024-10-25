import { useMutation, useQuery } from "@apollo/client";
import React, { memo, useEffect, useMemo, useRef, useState, Fragment, useLayoutEffect } from "react";
import query_sc_stores from '../../../../graphql/query_sc_stores'
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Link, useHistory, useLocation } from "react-router-dom";
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import { useLazyQuery } from "@apollo/client";
import _ from 'lodash'
import { Button, Form, Modal, Tooltip } from 'react-bootstrap';
import { useToasts } from "react-toast-notifications";
import ChannelsConfirmUnlinkDialog from "./ChannelsConfirmUnlinkDialog";
import queryString from 'querystring'
import Pagination from '../../../../components/Pagination'
import mutate_scUpdateStore from '../../../../graphql/mutate_scUpdateStore';
import { Card, CardBody, } from "../../../../_metronic/_partials/controls";
import LoadingDialog from "../../ProductsStore/products-list/dialog/LoadingDialog";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import mutate_scSaleChannelStoreSummary from "../../../../graphql/mutate_scSaleChannelStoreSummary";
import { useSubheader } from "../../../../_metronic/layout";
import mutate_ScConfigSyncWarehouseStore from "../../../../graphql/mutate_ scConfigSyncWarehouseStore";
import { ChevronRightOutlined } from "@material-ui/icons";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import query_sc_stores_warehouse from "../../../../graphql/query_sc_stores_warehouse";
import MappingWarehouseDialog from "./SyncWarehouseDialog/MappingWarehouseDialog";
import SyncUpWarehouseDialog from "./SyncWarehouseDialog/SyncUpWarehouseDialog";
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import query_scGetWarehouseMapping from "../../../../graphql/query_scGetWarehouseMapping";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import { useSelector } from "react-redux";

const SyncWarehouseSetting = () => {
    const location = useLocation()
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage } = useIntl()
    const history = useHistory()
    const [storeUnlinkCurrent, setStoreUnlinkCurrent] = useState()
    const [authorize, { data: dataAuthozie }] = useLazyQuery(scSaleAuthorizationUrl)
    const { addToast } = useToasts();
    const [show, setShow] = useState(false);
    const [confirmOff, setConfirmOff] = useState(false);
    const [showAutoConnect, setShowAutoConnect] = useState(null);
    const [currentStoreId, setCurrentStoreId] = useState(null);
    const [showMappingWarehouse, setShowMappingWarehouse] = useState(false);
    const [showSyncUpWarehouse, setShowSyncUpWarehouse] = useState(false);
    const [infoMergeStock, setInfoMergeStock] = useState({});
    const [idErrorRatio, setIdErrorRatio] = useState();
    const [valueRatio, setValueRadio] = useState("");
    const [loadingReload, setLoadingReload] = useState(false);
    const [storeSummary, setStoreSummary] = useState([]);
    const [infoConfigSyncWarehouse, setInfoConfigSyncWarehouse] = useState([]);
    const [confirmOpenConfigSyncWarehouse, setConfirmOpenConfigSyncWarehouse] = useState(false);
    const [confirmOffConfigSyncWarehouse, setConfirmOffConfigSyncWarehouse] = useState(false);
    const { setBreadcrumbs } = useSubheader();
    const user = useSelector((state) => state.auth.user);

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Cài đặt' }),
            },
            {
                title: formatMessage({ defaultMessage: 'Xử lý tồn đa kênh' }),
            },
        ])
    }, []);


    const [scUpdateStore, { loading: loadingUpdateStore }] = useMutation(mutate_scUpdateStore, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_stores_warehouse'],
    });

    const [scConfigSyncWarehouse, { loading: loadingConfigSyncWarehouse }] = useMutation(mutate_ScConfigSyncWarehouseStore, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_stores_warehouse'],
    });
    const [scSaleChannelStoreSummary] = useMutation(mutate_scSaleChannelStoreSummary);

    const { data, loading } = useQuery(query_sc_stores_warehouse, {
        fetchPolicy: "cache-and-network",
    });
    const { data: dataWarehouseMapping } = useQuery(query_scGetWarehouseMapping, {
        fetchPolicy: "cache-and-network",
    });
    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    })
    const parseData = useMemo(() => {
        return data?.sc_stores?.map(store => {
            const warehouseMappingStore = dataWarehouseMapping?.scGetWarehouseMapping.filter(wh => wh?.store_id == store?.id)
            const smeWarehouseId = warehouseMappingStore?.map(store => store?.sme_warehouse_id)
            const warehousesMapping = dataSmeWarehouse?.sme_warehouses?.flatMap(wh => {
                if (smeWarehouseId?.includes(wh?.id)) {
                    return {
                        id: wh?.id,
                        name: wh?.name,
                        address: wh?.address
                    }
                }
                return []
            })
            console.log(warehouseMappingStore)
            return {
                ...store,
                warehousesMapping,
                warehouseSyncNum: smeWarehouseId?.length,
                isMulti: warehouseMappingStore?.length > 1,
            }
        })
    }, [data, dataWarehouseMapping, dataSmeWarehouse])
    console.log('parseData', parseData)
    useMemo(async () => {
        let list_store_id = [];
        if (data?.sc_stores) {
            (data.sc_stores || []).forEach(element => {
                if (element.status == 1) {
                    list_store_id.push(element.id)
                }
            });
        }
        let res = await scSaleChannelStoreSummary({
            variables: {
                list_store_id: list_store_id
            }
        });
        setStoreSummary(res?.data?.scSaleChannelStoreSummary?.data);
    }, [data])
    console.log('parseData', parseData)
    const onConfirmInventorySync = async (id, merge_stock) => {
        let res = await scUpdateStore({
            variables: {
                store_id: id,
                merge_stock: merge_stock == 0 ? 10 : 0,
            }
        });
        setShow(false)
        setConfirmOff(false)
        if (res?.data?.scUpdateStore?.success) {
            addToast(res?.data?.scUpdateStore?.message || formatMessage({ defaultMessage: 'Cập nhật  thành công' }), { appearance: 'success' });
        } else {
            addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
        }
    }

    const onAutoConnectProduct = async () => {
        let res = await scUpdateStore({
            variables: {
                store_id: currentStoreId,
                is_product_link_auto: showAutoConnect == 'on' ? 1 : 0,
            }
        });

        setShowAutoConnect(null);
        setCurrentStoreId(null);
        if (res?.data?.scUpdateStore?.success) {
            addToast(res?.data?.scUpdateStore?.message || formatMessage({ defaultMessage: 'Cập nhật thành công' }), { appearance: 'success' });
        } else {
            addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
        }
    }

    useMemo(() => {
        if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
            window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
        }

    }, [dataAuthozie]);

    const pushRatio = (row) => {
        return (
            <>
                <div className="d-flex justify-content-start align-items-center">
                    <span style={{ width: '35px' }}>{row.percent_sync_up}%</span>
                    <OverlayTrigger
                        rootClose trigger="click" placement="right" overlay={popover(row)}>
                        <i onClick={() => { setValueRadio(row.percent_sync_up); setIdErrorRatio("") }} role="button" className="ml-2 text-dark far fa-edit"></i>
                    </OverlayTrigger>
                </div>
            </>
        )
    }
    const popover = (row) => {
        return (
            <Popover >
                <Popover.Title className="p-3" as="h6">{formatMessage({ defaultMessage: "Tỷ lệ đẩy tồn" })}
                </Popover.Title>
                <Popover.Content>
                    <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                        <input type="text" pattern="[0-9]*" style={{ height: '30px' }} onChange={(event) => handleChange(event)} value={valueRatio} className={`form-control mr-2 ${idErrorRatio ? 'border border-danger' : ''}`} />
                        <Button variant="primary" size="sm" onClick={() => handleSubmit(row.id)} className="mr-2 d-flex justify-content-center align-items-center"><i className="fas fa-check p-0 icon-nm"></i></Button>
                        <Button variant="secondary" onClick={() => document.body.click()} size="sm" className="d-flex justify-content-center align-items-center"><i className="fas fa-times p-0 icon-nm"></i></Button>
                    </div>
                </Popover.Content>
            </Popover>
        )
    };

    const handleSubmit = async (id) => {
        if (valueRatio == "") {
            setIdErrorRatio(id)
            addToast(formatMessage({ defaultMessage: "Vui lòng nhập tỷ lệ đẩy" }), { appearance: 'error' });
            return;
        }
        let res = await scUpdateStore({
            variables: {
                store_id: id,
                percent_sync_up: Number(valueRatio),
            }
        });
        if (res?.data?.scUpdateStore?.success) {
            addToast(res?.data?.scUpdateStore?.message || formatMessage({ defaultMessage: 'Cập nhật  thành công' }), { appearance: 'success' });
            document.body.click()
        } else {
            setIdErrorRatio(id)
            addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
        }

    }

    const handleChange = (event) => {

        const newValue = event.target.value;

        if (newValue === "" || newValue === null) {
            setValueRadio(newValue);
        }

        if (/^\d+$/.test(newValue) && newValue >= 0 && newValue <= 100) {
            setValueRadio(newValue);
        }

    }

    const columns = [
        {
            title: <span>{formatMessage({ defaultMessage: 'Tên gian hàng' })}</span>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '24%',
            render: (item, record) => {
                let channel = (data?.op_connector_channels || []).find(_channel => _channel?.code == record?.connector_channel_code)

                return <div className="d-flex align-items-center">
                    {!!channel && <img
                        className="mr-2"
                        style={{ width: 24, height: 24 }}
                        src={channel.logo_asset_url}
                        alt=""
                    />}
                    <span className={`font-size-h7`}>
                        {item}
                    </span>
                    {!!record?.enable_multi_warehouse && (
                        <svg className="ml-2 bi bi-house-door-fill" color="#ff5629" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5Z" />
                        </svg>
                    )}
                </div>
            }
        },
        {
            title: <div>
                <span className="mr-2">{formatMessage({ defaultMessage: 'Hàng hóa' })}</span>
                <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {formatMessage({ defaultMessage: "Tỷ lệ đã liên kết / Tổng Hàng hóa" })}
                        </Tooltip>
                    }
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                    </svg>
                </OverlayTrigger>
            </div>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                const dataStoreSummary = storeSummary?.find(item => item.store_id == record?.id);

                return (
                    <span>
                        {!dataStoreSummary && <span className="spinner spinner-primary" />}
                        {dataStoreSummary && <span> {dataStoreSummary?.variant_linked}/{dataStoreSummary?.sum_variant} </span>}
                    </span>
                )
            }
        },
        {
            title: <span>{formatMessage({ defaultMessage: 'Cài đặt đẩy tồn' })}</span>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '20%',
            render: (item, record) => {

                return <div className="d-flex align-items-center justify-content-around">
                    <div className="d-flex justify-content-between aign-items-center">
                        <div>
                            <div
                                className='d-flex align-items-center mb-2'
                            // onClick={() => {
                            //     setCurrentStoreId(record?.id);
                            //     setShowMappingWarehouse(true);
                            // }}
                            >
                                <span className="fs-14">{formatMessage({ defaultMessage: "Tồn từ kho: {mergeStock}" }, { mergeStock: `${!!record?.merge_stock ? 'Bật' : 'Tắt'}` })}</span>
                            </div>
                            <div
                                className='d-flex align-items-center'
                            // onClick={() => {
                            //     setCurrentStoreId(record?.id);
                            //     setShowSyncUpWarehouse(true);
                            // }}
                            >
                                <span className="fs-14">{formatMessage({ defaultMessage: "Quy tắc đẩy tồn: {rule}" }, { rule: `${record?.type_push_inventory == 1 ? 'Gian hàng' : record?.type_push_inventory == 2 ? 'Hàng hóa' : '--'}` })}</span>
                            </div>
                        </div>

                    </div>
                    <AuthorizationWrapper keys={['setting_sync_warehouse_action']}>
                        <i onClick={() => history.push(`/setting/setting-push-inventory?store=${record?.id}`)} className="far fa-edit cursor-pointer text-primary" style={{ margin: 'auto 10px', fontSize: '14px' }}></i>
                    </AuthorizationWrapper>
                </div>
            }
        },
        {
            title: <span>{formatMessage({ defaultMessage: 'Cài đặt liên kết kho' })}</span>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '22%',
            render: (item, record) => {
                console.log(record?.warehouseSyncNum)
                const viewWarehouse = () => {
                    if(!user?.is_subuser) {
                        if (record?.isMulti) {
                            return `${record?.warehousesMapping?.length} Kho`
                        }
                        if (!record?.isMulti) {
                            return record?.warehousesMapping?.length ? record?.warehousesMapping[0]?.name : (
                                <AuthorizationWrapper keys={['setting_sync_warehouse_action']}>
                                    <span onClick={() => {
                                        setCurrentStoreId(record?.id);
                                        setShowMappingWarehouse(true);
                                    }} className="cursor-pointer text-primary">
                                        {formatMessage({ defaultMessage: 'Liên kết kho' })}
                                    </span>
                                </AuthorizationWrapper>
                            )
                        }
                        return null
                    } else {
                        if (record?.isMulti) {
                            return `${record?.warehouseSyncNum} Kho`
                        }
                        if (!record?.isMulti && record?.warehouseSyncNum) {
                            return record?.warehousesMapping?.length ? record?.warehousesMapping[0]?.name : <span></span>
                        } else if(!record?.isMulti && !record?.warehouseSyncNum ) {
                            return (
                                <AuthorizationWrapper keys={['setting_sync_warehouse_action']}>
                                    <span onClick={() => {
                                        setCurrentStoreId(record?.id);
                                        setShowMappingWarehouse(true);
                                    }} className="cursor-pointer text-primary">
                                        {formatMessage({ defaultMessage: 'Liên kết kho' })}
                                    </span>
                                </AuthorizationWrapper>
                            )
                        }
                        return null
                    }
                }

                return (
                    <div className="d-flex align-items-center justify-content-around">
                        <div className="mr-2">{viewWarehouse()}</div>
                        {(record?.isMulti || (!record?.isMulti && !!record?.warehousesMapping?.length)) && (
                            <AuthorizationWrapper keys={['setting_sync_warehouse_action']}>
                                <i onClick={() => {
                                    setCurrentStoreId(record?.id);
                                    setShowMappingWarehouse(true);
                                }} className="far fa-edit cursor-pointer text-primary"
                                    style={{ margin: 'auto 10px', fontSize: '14px' }}></i>
                            </AuthorizationWrapper>
                        )}

                        {/* <div className="d-flex flex-column align-items-start justify-content-start">
                            <div className="mb-2 d-flex align-items-center">
                                <span className="mr-4">
                                    {formatMessage({ defaultMessage: "Tự động đẩy tồn" })}:
                                </span>
                                <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                    <label>
                                        <input
                                            type={'checkbox'}
                                            disabled={!record?.has_sync_warehouse}
                                            style={{ background: '#F7F7FA', border: 'none' }}
                                            onChange={async () => {
                                                if (!record?.merge_stock) {
                                                    setShow(true)
                                                    setInfoMergeStock({
                                                        store_id: record?.id,
                                                        merge_stock: record?.merge_stock,
                                                    })
                                                } else {
                                                    setConfirmOff(true)
                                                    setInfoMergeStock({
                                                        store_id: record?.id,
                                                        merge_stock: record?.merge_stock,
                                                    })
                                                }
                                            }}
                                            checked={record?.merge_stock}
                                        />
                                        <span></span>
                                    </label>
                                </span>
                            </div>
                            <div className="d-flex align-items-center">
                                <span className="mr-2">
                                    {formatMessage({ defaultMessage: "Tự động liên kết" })}
                                </span>
                                <span className="mr-2" style={{ position: 'relative', top: -1 }}>
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Hệ thống sẽ tự động liên kết đơn với hàng hoá kho khi hàng hoá sàn trùng SKU với hàng hoá kho' })}
                                            </Tooltip>
                                        }
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                        </svg>
                                    </OverlayTrigger>
                                </span>
                                <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                    <label>
                                        <input
                                            type={'checkbox'}
                                            disabled={!record?.has_sync_warehouse}
                                            style={{ background: '#F7F7FA', border: 'none' }}
                                            onChange={async () => {
                                                setCurrentStoreId(record?.id);
                                                setShowAutoConnect(!record?.is_product_link_auto ? 'on' : 'off');
                                            }}
                                            checked={!!record?.is_product_link_auto}
                                        />
                                        <span></span>
                                    </label>
                                </span>
                            </div>
                        </div> */}
                    </div>
                )
            }
        },
        {
            title: <div>
                <span className="mr-2">{formatMessage({ defaultMessage: 'Cài đặt tính năng' })}</span>
            </div>,
            key: 'has_sync_warehouse',
            dataIndex: 'has_sync_warehouse',
            align: 'center',
            width: '19%',
            render: (item, record) => {
                return (
                    <div>
                        <div className="mb-2" style={{ display: 'grid', gridTemplateColumns: '70% auto', gap: '5px 5px', justifyContent: 'center' }}>
                            <div className="mx-2 d-flex align-items-center justify-content-end">
                                <span>{formatMessage({ defaultMessage: 'Xử lý tồn kho' })}</span>
                                <TooltipWrapper note={formatMessage({ defaultMessage: "Hệ thống sẽ thực hiện khấu trừ tồn vào hàng hóa kho khi phát sinh đơn và xử lý đơn hàng" })}>
                                    <i className="fas fa-info-circle fs-14 ml-2"></i>
                                </TooltipWrapper>
                            </div>
                            <div className="d-flex justify-content-end">
                                <span className="switch d-flex justify-content-center" style={{ transform: 'scale(0.8)' }}>
                                    <label>
                                        <input
                                            disabled={user?.is_subuser && !['setting_sync_warehouse_action']?.some(key => user?.permissions?.includes(key))}
                                            type={'checkbox'}
                                            style={{ background: '#F7F7FA', border: 'none' }}
                                            onChange={async () => {
                                                if (!item) {
                                                    setConfirmOffConfigSyncWarehouse(true)
                                                    setInfoConfigSyncWarehouse({
                                                        store_id: record?.id,
                                                        enable_sync_wh: item,
                                                    })
                                                } else {
                                                    setConfirmOpenConfigSyncWarehouse(true)

                                                    setInfoConfigSyncWarehouse({
                                                        store_id: record?.id,
                                                        enable_sync_wh: item,
                                                    })
                                                }

                                            }}
                                            checked={item}
                                        />
                                        <span></span>
                                    </label>
                                </span>
                            </div>
                        </div>

                        <div className="mb-2 d-flex align-items-center justify-content-end" style={{ display: 'grid', gridTemplateColumns: '70% auto', gap: '5px 5px', justifyContent: 'center' }}>
                            <div className="mx-2">
                                <span>{formatMessage({ defaultMessage: 'Tự động liên kết' })}</span>
                                <TooltipWrapper note={formatMessage({ defaultMessage: "Hệ thống sẽ tự động liên kết đơn với hàng hoá kho khi hàng hoá sàn trùng SKU với hàng hoá kho" })}>
                                    <i className="fas fa-info-circle fs-14 ml-2"></i>
                                </TooltipWrapper>
                            </div>
                            <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                <label>
                                    <input
                                        type={'checkbox'}
                                        disabled={!record?.has_sync_warehouse || user?.is_subuser && !['setting_sync_warehouse_action']?.some(key => user?.permissions?.includes(key))}
                                        style={{ background: '#F7F7FA', border: 'none' }}
                                        onChange={async () => {
                                            setCurrentStoreId(record?.id);
                                            setShowAutoConnect(!record?.is_product_link_auto ? 'on' : 'off');
                                        }}
                                        checked={!!record?.is_product_link_auto}
                                    />
                                    <span></span>
                                </label>
                            </span>
                        </div>
                    </div>
                )
            }
        },
    ];

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Xử lý tồn đa kênh" }) + "- UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Xử lý tồn đa kênh" }) + "- UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Xử lý tồn đa kênh" }) + "- UpBase"} />
            </Helmet>

            <LoadingDialog show={loadingReload || loadingUpdateStore || loadingConfigSyncWarehouse} />
            {!!storeUnlinkCurrent && <ChannelsConfirmUnlinkDialog
                show={true}
                storeUnlinkCurrent={storeUnlinkCurrent}
                onHide={() => {
                    setStoreUnlinkCurrent(null)
                }}
            />}

            <Card >
                <CardBody>
                    <div className="d-flex align-items-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-info bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                            <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                        </svg>
                        <span className="text-info fs-14">
                            {formatMessage({ defaultMessage: 'Khi cần xử lý kiểm kho bạn có thể tắt xử lý tồn để hệ thống không tác động đến thay đổi tồn của kho, kiểm kho xong bạn có thể bật lại bình thường.' })}
                        </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        {loading && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                <span className="spinner spinner-primary" />
                            </div>
                        )}
                        <Table
                            style={loading ? { opacity: 0.4 } : { borderBottom: '1px solid #d9d9d9' }}
                            className="upbase-table"
                            columns={columns}
                            data={parseData?.length ? parseData : []}
                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                            </div>}
                            tableLayout="auto"
                            sticky={{ offsetHeader: 45 }}
                        />
                    </div>
                </CardBody>
            </Card>
            {showMappingWarehouse && <MappingWarehouseDialog
                show={showMappingWarehouse}
                storeId={currentStoreId}
                onHide={() => setShowMappingWarehouse(false)}
            />}

            {showSyncUpWarehouse && <SyncUpWarehouseDialog
                show={showSyncUpWarehouse}
                storeId={currentStoreId}
                onHide={() => setShowSyncUpWarehouse(false)}
            />}

            <Modal
                show={show || confirmOff}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                size="md"
                onHide={() => {
                    if (confirmOff) {
                        setConfirmOff(false)
                    }
                    if (show) {
                        setShow(false);
                    }


                }}
                backdrop={true}
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='text-center'>
                        <div className="mb-6" >
                            <b>{formatMessage({ defaultMessage: 'Tự động đẩy tồn' })}</b>
                            <p>{!confirmOff ?
                                formatMessage({ defaultMessage: 'Tự động đẩy tồn sản phẩm kho lên sàn (Với những sản phẩm sàn liên kết với kho) mỗi khi có thay đổi. Ví dụ: có đơn hàng từ kênh bán hoặc bạn điều chỉnh tồn kho' }) :
                                formatMessage({ defaultMessage: 'Khi tắt tự động đẩy tồn sẽ không đồng bộ tồn của sản phẩm kho lên sàn mỗi khi có thay đổi' })}. </p>
                        </div>
                        <div className="form-group mb-0">
                            <button
                                id="kt_login_signin_submit"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 100 }}
                                onClick={e => {

                                    e.preventDefault();
                                    if (confirmOff) {
                                        setConfirmOff(false)
                                    }
                                    if (show) {
                                        setShow(false);
                                    }
                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'KHÔNG' })}</span>
                            </button>
                            <button
                                className={`btn btn-primary font-weight-bold`}
                                onClick={() => onConfirmInventorySync(infoMergeStock?.store_id, infoMergeStock?.merge_stock)}
                            >
                                <span className="font-weight-boldest">{confirmOff ? formatMessage({ defaultMessage: 'TẮT ĐỒNG BỘ' }) : formatMessage({ defaultMessage: 'BẬT ĐỒNG BỘ' })}</span>
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            <Modal
                show={confirmOpenConfigSyncWarehouse || confirmOffConfigSyncWarehouse}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                size="md"
                backdrop={true}
                onHide={() => {
                    if (confirmOffConfigSyncWarehouse) {
                        setConfirmOffConfigSyncWarehouse(false)
                    }
                    if (confirmOpenConfigSyncWarehouse) {
                        setConfirmOpenConfigSyncWarehouse(false);
                    }


                }}
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='text-center'>
                        <div className="mb-6" >
                            <b>{formatMessage({ defaultMessage: ' Xử lý tồn kho' })}</b>
                            <p>{!confirmOffConfigSyncWarehouse ? formatMessage({ defaultMessage: 'Khi tắt xử lý tồn kho sẽ không thực hiện khấu trừ tồn vào hàng hoá kho khi phát sinh đơn và xử lý đơn hàng' }) : formatMessage({ defaultMessage: 'Hệ thống sẽ thực hiện khấu trừ tồn vào hàng hoá kho khi phát sinh đơn và xử lý đơn hàng' })}</p>
                        </div>
                        <div className="form-group mb-0">
                            <button
                                id="kt_login_signin_submit"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 100 }}
                                onClick={e => {

                                    e.preventDefault();

                                    setConfirmOffConfigSyncWarehouse(false)

                                    setConfirmOpenConfigSyncWarehouse(false);
                                }}
                            >
                                <span className="font-weight-boldest">{!confirmOffConfigSyncWarehouse ? formatMessage({ defaultMessage: 'ĐÓNG' }) : formatMessage({ defaultMessage: 'KHÔNG' })}</span>
                            </button>
                            <button
                                className={`btn btn-primary font-weight-bold`}
                                onClick={async () => {
                                    let res = await scConfigSyncWarehouse({
                                        variables: {
                                            store_id: infoConfigSyncWarehouse?.store_id,
                                            enable_sync_wh: infoConfigSyncWarehouse?.enable_sync_wh == 1 ? 0 : 1,
                                        }
                                    });
                                    if (res?.data?.scConfigSyncWarehouseStore?.success) {
                                        setConfirmOffConfigSyncWarehouse(false)

                                        setConfirmOpenConfigSyncWarehouse(false);
                                        addToast(res?.data?.scConfigSyncWarehouseStore?.message || formatMessage({ defaultMessage: 'Cập nhật  thành công' }), { appearance: 'success' });
                                    } else {
                                        setConfirmOffConfigSyncWarehouse(false)

                                        setConfirmOpenConfigSyncWarehouse(false);
                                        addToast(res?.data?.scConfigSyncWarehouseStore?.message || formatMessage({ defaultMessage: 'Cập nhật thất bại' }), { appearance: 'error' });
                                    }
                                }}
                            >
                                <span className="font-weight-boldest">{!confirmOffConfigSyncWarehouse ? formatMessage({ defaultMessage: 'TẮT XỬ LÝ TỒN' }) : formatMessage({ defaultMessage: 'BẬT XỬ LÝ TỒN' })}</span>
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Confirm auto connect */}
            <Modal
                show={!!showAutoConnect && !loadingUpdateStore}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                size="md"
                backdrop={true}
                onHide={() => {
                    setShowAutoConnect(null);
                    setCurrentStoreId(null);
                }}
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    {!!showAutoConnect && (
                        <div className='text-center'>
                            <div className="mb-4" >
                                <b className="fs-16">
                                    {showAutoConnect == 'on'
                                        ? formatMessage({ defaultMessage: 'Tự động liên kết đơn với hàng hoá kho' })
                                        : formatMessage({ defaultMessage: 'Tắt tự động liên kết đơn với hàng hoá kho' })
                                    }
                                </b>
                            </div>
                            <div className="mb-6">
                                <p>
                                    {showAutoConnect == 'on'
                                        ? formatMessage({ defaultMessage: 'Khi đơn hàng chưa được liên kết kho thì hệ thống sẽ tự động liên kết với hàng hoá kho nếu sản phẩm trong đơn có SKU trùng với hàng hoá trong kho.' })
                                        : formatMessage({ defaultMessage: 'Khi đơn hàng chưa được liên kết kho thì hệ thống sẽ KHÔNG tự động liên kết với hàng hoá kho nếu sản phẩm trong đơn có SKU trùng với hàng hoá trong kho. Bạn có muốn tắt tự động liên kết kho?' })
                                    }
                                </p>
                            </div>
                            <div className="form-group mb-0">
                                <button
                                    id="kt_login_signin_submit"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 120 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        setShowAutoConnect(null);
                                        setCurrentStoreId(null);
                                    }}
                                >
                                    <span className="font-weight-boldest">
                                        {formatMessage({ defaultMessage: 'Không' })}
                                    </span>
                                </button>
                                <button
                                    className={`btn btn-primary font-weight-bold`}
                                    style={{ minWidth: 120 }}
                                    onClick={onAutoConnectProduct}
                                >
                                    <span className="font-weight-boldest">
                                        {showAutoConnect == 'on'
                                            ? formatMessage({ defaultMessage: 'Bật liên kết' })
                                            : formatMessage({ defaultMessage: 'Đồng ý' })
                                        }
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Fragment >
    )
};

export default memo(SyncWarehouseSetting);

export const actionKeys = {
    "setting_sync_warehouse_view": {
        router: '/setting/sync-warehouse',
        actions: [
            "scSaleChannelStoreSummary",
            "op_connector_channels",
            "sme_warehouses",
            "scGetWarehouseMapping",
            "sc_stores",
            "scGetProductVariants",
            "sme_warehouses",
            "scGetSettingPushInventory"
        ],
        name: 'Danh sách xử lý tồn đã kênh',
        group_code: 'setting_sync_warehouse',
        group_name: 'Xử lý tồn đa kênh',
        cate_code: 'setting_service',
        cate_name: 'Cài đặt',
    },
    "setting_sync_warehouse_action": {
        router: '/setting/sync-warehouse',
        actions: [
            "sc_stores_warehouse",
            "scUpdateStore",
            "scConfigSyncWarehouseStore",
            "scSaleChannelStoreSummary",
            "scAddVariantPushInventory",
            "scGetSettingPushInventory",
            "scUpdateSettingPushInventory",
            "scGetWarehouseMapping",
            "scUpdateWarehouseMapping"
        ],
        name: 'Các thao tác trong màn xử lý tồn đa kênh',
        group_code: 'setting_sync_warehouse',
        group_name: 'Xử lý tồn đa kênh',
        cate_code: 'setting_service',
        cate_name: 'Cài đặt',
    }
};
