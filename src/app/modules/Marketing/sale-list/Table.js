import React, { useMemo, memo, useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import _ from "lodash";
import { useIntl } from 'react-intl'
import { Link } from "react-router-dom/cjs/react-router-dom";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useToasts } from 'react-toast-notifications';
import mutate_mktDeleteCampaign from "../../../../graphql/mutate_mktDeleteCampaign";
import mutate_mktApprovedCampaign from "../../../../graphql/mutate_mktApprovedCampaign";
import mutate_mktLoadCampaign from "../../../../graphql/mutate_mktLoadCampaign";
import mutate_mktEndCampaign from "../../../../graphql/mutate_mktEndCampaign";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl, checkIsActive } from "../../../../_metronic/_helpers";
import { useHistory } from 'react-router-dom';
import { Dropdown } from "react-bootstrap";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import ReloadCampaign from "../ReloadCampaign";
import ModalReloadResult from "../dialog/ModalReloadResult";
import ModalTrackingCampaign from "../dialog/ModalTrackingCampaign";
import mutate_mktRetrySyncCampaign from "../../../../graphql/mutate_mktRetrySyncCampaign";
import { formatNumberToCurrency } from "../../../../utils";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import query_mktListCampaign from "../../../../graphql/query_mktListCampaign";
import query_mktGetTrackingCampaignSyncing from "../../../../graphql/query_mktGetTrackingCampaignSyncing";
import { BASE_PATH_CAMPAIGN } from "../Constants";

