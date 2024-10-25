import { useIntl } from 'react-intl';
import RcTable from 'rc-table';
import React, { Fragment, useCallback, useMemo, useState } from 'react'
import Pagination from '../../../../components/Pagination';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications';
import dayjs from 'dayjs';
import SVG from "react-inlinesvg";
import { useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation, useParams } from "react-router-dom";
import queryString from "querystring";
import { HomeOutlined, AssignmentTurnedInOutlined } from "@material-ui/icons";
import { SUBTAB } from './Constants';
import query_userGetListProductSyncFullfillment from '../../../../graphql/query_userGetListProductSyncFullfillment'
import { Checkbox } from '../../../../_metronic/_partials/controls';
import client from '../../../../apollo'
import query_sme_catalog_product_variant from "../../../../graphql/query_sme_catalog_product_variant";
import query_userCountProductSyncFullfillment from '../../../../graphql/query_userCountProductSyncFullfillment'
import mutate_userSyncProductFullfillment from '../../../../graphql/mutate_userSyncProductFullfillment'
import mutate_userSyncInventoryFullfillment from '../../../../graphql/mutate_userSyncInventoryFullfillment'
import { Link } from 'react-router-dom'
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
import { Dropdown, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { formatNumberToCurrency } from '../../../../utils';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import mutate_userSyncAllProductFromFullfillment from '../../../../graphql/mutate_userSyncAllProductFromFullfillment';
import { flatten } from 'lodash';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper';
import mutate_prvUpdateSyncOrderProviderConnected from '../../../../graphql/mutate_prvUpdateSyncOrderProviderConnected';
import query_prvProviderConnectedDetail from '../../../../graphql/query_prvProviderConnectedDetail';
import LoadingDialog from '../../FrameImage/LoadingDialog';
import { ModalConfigVietful } from './components/ModalConfigVietful';


const TableProviderProduct = () => {
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts()
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage } = useIntl()
    const [ids, setIds] = useState([])
    const [search, setSearch] = useState(params?.q || '')
    const [productVariants, setProductVarians] = useState([])
    const [showConfirmSync, setShowConfirmSync] = useState(null);
    const [showModalConfig, setShowModalConfig] = useState(false);
    const [config, setConfig] = useState(1);
    let { id } = useParams();

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

    const pageSize = useMemo(() => {
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

    const searchText = useMemo(() => {
        if (params?.q) {
            return { searchText: params.q }
        }
        return {}
    }, [params.q]);

    const type = useMemo(() => {
        return { type: params.status || 'synced_success' }
    }, [params.status]);


    let whereConditions = useMemo(() => {
        return {
            page,
            pageSize,
            ...searchText,
            ...type,
            connectedProviderId: params?.id
        }

    }, [page, pageSize, searchText, params?.id, type])

    const queryGetProductVariants = async (ids) => {
        if (ids?.length == 0) return [];

        const { data } = await client.query({
            query: query_sme_catalog_product_variant,
            variables: {
                where: {
                    id: { _in: ids },
                },
            },
            fetchPolicy: "network-only",
        });

        return data?.sme_catalog_product_variant || [];
    }

    const { data: dataProviderConnectedDetail } = useQuery(query_prvProviderConnectedDetail, {
        variables: { id: +params?.id },
        fetchPolicy: 'cache-and-network',
    });

    const [userSyncProductFullfillment] = useMutation(mutate_userSyncProductFullfillment, {
        awaitRefetchQueries: true,
        refetchQueries: ['userGetListProductSyncFullfillment', 'userCountProductSyncFullfillment']
    })
    const [userSyncInventoryFullfillment] = useMutation(mutate_userSyncInventoryFullfillment, {
        awaitRefetchQueries: true,
        refetchQueries: ['userGetListProductSyncFullfillment', 'userCountProductSyncFullfillment']
    })

    const [userSyncAllProductFromFullfillment] = useMutation(mutate_userSyncAllProductFromFullfillment, {
        awaitRefetchQueries: true,
        refetchQueries: ['userGetListProductSyncFullfillment', 'userCountProductSyncFullfillment']
    })


    const [prvUpdateSyncOrderProviderConnected, { loading: loadingPrvUpdateSyncOrderProviderConnected }] = useMutation(mutate_prvUpdateSyncOrderProviderConnected, {
        awaitRefetchQueries: true,
        refetchQueries: ['prvProviderConnectedDetail']
    });

    const { loading: loadingListProductSyncFullfillment, error, data: dataListProductSyncFullfillment, refetch } = useQuery(query_userGetListProductSyncFullfillment, {
        fetchPolicy: "cache-and-network",
        variables: {
            ...whereConditions
        }
    });

    const { loading: loadingCount, data: countProductSyncFullfillment } = useQuery(query_userCountProductSyncFullfillment, {
        fetchPolicy: "cache-and-network",
        variables: {
            ...searchText,
            connectedProviderId: params?.id
        }
    });

    const onUpdateSyncOrderProviderConnected = useCallback(async ({ isSync, type }) => {
        const ACTIONS_NAME = {
            'manual': 'đồng bộ đơn hàng thủ công',
            'platform': 'đồng bộ đơn hàng từ sàn',
            'package_pending': 'đồng bộ đơn chờ duyệt',
        };

        const { data } = await prvUpdateSyncOrderProviderConnected({
            variables: {
                provider_connected_id: +params?.id,
                ...(type == 'manual' ? {
                    sync_manual: isSync ? 1 : 0
                } : {
                    sync_manual: dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_manual
                }),
                ...(type == 'platform' ? {
                    sync_platform: isSync ? 1 : 0
                } : {
                    sync_platform: dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_platform
                }),
                ...(type == 'package_pending' ? {
                    sync_package_pending: isSync ? 1 : 0
                } : {
                    sync_package_pending: dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_package_pending
                }),
            }
        });

        if (data?.prvUpdateSyncOrderProviderConnected?.success) {
            addToast(formatMessage({ defaultMessage: 'Cấu hình {name} thành công' }, { name: ACTIONS_NAME?.[type] }), { appearance: 'success' })
        } else {
            addToast(data?.prvUpdateSyncOrderProviderConnected?.message || formatMessage({ defaultMessage: 'Cấu hình {name} thất bại' }, { name: ACTIONS_NAME?.[type] }), { appearance: 'error' })
        }
    }, [showConfirmSync, dataProviderConnectedDetail?.prvProviderConnectedDetail]);

    const countProductSync = (status) => {
        const { countNotSynced, countSyncedFail, countSyncedSuccess } = countProductSyncFullfillment?.userCountProductSyncFullfillment ?? {}

        if (status == 'not_synced') {
            return countNotSynced
        }
        if (status == 'synced_faild') {
            return countSyncedFail
        }
        return countSyncedSuccess
    }

    useMemo(async () => {
        try {
            const productVariants = await queryGetProductVariants([...dataListProductSyncFullfillment?.userGetListProductSyncFullfillment?.items?.map(item => item?.variant_id)])
            const data = productVariants?.map(variant => ({
                id: variant?.id,
                image: variant?.sme_catalog_product_variant_assets?.[0]?.asset_url,
                is_combo: variant?.is_combo,
                variant_full_name: variant?.variant_full_name,
                sme_catalog_product_id: variant?.sme_catalog_product?.id,
                provider_info: variant?.provider_links?.find(item => item?.provider_connected_id == params?.id),
                unit: variant?.unit
            }))
            setProductVarians(data)
        } catch (err) {

        }
    }, [dataListProductSyncFullfillment])

    const dataTable = useMemo(() => {

        const data = dataListProductSyncFullfillment?.userGetListProductSyncFullfillment?.items?.map(item => {
            if (item?.errorMessage) {
                return [
                    {
                        sku: item?.sku,
                        name: item?.name,
                        stockActual: item?.stockActual,
                        stockAvailable: item?.stockAvailable,
                        stockReserve: item?.stockReserve,
                        synced: item?.synced,
                        syncedDate: item?.syncedDate,
                        updatedDate: item?.updatedDate,
                        variant_id: item?.variant_id
                    }, { errorMessage: item?.errorMessage }]
            }
            return {
                sku: item?.sku,
                name: item?.name,
                stockActual: item?.stockActual,
                stockAvailable: item?.stockAvailable,
                stockReserve: item?.stockReserve,
                synced: item?.synced,
                syncedDate: item?.syncedDate,
                updatedDate: item?.updatedDate,
                variant_id: item?.variant_id
            }
        })
        return flatten(data)

    }, [dataListProductSyncFullfillment])

    const toast = (status, msg) => {
        addToast(msg, { appearance: !!status ? 'success' : 'error' })
    }

    const handleUserSyncAllProductFromFullfillment = async () => {
        try {
            const { data } = await userSyncAllProductFromFullfillment({
                variables: {
                    providerConnectedId: +params?.id,
                }
            })
            toast(data?.userSyncAllProductFromFullfillment?.success, data?.userSyncAllProductFromFullfillment?.message)
            setIds([])
        } catch (err) {

        }
    }


    const handleSyncProductFullfillment = () => {
        setShowModalConfig(true)
    }

    const handleSyncInventoryFullfillment = async () => {
        try {
            const { data } = await userSyncInventoryFullfillment({
                variables: {
                    userSyncProductFullfillmentInput: {
                        providerConnectedId: +params?.id,
                        variantIds: ids?.map(it => it?.variant_id)
                    }
                }
            })
            toast(data?.userSyncInventoryFullfillment?.success, data?.userSyncInventoryFullfillment?.message)
            setIds([])
        } catch (err) {

        }
    }


    const viewAction = useMemo(() => {
        const views = {
            'synced_success': (
                // <button onClick={handleSyncInventoryFullfillment} type="button" disabled={!ids.length} className="btn btn-primary mr-3 px-8" style={{ width: 'max-content', background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}>
                //     {formatMessage({ defaultMessage: 'Đồng bộ thông tin tồn' })}
                // </button>
                <Dropdown drop='down'>
                    <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <>
                            <Dropdown.Item className="mb-1 d-flex" onClick={handleSyncInventoryFullfillment} >
                                {formatMessage({ defaultMessage: "Đồng bộ thông tin tồn" })}
                            </Dropdown.Item>
                            <Dropdown.Item className="mb-1 d-flex" onClick={handleUserSyncAllProductFromFullfillment}>
                                {formatMessage({ defaultMessage: 'Tải thông tin sản phẩm' })}
                            </Dropdown.Item>
                        </>
                    </Dropdown.Menu>
                </Dropdown>
            ),
            'not_synced': (
                <Dropdown drop='down'>
                    <Dropdown.Toggle disabled={!ids.length} className={`${ids?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <>
                            <Dropdown.Item className="mb-1 d-flex" onClick={handleSyncProductFullfillment} >
                                {formatMessage({ defaultMessage: "Đồng bộ sản phẩm" })}
                            </Dropdown.Item>
                            <Dropdown.Item className="mb-1 d-flex" onClick={handleUserSyncAllProductFromFullfillment}>
                                {formatMessage({ defaultMessage: 'Tải thông tin sản phẩm' })}
                            </Dropdown.Item>
                        </>
                    </Dropdown.Menu>
                </Dropdown>
            ),
            'synced_faild': (
                <button onClick={handleSyncProductFullfillment} type="button" disabled={!ids.length} className="btn btn-primary mr-3 px-8" style={{ width: 'max-content', background: ids?.length == 0 ? "#6c757d" : "", border: ids?.length == 0 ? "#6c757d" : "" }}>
                    {formatMessage({ defaultMessage: 'Đồng bộ sản phẩm' })}
                </button>
            )
        }

        return views[params?.status || 'synced_success']

    }, [ids, params.status, handleSyncProductFullfillment, handleUserSyncAllProductFromFullfillment, handleSyncInventoryFullfillment])

    const errorView = () => {
        return (
            <div
                className="w-100 text-center mt-8r"
                style={{ position: "absolute", zIndex: 100, left: '50%', transform: 'translateX(-50%)' }}
            >
                <div className="d-flex flex-column justify-content-center align-items-center">
                    <i
                        className="far fa-times-circle text-danger"
                        style={{ fontSize: 48, marginBottom: 8 }}
                    ></i>
                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                    <button
                        className="btn btn-primary btn-elevate"
                        style={{ width: 100 }}
                        onClick={(e) => {
                            e.preventDefault();
                            refetch();
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Tải lại' })}
                    </button>
                </div>
            </div>
        )
    }

    const isSelectAll = ids.length > 0 && ids.filter((x) => dataTable?.filter(x => !x?.errorMessage)?.some((item) => item.variant_id === x.variant_id))?.length == dataTable?.filter(x => !x?.errorMessage)?.length;

    const columns = [
        {
            title: <div className="d-flex align-items-center">
                <Checkbox
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    isSelected={isSelectAll}
                    onChange={(e) => {
                        if (isSelectAll) {
                            setIds(ids.filter((x) => !dataTable?.filter(x => !x?.errorMessage)?.some((item) => item.variant_id === x.variant_id)));
                        } else {
                            const tempArray = [...ids];
                            (dataTable?.filter(x => !x?.errorMessage) || []).forEach((product) => {
                                if (product && !ids.some((item) => item.variant_id === product.variant_id)) {
                                    tempArray.push(product);
                                }
                            });
                            setIds(tempArray);
                        }
                    }}
                />
                <span className="ml-2">SKU</span>
            </div>,
            align: 'left',
            width: 250,
            className: 'p-0',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 9 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div style={{ padding: '7px', color: '#F80D0D', background: 'rgba(254, 86, 41, 0.31)' }}>{item?.errorMessage}</div>
                }
                const productVariant = productVariants?.find(variant => variant?.id == item?.variant_id)
                return (
                    <div style={{ padding: '7px' }} className='d-flex align-items-center'>
                        <Checkbox inputProps={{ 'aria-label': 'checkbox', }} isSelected={ids.some((_id) => _id.variant_id == item.variant_id)}
                            onChange={(e) => {
                                if (ids.some((_id) => _id.variant_id == item.variant_id)) {
                                    setIds((prev) =>
                                        prev.filter((_id) => _id.variant_id != item.variant_id)
                                    );
                                } else {
                                    setIds((prev) => prev.concat([item]));
                                }
                            }}
                        />

                        <div style={{ cursor: 'pointer' }} onClick={() => window.open(!!productVariant?.is_combo ? `/products/edit-combo/${productVariant?.sme_catalog_product_id}` : `/products/edit/${productVariant?.sme_catalog_product_id}`, '_blank')} className='d-flex ml-2'>
                            <InfoProduct sku={item?.sku} isSingle />
                        </div>
                    </div>
                )
            }
        },
        (params?.status == 'synced_success' || !params?.status) &&{
            title: formatMessage({defaultMessage: 'SKU đối tác'}),
            align: 'left',
            width: 250,
            className: 'p-0',
            render: (record, item) => {
                const productVariant = productVariants?.find(variant => variant?.id == item?.variant_id)
                return (
                            <span className='p-2'>{productVariant?.provider_info?.provider_sku || '--'}</span>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tên hàng hóa' }),
            align: 'left',
            width: 250,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                const productVariant = productVariants?.find(variant => variant?.id == item?.variant_id)
                return (
                    <div>
                        <div className='d-flex align-items-center'>

                            <div style={{ backgroundColor: '#F7F7FA', width: 30, height: 30, borderRadius: 4, overflow: 'hidden', minWidth: 30 }} className='mr-2' >
                                {!productVariant ? <Skeleton style={{ width: 30, height: 30, borderRadius: 4 }} count={1} />
                                    : <div onClick={() => window.open(!!productVariant?.is_combo ? `/products/edit-combo/${productVariant?.sme_catalog_product_id}` : `/products/edit/${productVariant?.sme_catalog_product_id}`, '_blank')}>
                                        <HoverImage
                                            styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                            size={{ width: 320, height: 320 }}
                                            defaultSize={{ width: 30, height: 30 }}
                                            url={productVariant?.image || ''} />
                                    </div>
                                }
                            </div>
                            <div>
                                <div className='d-flex'>
                                    {!productVariant?.variant_full_name ? <Skeleton style={{ width: 250, height: 30, borderRadius: 4 }} count={1} /> : (
                                        <InfoProduct url={!!productVariant?.is_combo ? `/products/edit-combo/${productVariant?.sme_catalog_product_id}` : `/products/edit/${productVariant?.sme_catalog_product_id}`} name={productVariant?.variant_full_name} isSingle />
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái kết nối' }),
            align: 'center',
            width: 160,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                const viewStatus = () => {
                    if (params?.status == 'synced_faild') {
                        return <div style={{ color: 'black' }}>{formatMessage({ defaultMessage: ' Chưa đồng bộ' })}</div>
                    }
                    if (params?.status == 'not_synced') {
                        return <div style={{ color: '#FF0000' }}>{formatMessage({ defaultMessage: 'Chưa đồng bộ' })}</div>
                    }
                    return <div style={{ color: '#3DA153' }}>{formatMessage({ defaultMessage: 'Đã đồng bộ' })}</div>
                }
                return (
                    <div>
                        {viewStatus()}
                    </div>
                )
            }
        },
        (params?.status == 'synced_success' || !params?.status) &&{
            title: formatMessage({ defaultMessage: 'ĐVT' }),
            align: 'center',
            width: 160,
            render: (record, item) => {
                const productVariant = productVariants?.find(variant => variant?.id == item?.variant_id)
                return (
                    <div>
                        {productVariant?.unit || '--'}
                    </div>
                )
            }
        },
        {
            title: <OverlayTrigger
                overlay={
                    <Tooltip title='#1234443241434'>
                        {formatMessage({ defaultMessage: 'Tồn kho thực tế' })}
                    </Tooltip>
                }
            >
                <HomeOutlined />
            </OverlayTrigger>,
            align: 'center',
            width: 100,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                return (
                    <b>{formatNumberToCurrency(item?.stockActual)}</b>
                )
            }
        },
        {
            title: <OverlayTrigger
                overlay={
                    <Tooltip title='#1234443241434'>
                        {formatMessage({ defaultMessage: 'Tồn dự trữ' })}
                    </Tooltip>
                }
            >
                <SVG style={{ width: 16, height: 16 }} src={toAbsoluteUrl("/media/menu/ic_sp_kho.svg")} />
            </OverlayTrigger>,
            align: 'center',
            width: 100,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                return (
                    <b>{formatNumberToCurrency(item?.stockReserve)}</b>
                )
            }
        },
        {
            title: <OverlayTrigger overlay={<Tooltip title='#1234443241434'>{formatMessage({ defaultMessage: 'Tồn kho sẵn sàng bán' })}</Tooltip>}>
                <AssignmentTurnedInOutlined />
            </OverlayTrigger>,
            align: 'center',
            width: 100,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                return (
                    <b>{formatNumberToCurrency(item?.stockAvailable)}</b>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian đồng bộ' }),
            align: 'center',
            width: 160,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                return (
                    <div>
                        {item?.syncedDate ? dayjs(item?.syncedDate).format("HH:mm DD/MM/YYYY") : '--'}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Cập nhật tồn gần nhất' }),
            align: 'center',
            width: 160,
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (record, item) => {
                if (item?.errorMessage) {
                    return <div></div>
                }
                return (
                    <div>
                        {item?.updatedDate ? dayjs(item?.updatedDate).format("HH:mm DD/MM/YYYY") : '--'}
                    </div>
                )
            }
        }
    ]

    let totalRecord = +countProductSync(params?.status)

    let totalPage = Math.ceil(totalRecord / pageSize)
    return (
        <Fragment>
            <LoadingDialog show={loadingPrvUpdateSyncOrderProviderConnected} />
            {showModalConfig && <ModalConfigVietful 
                show={showModalConfig}
                onHide={() => {setShowModalConfig(null)}}
                config={config}
                setConfig={setConfig}
                onSubmit={async () => {
                    try {
                        setShowModalConfig(null)
                        const { data } = await userSyncProductFullfillment({
                            variables: {
                                userSyncProductFullfillmentInput: {
                                    providerConnectedId: +params?.id,
                                    variantIds: ids?.map(it => it?.variant_id),
                                    sourceSkuPartner: config ? +config : 1
                                }
                            }
                        })
                        toast(data?.userSyncProductFullfillment?.success, data?.userSyncProductFullfillment?.message)
                        setIds([])
                    } catch (err) {
            
                    }
                }}
            />}
            <Modal
                show={!!showConfirmSync}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                size="md"
                backdrop={true}
                onHide={() => setShowConfirmSync(null)}
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='text-center'>
                        <div className="mb-6" >
                            <p>{formatMessage({ defaultMessage: 'Đơn hàng sẽ không được tự động đồng bộ sang hệ thống fulfillment , bạn có chắc chắn muốn tắt tính năng này không?' })}</p>
                        </div>
                        <div className="form-group mb-0">
                            <button
                                id="kt_login_signin_submit"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ minWidth: 120 }}
                                onClick={e => {
                                    e.preventDefault();
                                    setShowConfirmSync(null);
                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Không' })}</span>
                            </button>
                            <button
                                className={`btn btn-primary font-weight-bold`}
                                style={{ minWidth: 120 }}
                                onClick={async () => {
                                    onUpdateSyncOrderProviderConnected({ isSync: false, type: showConfirmSync });
                                    setShowConfirmSync(null);
                                }}
                            >
                                <span className="font-weight-boldest">
                                    {formatMessage({ defaultMessage: 'Có, tắt' })}
                                </span>
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
            <div>
                {params?.system_code == 'vietful' && (
                    <div className='mb-2 d-flex justify-content-between align-items-center'>
                        <div>
                            <div className='mb-2'><strong>{formatMessage({ defaultMessage: 'Tên nhà cung cấp:' })}</strong> {params?.provider_name}</div>
                            <div className='mb-2'><strong>{formatMessage({ defaultMessage: 'Webhook URL:' })}</strong> {params?.link_webhook}</div>
                        </div>
                        <div className='d-flex flex-column align-items-end'>
                            <div className="d-flex align-items-center">
                                <div className='d-flex align-items-center'>
                                    <span>{formatMessage({ defaultMessage: "Đồng bộ đơn hàng từ sàn" })}</span>
                                    <TooltipWrapper
                                        note={formatMessage({ defaultMessage: 'Tự động đồng bộ thông tin đơn hàng từ sàn sang hệ thống Vietful' })}
                                    >
                                        <i className="fas fa-info-circle fs-14 ml-2"></i>
                                    </TooltipWrapper>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={() => {
                                                    if (!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_platform) {
                                                        setShowConfirmSync('platform');
                                                    } else {
                                                        onUpdateSyncOrderProviderConnected({ isSync: true, type: 'platform' })
                                                    }
                                                }}
                                                checked={!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_platform}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className='d-flex align-items-center'>
                                    <span>{formatMessage({ defaultMessage: "Đồng bộ đơn thủ công" })}</span>
                                    <TooltipWrapper
                                        note={formatMessage({ defaultMessage: 'Tự động đồng bộ thông tin đơn thủ công sang hệ thống Vietful' })}
                                    >
                                        <i className="fas fa-info-circle fs-14 ml-2"></i>
                                    </TooltipWrapper>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={() => {
                                                    if (!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_manual) {
                                                        setShowConfirmSync('manual');
                                                    } else {
                                                        onUpdateSyncOrderProviderConnected({ isSync: true, type: 'manual' })
                                                    }
                                                }}
                                                checked={!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_provider_manual}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center">
                                <div className='d-flex align-items-center'>
                                    <span>{formatMessage({ defaultMessage: "Đồng bộ đơn chờ duyệt" })}</span>
                                    <TooltipWrapper
                                        note={formatMessage({ defaultMessage: 'Đồng bộ các đơn chờ duyệt sang hệ thống Vietful' })}
                                    >
                                        <i className="fas fa-info-circle fs-14 ml-2"></i>
                                    </TooltipWrapper>
                                </div>
                                <div className="d-flex align-items-center">
                                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={() => {
                                                    if (!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_package_pending) {
                                                        setShowConfirmSync('package_pending');
                                                    } else {
                                                        onUpdateSyncOrderProviderConnected({ isSync: true, type: 'package_pending' })
                                                    }
                                                }}
                                                checked={!!dataProviderConnectedDetail?.prvProviderConnectedDetail?.sync_package_pending}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className='d-flex justify-content-between align-items-center'>

                    <div className="input-icon pl-0 col-4" style={{ height: "fit-content", width: '100%', position: 'relative' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage({ defaultMessage: 'Tên hàng hóa, SKU' })}
                            style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                            onBlur={(e) => {
                                history.push(`/setting/third-party-connection/${id}?${queryString.stringify({ ...params, page: 1, q: e.target.value })}`);
                            }}
                            value={search || ""}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.keyCode == 13) {
                                    history.push(`/setting/third-party-connection/${id}?${queryString.stringify({ ...params, page: 1, q: e.target.value, })}`);
                                }
                            }}
                        />
                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                    </div>

                    <div className='col-4'>
                        <div className='d-flex align-items-center justify-content-end'>
                            <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: 'Đã chọn {length} sản phẩm:' }, { length: ids?.length })}</div>
                            {viewAction}
                        </div>
                    </div>
                </div>
                <div style={{ position: 'sticky', top: '45px', zIndex: 95, background: 'white' }}>
                    <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs" id="myTab" role="tablist">
                                {SUBTAB.map((_tab, index) => {
                                    const { title, status } = _tab;
                                    const isActive = status == (params?.status || "synced_success");
                                    return (
                                        <>
                                            <li style={{ cursor: 'pointer' }} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : ""}`}>
                                                <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                                                    style={{ fontSize: "13px" }}
                                                    onClick={() => {
                                                        setIds([])
                                                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, status })}`);
                                                    }}
                                                >
                                                    {formatMessage(title)}
                                                    <span className='mx-2'>

                                                        {`(${countProductSync(status) || '--'})`}
                                                    </span>
                                                </span>
                                            </li>
                                        </>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                </div>
                {!!error && !loadingListProductSyncFullfillment && errorView()}
                <RcTable
                    style={loadingListProductSyncFullfillment ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={dataTable || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 43 }}
                    scroll={{ x: 1800 }}
                />
                {!error && (
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loadingListProductSyncFullfillment}
                        limit={pageSize}
                        totalRecord={totalRecord}
                        count={dataListProductSyncFullfillment?.userGetListProductSyncFullfillment?.items?.length || 0}
                        basePath={`/setting/third-party-connection/${id}`}
                        emptyTitle=''
                        style={{ zIndex: 1000 }}
                    />
                )}
            </div>
        </Fragment>
    )
}

export default TableProviderProduct