const Table = memo(({ limit, page, variables }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const [openModalDelete, setOpenModalDelete] = useState(false)
    const [endModal, setEndModal] = useState(false)
    const [ids, setIds] = useState([])
    const [deleteItem, setDeleteItem] = useState(null)
    const [endItem, setEndItem] = useState(null)

    const [totalCampaignSuccess, setTotalCampaignSuccess] = useState(0);
    const [totalCampaignError, setTotalCampaignError] = useState(0);
    const [totalInprogress, setTotalInprogress] = useState(0);
    const [loadingInprogress, setLoadingInprogress] = useState(false);
    const [dataResults, setDataResults] = useState(null);
    const [modalTrackingCampaign, setModalTrackingCampaign] = useState(false);

    const history = useHistory();
    console.log(dataCampaign)
    const isSelectAll = ids?.length > 0 && ids?.filter(x => dataCampaign?.some(campaign => campaign.id === x.id))?.length == dataCampaign?.length;

    const TYPE_CAMPAIGN = {
        'voucher': {
            20: formatMessage({ defaultMessage: 'Mã giảm giá' }),
            21: formatMessage({ defaultMessage: 'Mã giảm giá Livestreams' }),
            25: formatMessage({ defaultMessage: 'Mã giảm giá theo dõi gian hàng' }),
            26: formatMessage({ defaultMessage: 'Mã giảm giá riêng tư' }),
            10: formatMessage({ defaultMessage: 'Chương trình khác' }),
            22: formatMessage({ defaultMessage: 'Mã giảm giá Video' }),
            23: formatMessage({ defaultMessage: 'Mã giảm giá cho người mua mới' }),
            24: formatMessage({ defaultMessage: 'Mã giảm giá Khách hàng mua lại' }),
        },
        'discount': {
            1: formatMessage({ defaultMessage: 'Chiết khấu sản phẩm' }),
            2: formatMessage({ defaultMessage: 'FlashSale' }),
            10: formatMessage({ defaultMessage: 'Chương trình khác' }),
        },
        'add_on_deal': {
            30: formatMessage({ defaultMessage: 'Mua để nhận quà' }),
        },
    };

    const { data: dataListCampaign, loading: loadingDataListCampaign, refetch: refetchListCampaign, error: errorListCampaign } = useQuery(query_mktListCampaign, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    const { error, loading, refetch, dataCampaign, count, dataStore, dataChannel } = useMemo(() => {
        const dataCampaign = dataListCampaign?.mktListCampaign?.map(item => item)
        const dataStore = dataListCampaign?.sc_stores
        const dataChannel = dataListCampaign?.op_connector_channels
        return {
            error: errorListCampaign,
            loading: loadingDataListCampaign,
            refetch: refetchListCampaign,
            dataCampaign,
            count: dataListCampaign?.mktCampaignAggregate?.count,
            dataStore,
            dataChannel
        }
    }, [dataListCampaign, loadingDataListCampaign, errorListCampaign])

    let totalRecord = count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    function formatTimestamp(timestamp) {
        const milliseconds = timestamp * 1000;

        const date = new Date(milliseconds);

        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();

        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    const [deleteCampaign] = useMutation(mutate_mktDeleteCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });


    const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    const [retryCampaign, { loading: loadingRetryCampaign }] = useMutation(mutate_mktRetrySyncCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    const [endCampaign, { loading: loadingEndCampaign }] = useMutation(mutate_mktEndCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    })

    const [mktLoadCampaign, { loading: loadingLoadCampaign }] = useMutation(mutate_mktLoadCampaign, {
        awaitRefetchQueries: true,
    });

    const handleDeleteCampaign = async () => {
        const { data } = await deleteCampaign({
            variables: {
                list_campaign_id: [+deleteItem]
            }
        })
        setDeleteItem(null);
        setOpenModalDelete(false)
        if (!!data?.mktDeleteCampaign?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa chương trình khuyến mại thành công' }), { appearance: "success" });
        } else {
            addToast(data?.mktDeleteCampaign?.message, { appearance: "error" });
        }
    }

    const handleEndCampaign = async () => {
        const { data } = await endCampaign({
            variables: {
                list_campaign_id: [+endItem]
            }
        })
        if (!!data?.mktEndCampaign?.success) {
            addToast(formatMessage({ defaultMessage: 'Kết thúc chương trình khuyến mại thành công' }), { appearance: "success" });
        } else {
            addToast(data?.mktEndCampaign?.message, { appearance: "error" });
        }
        setEndItem(null);
        setEndModal(false)
    }

    const handleRetryCampaign = async (id) => {
        const { data } = await retryCampaign({
            variables: {
                list_campaign_id: [+id]
            }
        })
        if (!!data?.mktRetrySyncCampaign?.success) {
            addToast(formatMessage({ defaultMessage: 'Đồng bộ chương trình khuyến mại thành công' }), { appearance: "success" });
        } else {
            addToast(data?.mktRetrySyncCampaign?.message, { appearance: "error" });
        }
    }

    const onSetDataResult = useCallback((result) => {
        setIds([]);
        setTotalInprogress(0);
        setLoadingInprogress(false);
        setTotalCampaignSuccess(0);
        setTotalCampaignError(0);
        setDataResults(result);
    }, []);

    const handleApprovedCampaign = async (id, action) => {
        const { data } = await approvedCampaign({
            variables: {
                list_campaign_id: [+id]
            }
        })
        if (!!data?.mktApprovedCampaign?.success) {
            if (action == 'sync') {
                addToast(formatMessage({ defaultMessage: 'Đồng bộ chương trình khuyến mại thành công' }), { appearance: "success" });
            } else {
                addToast(formatMessage({ defaultMessage: 'Duyệt chương trình khuyến mại thành công' }), { appearance: "success" });

            }
        } else {
            addToast(data?.mktApprovedCampaign?.message, { appearance: "error" });
        }
    }

    const onReloadCampain = async (ids, count = 0, totalSuccess = 0, totalFail = 0) => {
        const result = {
            total_success: totalSuccess,
            total_fail: totalFail
        };

        const dataHandeling = ids[count]
        const dataRemaning = ids?.slice(count);
        try {
            setTotalInprogress(dataRemaning?.length);
            setLoadingInprogress(true);

            if (!dataHandeling?.id) {
                refetch()
                onSetDataResult(result);
                return;
            }
            const { data } = await mktLoadCampaign({
                variables: {
                    id: dataHandeling?.id
                }
            });

            if (data?.mktLoadCampaign?.success) {
                totalSuccess += 1;
                setTotalCampaignSuccess(totalSuccess);
            } else {
                totalFail += 1;
                setTotalCampaignError(totalFail);
            }

            onReloadCampain(ids, count + 1, totalSuccess, totalFail);
        } catch (error) {
            onSetDataResult(result)
        }
    };
    return (
        <>
            {params?.type == 'syncing' && <div className="d-flex align-items-center my-2">
                <svg xmlns="http://www.w3.org/2000/svg" color="#00DB6D" width="16" height="16" fill="currentColor" className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                    <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                </svg>
                <span className="fs-14" style={{ color: '#00DB6D' }}>
                    {formatMessage({ defaultMessage: 'Vui lòng tải lại trang để cập nhật trạng thái mới nhất' })}
                </span>
            </div>}
            {['coming_soon', 'happening', 'finished', 'sync_error'].includes(params?.type) && (
                <>
                    <LoadingDialog show={loadingApprovedCampaign || loadingEndCampaign || loadingRetryCampaign || loadingLoadCampaign} />
                    <ReloadCampaign
                        show={loadingInprogress}
                        total={ids?.length}
                        totalInprogress={totalInprogress}
                        totalCampaignError={totalCampaignError}
                        totalCampaignSuccess={totalCampaignSuccess}
                    />
                    <ModalReloadResult
                        dataResults={dataResults}
                        onHide={() => setDataResults(null)}
                    />
                    <div className="d-flex align-items-center mb-2 mt-2">
                        <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                            {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                        </div>
                        <button
                            type="button"
                            className="btn btn-elevate btn-primary ml-4"
                            disabled={ids?.length == 0}
                            style={{
                                color: "white",
                                width: 'max-content',
                                minWidth: 120,
                                background: ids?.length == 0 ? "#6c757d" : "",
                                border: ids?.length == 0 ? "#6c757d" : "",
                            }}
                            onClick={() => onReloadCampain(ids)}
                        >
                            {formatMessage({ defaultMessage: "Tải lại" })}
                        </button>
                    </div>
                </>
            )}

            <div style={{ boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, minHeight: 300 }}>

                <table className="table table-borderless product-list table-vertical-center fixed">
                    <thead style={{ position: 'sticky', top: `${!params?.type || params?.type == 'pending' ? 85 : 128}px`, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}>
                        <tr className="font-size-lg">
                            <th style={{ fontSize: '14px' }} width="22%">
                                <div className="d-flex">
                                    {['coming_soon', 'happening', 'finished', 'sync_error'].includes(params?.type) && <Checkbox
                                        size='checkbox-md'
                                        inputProps={{
                                            'aria-label': 'checkbox',
                                        }}
                                        isSelected={isSelectAll}
                                        onChange={(e) => {
                                            if (isSelectAll) {
                                                setIds(ids.filter(x => {
                                                    return !dataCampaign.some(campaign => campaign.id === x.id);
                                                }))
                                            } else {
                                                const tempArray = [...ids];
                                                (dataCampaign || []).forEach(campaign => {
                                                    if (campaign && !ids.some(item => item.id === campaign.id)) {
                                                        tempArray.push(campaign);
                                                    }
                                                })
                                                setIds(tempArray)
                                            }
                                        }}
                                    />}
                                    <span className="mx-4">{formatMessage({ defaultMessage: 'Tên chương trình' })}</span>
                                </div>
                            </th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="14%">{formatMessage({ defaultMessage: 'Loại' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="10%">{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="16%">{formatMessage({ defaultMessage: 'Thời gian' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="12%">{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="15%">{formatMessage({ defaultMessage: 'Thông tin đồng bộ' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="11%">{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                        </tr>
                    </thead>
                    <tbody style={{ position: 'relative' }}>
                        {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>
                        }
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 100 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            refetch();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {!error && !loading && dataCampaign?.map((campaignItem, index) => {
                            const isOther = campaignItem?.type == 10;
                            const isOtherDeal = campaignItem?.object_type == 'add_on_deal' && campaignItem?.type == 10;
                            const isOtherVoucher = campaignItem?.object_type == 'voucher' && ((![20, 21, 25, 26].includes(campaignItem?.type) && campaignItem?.connector_channel_code == 'lazada') || ((![20, 26].includes(campaignItem?.type) && campaignItem?.connector_channel_code == 'shopee')));
                            let store = dataStore.find((_st) => _st.id == campaignItem?.store_id);
                            let channel = dataChannel.find(
                                (_st) => _st.code == campaignItem?.connector_channel_code
                            );

                            const hasDeleteAction = (!isOther && campaignItem?.object_type == 'discount' && campaignItem?.text_status != 'Đã kết thúc')
                                || (!isOtherVoucher && campaignItem?.object_type == 'voucher' && campaignItem?.connector_channel_code == 'shopee' && (campaignItem?.text_status == 'Sắp diễn ra' || campaignItem?.status == 1))
                                || (!isOtherDeal && campaignItem?.object_type == 'add_on_deal' && (campaignItem?.text_status == 'Sắp diễn ra' || campaignItem?.status == 1))

                            return (
                                <>
                                    <tr style={{ position: 'relative', paddingBottom: '10px', minHeight: '100px' }}>
                                        <td style={{ fontSize: '14px' }}>
                                            <div className="d-flex">
                                                {['coming_soon', 'happening', 'finished', 'sync_error'].includes(params?.type) && (
                                                    <Checkbox
                                                        inputProps={{
                                                            'aria-label': 'checkbox',
                                                        }}
                                                        size='checkbox-md'
                                                        isSelected={ids.some(_id => _id.id == campaignItem.id)}
                                                        onChange={(e) => {
                                                            if (ids.some(_id => _id.id == campaignItem.id)) {
                                                                setIds(prev => prev.filter(_id => _id.id != campaignItem?.id))
                                                            } else {
                                                                setIds(prev => prev.concat([campaignItem]))
                                                            }
                                                        }}
                                                    />
                                                )}

                                                <div className="d-flex flex-column">
                                                    <div className="mb-2 d-flex">
                                                        <span>{campaignItem.name}</span>
                                                        {campaignItem?.object_type == 'voucher' && <OverlayTrigger
                                                            placement="bottom"
                                                            overlay={
                                                                <Tooltip>
                                                                    <div className="d-flex flex-column">
                                                                        <div className="d-flex align-items-center mb-2">
                                                                            <span>{formatMessage({ defaultMessage: 'Giảm giá' })}:</span>
                                                                            <span className="ml-2">
                                                                                {formatNumberToCurrency(campaignItem?.campaignVoucher?.discount_amount)}
                                                                                {campaignItem?.discount_type == 1 && <span>đ</span>}
                                                                                {campaignItem?.discount_type == 2 && <span>%</span>}
                                                                                {campaignItem?.discount_type == 3 && <span>% hoàn xu</span>}
                                                                            </span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center mb-2">
                                                                            <span>{formatMessage({ defaultMessage: 'Đơn tối thiểu' })}:</span>
                                                                            <span className="ml-2">{formatNumberToCurrency(campaignItem?.campaignVoucher?.min_order_price)}đ</span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center">
                                                                            <span>{formatMessage({ defaultMessage: 'Đã dùng (Đã lưu)' })}:</span>
                                                                            <span className="ml-2">{campaignItem?.campaignVoucher?.used_quantity || 0}/{campaignItem?.campaignVoucher?.usage_quantity}</span>
                                                                        </div>
                                                                    </div>
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <svg style={{ flex: 'none', position: 'relative', top: 3 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="ml-2 bi bi-chevron-down cursor-pointer" viewBox="0 0 16 16">
                                                                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                                                            </svg>
                                                        </OverlayTrigger>}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        {!!channel?.logo_asset_url && (
                                                            <img
                                                                src={channel?.logo_asset_url}
                                                                className="mr-1"
                                                                style={{ width: 15, height: 15, objectFit: 'contain' }}
                                                                alt=""
                                                            />
                                                        )}
                                                        <span>{store?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            {TYPE_CAMPAIGN?.[campaignItem?.object_type]?.[campaignItem?.type]}
                                        </td>
                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            {campaignItem?.item_type == 3 ? formatMessage({ defaultMessage: 'Toàn gian hàng' }) : (campaignItem?.product_count || 0)}
                                        </td>
                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            <p> {`${formatTimestamp(campaignItem?.start_time)} -`}</p>
                                            <p>{`${formatTimestamp(campaignItem?.end_time)}`}</p>
                                        </td>
                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            {campaignItem?.text_status}
                                        </td>
                                        {campaignItem?.status != 1 ? <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            <div>
                                                <p>
                                                    <span style={{ color: campaignItem?.sync_status_info?.status_color }}>
                                                        {campaignItem?.sync_status_info?.status_text}
                                                    </span>
                                                    {['sync_error', 'partial_sync'].includes(campaignItem?.sync_status_info?.status) && <AuthorizationWrapper keys={['marketing_list_update']}>
                                                        <span onClick={(e) => {
                                                            e.preventDefault()
                                                            handleRetryCampaign(campaignItem?.id)
                                                        }}><SVG style={{ cursor: 'pointer', marginLeft: '4px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/icons/icon-retry.svg")} /></span>
                                                    </AuthorizationWrapper>}
                                                </p>
                                                {campaignItem?.synced_at && <p >{formatTimestamp(campaignItem?.synced_at)} </p>}
                                            </div>
                                        </td> : <td></td>}
                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>
                                            <Dropdown drop='down'
                                            >
                                                <Dropdown.Toggle
                                                    className='btn-outline-secondary'
                                                >
                                                    {formatMessage({ defaultMessage: `Chọn` })}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu style={{ zIndex: 99 }}>
                                                    <AuthorizationWrapper keys={['marketing_list_update']}>
                                                        {hasDeleteAction && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            setOpenModalDelete(true)
                                                            setDeleteItem(campaignItem.id)
                                                        }} >{formatMessage({ defaultMessage: `Xóa` })}</Dropdown.Item>}

                                                        {!isOther && !isOtherVoucher && (campaignItem?.text_status == 'Sắp diễn ra' || campaignItem?.text_status == 'Đang diễn ra' || campaignItem?.status == 1) && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const basePath = BASE_PATH_CAMPAIGN?.[campaignItem?.object_type]
                                                            if (campaignItem?.status != 1) {
                                                                window.open(`${basePath}/${campaignItem?.id}?${queryString.stringify({
                                                                    action: 'edit',
                                                                    type: 2,
                                                                    ...(campaignItem?.object_type == 'add_on_deal' ? {
                                                                        typeGift: 2
                                                                    } : {})
                                                                })}`, "_blank")
                                                            } else {
                                                                window.open(`${basePath}/${campaignItem?.id}?action=edit`, "_blank")
                                                            }
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Chỉnh sửa` })}
                                                        </Dropdown.Item>}
                                                        {!isOther && !isOtherVoucher && campaignItem?.text_status == 'Đang diễn ra' && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            setEndModal(true)
                                                            setEndItem(campaignItem?.id)
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Kết thúc chương trình` })}
                                                        </Dropdown.Item>}

                                                        {!isOther && !isOtherVoucher && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            const basePath = campaignItem?.object_type == 'voucher'
                                                                ? '/marketing/voucher-create'
                                                                : (campaignItem?.object_type == 'discount' ? '/marketing/campaign-create-new' : '/marketing/deal-create')
                                                            window.open(
                                                                `${basePath}?${queryString.stringify({
                                                                    channel: campaignItem?.connector_channel_code,
                                                                    typeCampaign: campaignItem?.object_type != 'discount'
                                                                        ? campaignItem?.type
                                                                        : campaignItem?.type == 1 ? 'discount' : 'flashsale',
                                                                    action: 'copy',
                                                                    id: campaignItem?.id
                                                                })}`,
                                                                '_blank'
                                                            );
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Sao chép` })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>
                                                    <AuthorizationWrapper keys={['marketing_list_view']}>
                                                        {(campaignItem?.text_status == 'Đã kết thúc' || isOther || isOtherVoucher) && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            const basePath = BASE_PATH_CAMPAIGN?.[campaignItem?.object_type]
                                                            window.open(`${basePath}/${campaignItem?.id}?${queryString.stringify({
                                                                type: 2,
                                                                ...(campaignItem?.object_type == 'add_on_deal' ? {
                                                                    typeGift: 2
                                                                } : {})
                                                            })}`, "_blank")
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Xem chi tiết` })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>

                                                    <AuthorizationWrapper keys={['marketing_list_approved']}>
                                                        {!isOther && !isOther && !!(campaignItem?.status == 1) && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            handleApprovedCampaign(campaignItem?.id, 'approve')
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Duyệt` })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>
                                                    {['coming_soon', 'happening', 'finished', 'sync_error'].includes(params?.type) && (
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const { data } = await mktLoadCampaign({
                                                                variables: {
                                                                    id: +campaignItem?.id
                                                                }
                                                            });
                                                            if (data?.mktLoadCampaign?.success) {
                                                                addToast(formatMessage({ defaultMessage: 'Tải lại chương trình thành công' }), { appearance: 'success' })
                                                            } else {
                                                                addToast(data?.mktLoadCampaign?.message || formatMessage({ defaultMessage: 'Tải lại chương trình thất bại' }), { appearance: 'error' })
                                                            }
                                                        }} >{formatMessage({ defaultMessage: `Tải lại` })}</Dropdown.Item>
                                                    )}

                                                </Dropdown.Menu>
                                            </Dropdown>

                                        </td>
                                    </tr>
                                    {(campaignItem?.sync_status_info?.status == 'sync_error' || campaignItem?.sync_status_info?.status == 'partial_sync') && <tr>
                                        <td colSpan={7} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)', }}>
                                            <div style={{
                                                paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                            }} >
                                                {campaignItem?.sync_status_info?.status == 'sync_error' && <span style={{ wordBreak: 'break-all' }}>Đồng bộ chương trình lỗi: {campaignItem?.sync_status_info?.message}</span>}
                                                {campaignItem?.sync_status_info?.status == 'partial_sync' && <span style={{ wordBreak: 'break-all' }}>Đồng bộ sản phẩm lỗi. Nội dung lỗi xem tại <Link onClick={(e) => {
                                                    e.preventDefault();

                                                    const basePath = BASE_PATH_CAMPAIGN?.[campaignItem?.object_type]
                                                    history.push({
                                                        pathname: `${basePath}/${campaignItem?.id}`,
                                                        search: `?${queryString.stringify({
                                                            type: 1,
                                                            action: 'edit',
                                                            ...(campaignItem?.object_type == 'add_on_deal' ? {
                                                                typeGift: 1
                                                            } : {})
                                                        })}`,
                                                        state: { id: campaignItem?.id }
                                                    });
                                                }}>Chi tiết</Link></span>}
                                            </div>
                                        </td>
                                    </tr>}
                                </>
                            )
                        }
                        )}

                    </tbody>
                </table>
                {!error && (
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={dataCampaign?.length}
                        basePath={'/marketing/sale-list'}
                        emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy chương trình khuyến mãi phù hợp' })}
                    />
                )}
                <Modal
                    show={openModalDelete}
                    aria-labelledby="example-modal-sizes-title-lg"
                    centered
                    backdrop={'static'}
                >
                    <Modal.Body className="overlay overlay-block cursor-default text-center">
                        <div className="mb-4" >Bạn có chắc chắn muốn xóa chương trình khuyến mại ?</div>

                        <div className="form-group mb-0">
                            <button
                                type="button"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ minWidth: 100 }}
                                onClick={() => {
                                    setOpenModalDelete(false)
                                    setDeleteItem(null)
                                }}
                            >
                                <span className="font-weight-boldest">Hủy</span>
                            </button>
                            <button
                                type="button"
                                className={`btn btn-primary font-weight-bold`}
                                style={{ minWidth: 100 }}
                                onClick={handleDeleteCampaign}
                            >
                                <span className="font-weight-boldest">Có, Xóa</span>
                            </button>
                        </div>
                    </Modal.Body>
                </Modal >

                <Modal
                    show={endModal}
                    aria-labelledby="example-modal-sizes-title-lg"
                    centered
                    backdrop={'static'}
                >
                    <Modal.Body className="overlay overlay-block cursor-default text-center">
                        <div className="mb-4" >Bạn có chắc chắn muốn kết thúc chương trình khuyến mại?</div>

                        <div className="form-group mb-0">
                            <button
                                type="button"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ minWidth: 100 }}
                                onClick={() => {
                                    setEndModal(false)
                                    setEndItem(null)
                                }}
                            >
                                <span className="font-weight-boldest">Hủy</span>
                            </button>
                            <button
                                type="button"
                                className={`btn btn-primary font-weight-bold`}
                                style={{ minWidth: 100 }}
                                onClick={handleEndCampaign}
                            >
                                <span className="font-weight-boldest">Có, Kết thúc</span>
                            </button>
                        </div>
                    </Modal.Body>
                </Modal >
            </div>
        </>

    )
});

export default Table;