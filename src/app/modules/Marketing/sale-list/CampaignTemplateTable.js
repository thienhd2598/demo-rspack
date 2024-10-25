import React, { useMemo, memo, useState, useCallback, Fragment, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import _, { omit, sumBy } from "lodash";
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
import mutate_mktApprovedTemplate from "../../../../graphql/mutate_mktApprovedTemplate";
import dayjs from "dayjs";
import query_mktListCampaignTemplate from "../../../../graphql/query_mktListCampaignTemplate";
import mutate_mktDeleteTemplate from "../../../../graphql/mutate_mktDeleteTemplate";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import { formatNumberToCurrency } from "../../../../utils";
import { BASE_PATH_CAMPAIGN, BASE_PATH_CAMPAIGN_TEMPLATE } from "../Constants";

const CampaignTemplateTable = memo(({ limit, page, whereCondition, dataStore, dataChannel }) => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const [openModalDelete, setOpenModalDelete] = useState(false)
    const [currentDeleteId, setCurrentDeleteId] = useState(null);
    const [idsExpand, setIdsExpand] = useState([]);
    const [ids, setIds] = useState([])

    const { data: dataListCampaignTemplate, loading, refetch, error } = useQuery(query_mktListCampaignTemplate, {
        variables: {
            page,
            per_page: limit,
            search: omit(whereCondition, ['list_sub_status']),
            order_by: 'updated_at',
            order_by_type: 'desc'
        },
        fetchPolicy: 'cache-and-network'        
    });

    let totalRecord = dataListCampaignTemplate?.mktCampaignTemplateAggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);
    const history = useHistory();

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
        }
    };

    useMemo(() => setIdsExpand([]), [dataListCampaignTemplate]);

    const dataTemplate = useMemo(() => dataListCampaignTemplate?.mktListCampaignTemplate || [], [dataListCampaignTemplate]);

    const isSelectAll = ids?.length > 0 && ids?.filter(x => dataTemplate?.some(campaign => campaign.id === x.id))?.length == dataTemplate?.length;

    const [approvedTemplate, { loading: loadingApprovedTemplate }] = useMutation(mutate_mktApprovedTemplate, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaignTemplate', 'mktCampaignTemplateAggregate']
    });

    const [deleteTemplate, { loading: loadingDeleteTemplate }] = useMutation(mutate_mktDeleteTemplate, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaignTemplate', 'mktCampaignTemplateAggregate']
    })

    const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaignTemplate', 'mktCampaignTemplateAggregate']
    });

    const onDeleteCampaignTemplate = async () => {
        const { data } = await deleteTemplate({
            variables: {
                list_template_id: [currentDeleteId]
            }
        })

        setCurrentDeleteId(null);
        if (!!data?.mktDeleteTemplate?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa chương trình khuyến mại hàng loạt thành công' }), { appearance: "success" });
        } else {
            addToast(data?.mktDeleteTemplate?.message || formatMessage({ defaultMessage: 'Xóa chương trình khuyến mại hàng loạt thất bại' }), { appearance: "error" });
        }
    }

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

    const onApproveTemplate = async (id) => {
        const { data } = await approvedTemplate({
            variables: {
                id
            }
        })
        if (!!data?.mktApprovedTemplate?.success) {
            addToast(formatMessage({ defaultMessage: 'Duyệt chương trình khuyến mại hàng loạt thành công' }), { appearance: "success" });
        } else {
            addToast(data?.mktApprovedCampaign?.message, { appearance: "error" });
        }
    }

    const buildTemplateItems = (campaign, template, index) => {
        let currentDate = new Date().getTime();

        const coming_soon = !!(campaign?.start_time * 1000 > currentDate && campaign?.status != 1)
        const finished = !!(campaign?.end_time * 1000 < currentDate && campaign?.status != 1)
        const happening = !!(campaign?.start_time * 1000 < currentDate && campaign?.end_time * 1000 >= currentDate && campaign?.status != 1)

        const isSyncErrorCampaignItem = !!campaign?.campaign?.filter(item => item?.sync_error_message).length
        const isSyncErrorCampaign = campaign?.sync_error_message

        let store = dataStore?.find((_st) => _st?.id == template?.store_id);
        let channel = dataChannel?.find(
            (_st) => _st.code == template?.connector_channel_code
        );
        const isExpand = idsExpand?.includes(template?.id);

        return (
            <Fragment>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', }}>
                    <div className="d-flex row">
                        <div className="ml-10 d-flex flex-column mr-4">
                            <div className="mb-2 d-flex">
                                <span className="cursor-pointer" onClick={() => {
                                    const basePath = BASE_PATH_CAMPAIGN?.[campaign?.object_type]
                                    if (campaign?.text_status == 'Đã kết thúc') {
                                        window.open(`${basePath}/${campaign?.id}?type=2`, "_blank");
                                    } else {
                                        window.open(`${basePath}/${campaign?.id}?action=edit&type=2`, "_blank");
                                    }
                                }}>
                                    {campaign.name}
                                </span>
                                {campaign?.object_type == 'voucher' && <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            <div className="d-flex flex-column">
                                                <div className="d-flex align-items-center mb-2">
                                                    <span>{formatMessage({ defaultMessage: 'Giảm giá' })}:</span>
                                                    <span className="ml-2">
                                                        {formatNumberToCurrency(campaign?.campaignVoucher?.discount_amount)}
                                                        {campaign?.discount_type == 1 && <span>đ</span>}
                                                        {campaign?.discount_type == 2 && <span>%</span>}
                                                        {campaign?.discount_type == 3 && <span>% hoàn xu</span>}
                                                    </span>
                                                </div>
                                                <div className="d-flex align-items-center mb-2">
                                                    <span>{formatMessage({ defaultMessage: 'Đơn tối thiểu' })}:</span>
                                                    <span className="ml-2">{formatNumberToCurrency(campaign?.campaignVoucher?.min_order_price)}đ</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <span>{formatMessage({ defaultMessage: 'Đã dùng (Đã lưu)' })}:</span>
                                                    <span className="ml-2">{campaign?.campaignVoucher?.used_quantity || 0}/{campaign?.campaignVoucher?.usage_quantity}</span>
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
                            <div className="d-flex align-items-center">
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

                    {template?.campaigns?.length > 2 && ((isExpand && index == template?.campaigns?.length - 1) || (!isExpand && index == 1)) && <div className="d-flex align-items-center mt-4">
                        <div style={{ width: isExpand ? 80 : 30, height: 1, background: '#ff5629' }} />
                        <span
                            className="text-primary cursor-pointer mx-2 fs-12"
                            onClick={() => {
                                setIdsExpand(prev => isExpand ? prev.filter(item => item != template?.id) : prev.concat(template?.id));
                            }}
                        >
                            {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm {count} chương trình con' }, { count: template?.campaigns?.length - 2 })}
                        </span>
                        <div style={{ width: isExpand ? 80 : 30, height: 1, background: '#ff5629' }} />
                    </div>}
                </td>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                </td>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                </td>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                </td>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                    <p> {`${dayjs.unix(campaign?.start_time).format('DD/MM/YYYY HH:mm')} -`}</p>
                    <p>{`${dayjs.unix(campaign?.end_time).format('DD/MM/YYYY HH:mm')}`}</p>
                </td>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                    {campaign.status == 1 && 'Chưa duyệt'}
                    {campaign.status != 1 && coming_soon && "Sắp diễn ra"}
                    {campaign.status != 1 && happening && "Đang diễn ra"}
                    {campaign.status != 1 && finished && "Đã kết thúc"}
                </td>
                {/* <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                </td> */}
                {/* <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>
                </td> */}
                {campaign.status != 1 ? <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}>                    
                    {!['sync_error', 'partial_sync'].includes(campaign?.sync_status_info?.status) && <div>
                        <p style={{ color: campaign?.sync_status_info?.status_color }}>{campaign?.sync_status_info?.status_text}</p>
                        {campaign?.synced_at && <p >{dayjs.unix(campaign?.synced_at).format('DD/MM/YYYY HH:mm')} </p>}
                    </div>}
                    {['sync_error', 'partial_sync'].includes(campaign?.sync_status_info?.status) && <div className="d-flex justify-content-center align-items-center">
                        <span style={{ color: campaign?.sync_status_info?.status_color }}>
                            {campaign?.sync_status_info?.status_text}
                        </span>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {campaign?.sync_status_info?.status == 'sync_error' && `Đồng bộ chương trình lỗi: ${campaign?.sync_status_info?.message}`}
                                    {campaign?.sync_status_info?.status == 'partial_sync' && 'Đồng bộ sản phẩm lỗi'}
                                </Tooltip>
                            }
                        >
                            <span role='button' className="mx-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill text-danger" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
                                </svg>
                            </span>
                        </OverlayTrigger>
                        <AuthorizationWrapper keys={['marketing_list_update']}>
                            <span onClick={(e) => {
                                e.preventDefault()
                                handleApprovedCampaign(campaign?.id, 'sync')
                            }}><SVG style={{ cursor: 'pointer', marginLeft: '4px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/icons/icon-retry.svg")} /></span>
                        </AuthorizationWrapper>
                    </div>}
                </td> : <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none', textAlign: 'center' }}></td>}
            </Fragment>
        )
    }

    console.log({ dataListCampaignTemplate });

    return (
        <Fragment>
            <LoadingDialog show={loadingApprovedTemplate || loadingDeleteTemplate || loadingApprovedCampaign} />
            <Modal
                show={!!currentDeleteId}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                backdrop={'static'}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-4" >Bạn có chắc chắn muốn xóa chương trình khuyến mại hàng loạt ?</div>

                    <div className="form-group mb-0">
                        <button
                            type="button"
                            className="btn btn-light btn-elevate mr-3"
                            style={{ minWidth: 100 }}
                            onClick={() => {
                                setCurrentDeleteId(null)
                            }}
                        >
                            <span className="font-weight-boldest">Hủy</span>
                        </button>
                        <button
                            type="button"
                            className={`btn btn-primary font-weight-bold`}
                            style={{ minWidth: 100 }}
                            onClick={onDeleteCampaignTemplate}
                        >
                            <span className="font-weight-boldest">Có, Xóa</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal >
            <div style={{ boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9", borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6, minHeight: 300 }}>

                <table className="table table-borderless product-list table-vertical-center fixed">
                    <thead style={{ position: 'sticky', top: 85, zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9' }}>
                        <tr className="font-size-lg">
                            <th style={{ fontSize: '14px' }} width="25%">
                                <div className="d-flex">
                                    <Checkbox
                                        size='checkbox-md'
                                        inputProps={{
                                            'aria-label': 'checkbox',
                                        }}
                                        isSelected={isSelectAll}
                                        onChange={(e) => {
                                            if (isSelectAll) {
                                                setIds(ids.filter(x => {
                                                    return !dataTemplate.some(campaign => campaign.id === x.id);
                                                }))
                                            } else {
                                                const tempArray = [...ids];
                                                (dataTemplate || []).forEach(campaign => {
                                                    if (campaign && !ids.some(item => item.id === campaign.id)) {
                                                        tempArray.push(campaign);
                                                    }
                                                })
                                                setIds(tempArray)
                                            }
                                        }}
                                    />
                                    <span className="mx-4">{formatMessage({ defaultMessage: 'Tên chương trình' })}</span>
                                </div>
                            </th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="13%">{formatMessage({ defaultMessage: 'Loại' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="12%">{formatMessage({ defaultMessage: 'Số chương trình lẻ' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="12%">{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="14%">{formatMessage({ defaultMessage: 'Thời gian' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="11%">{formatMessage({ defaultMessage: 'Trạng thái' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="15%">{formatMessage({ defaultMessage: 'Thông tin đồng bộ' })}</th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width="11%">{formatMessage({ defaultMessage: 'Thao tác' })}</th>
                        </tr>
                    </thead>
                    <tbody style={{ position: 'relative', borderBottom: '0.5px solid #cbced4' }}>
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
                        {!error && !loading && dataListCampaignTemplate?.mktListCampaignTemplate?.map((templateItem, index) => {
                            let store = dataStore?.find((_st) => _st?.id == templateItem?.store_id);
                            let channel = dataChannel?.find(
                                (_st) => _st.code == templateItem?.connector_channel_code
                            );
                            const isExpand = idsExpand?.includes(templateItem?.id);


                            return (
                                <>
                                    <tr style={{ position: 'relative', paddingBottom: '10px', minHeight: '100px' }}>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', }}>
                                            <div className="d-flex">
                                                <Checkbox
                                                    inputProps={{
                                                        'aria-label': 'checkbox',
                                                    }}
                                                    size='checkbox-md'
                                                    isSelected={ids.some(_id => _id.id == templateItem.id)}
                                                    onChange={(e) => {
                                                        if (ids.some(_id => _id.id == templateItem.id)) {
                                                            setIds(prev => prev.filter(_id => _id.id != templateItem?.id))
                                                        } else {
                                                            setIds(prev => prev.concat([templateItem]))
                                                        }
                                                    }}
                                                />
                                                <div className="d-flex flex-column">
                                                    <div className="d-flex mb-2">
                                                        <span>{templateItem.name}</span>
                                                        {templateItem?.object_type == 'voucher' && <OverlayTrigger
                                                            placement="bottom"
                                                            overlay={
                                                                <Tooltip>
                                                                    <div className="d-flex flex-column">
                                                                        <div className="d-flex align-items-center mb-2">
                                                                            <span>{formatMessage({ defaultMessage: 'Giảm giá' })}:</span>
                                                                            <span className="ml-2">
                                                                                {formatNumberToCurrency(templateItem?.campaignVoucher?.discount_amount)}
                                                                                {templateItem?.discount_type == 1 && <span>đ</span>}
                                                                                {templateItem?.discount_type == 2 && <span>%</span>}
                                                                                {templateItem?.discount_type == 3 && <span>% hoàn xu</span>}
                                                                            </span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center mb-2">
                                                                            <span>{formatMessage({ defaultMessage: 'Đơn tối thiểu' })}:</span>
                                                                            <span className="ml-2">{formatNumberToCurrency(templateItem?.campaignVoucher?.min_order_price)}đ</span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center">
                                                                            <span>{formatMessage({ defaultMessage: 'Đã dùng (Đã lưu)' })}:</span>
                                                                            <span className="ml-2">{templateItem?.campaignVoucher?.used_quantity || 0}/{templateItem?.campaignVoucher?.usage_quantity}</span>
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
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            {TYPE_CAMPAIGN?.[templateItem?.object_type]?.[templateItem?.campaign_type]}
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            {templateItem?.total_campaign}
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            {templateItem?.item_type == 3 ? formatMessage({ defaultMessage: 'Toàn gian hàng' }) : (templateItem?.product_count || 0)}
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            {templateItem?.status == 1 && (
                                                <>
                                                    <p> {`${dayjs.unix(templateItem?.min_time).format('DD/MM/YYYY HH:mm')} -`}</p>
                                                    <p>{`${dayjs.unix(templateItem?.max_time).format('DD/MM/YYYY HH:mm')}`}</p>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            {templateItem?.status == 1 && (
                                                <span>{formatMessage({ defaultMessage: 'Chưa duyệt' })}</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}></td>
                                        <td style={{ fontSize: '14px', borderBottom: 'none', textAlign: 'center' }}>
                                            <Dropdown drop='down'
                                            >
                                                <Dropdown.Toggle
                                                    className='btn-outline-secondary'
                                                >
                                                    {formatMessage({ defaultMessage: `Chọn` })}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu style={{ zIndex: 99 }}>
                                                    <AuthorizationWrapper keys={['marketing_list_update']}>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            setCurrentDeleteId(templateItem?.id)
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Xóa` })}
                                                        </Dropdown.Item>

                                                        {templateItem?.status == 1 && <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const basePath = BASE_PATH_CAMPAIGN_TEMPLATE?.[templateItem?.object_type]
                                                            window.open(`${basePath}/${templateItem?.id}?action=edit`, "_blank")
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Chỉnh sửa` })}
                                                        </Dropdown.Item>}
                                                        {<Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            const basePath = templateItem?.object_type != 'discount'
                                                                ? (templateItem?.object_type == 'add_on_deal' ? '/marketing/deal-template-create' : '/marketing/voucher-template-create')
                                                                : '/marketing/campaign-template-create-new'
                                                            window.open(
                                                                `${basePath}?${queryString.stringify({
                                                                    channel: templateItem?.connector_channel_code,
                                                                    typeCampaign: templateItem?.object_type != 'discount'
                                                                        ? templateItem?.campaign_type
                                                                        : templateItem?.campaign_type == 1 ? 'discount' : 'flashsale',
                                                                    action: 'copy',
                                                                    id: templateItem?.id
                                                                })}`,
                                                                '_blank'
                                                            );
                                                        }}>
                                                            {formatMessage({ defaultMessage: `Sao chép` })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>
                                                    <AuthorizationWrapper keys={['marketing_list_view']}>
                                                        {templateItem?.status == 2 && <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            const basePath = BASE_PATH_CAMPAIGN_TEMPLATE?.[templateItem?.object_type]
                                                            window.open(`${basePath}/${templateItem?.id}`, "_blank")
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Xem chi tiết` })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>

                                                    <AuthorizationWrapper keys={['marketing_list_approved']}>
                                                        {templateItem?.status == 1 && <Dropdown.Item
                                                            className="mb-1 d-flex"
                                                            onClick={() => {
                                                                onApproveTemplate(templateItem?.id)
                                                            }}
                                                        >
                                                            {formatMessage({ defaultMessage: 'Duyệt' })}
                                                        </Dropdown.Item>}
                                                    </AuthorizationWrapper>
                                                </Dropdown.Menu>
                                            </Dropdown>

                                        </td>
                                    </tr>
                                    {templateItem?.campaigns?.slice(0, !isExpand ? 2 : templateItem?.campaigns?.length)?.map((item, index) => <tr>{buildTemplateItems(item, templateItem, index)}</tr>)}
                                    {/* {(isSyncErrorCampaign || isSyncErrorCampaignItem) && <tr>
                                    <td colSpan={7} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)', }}>


                                        <div style={{
                                            paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }} >
                                            {isSyncErrorCampaign && <p className="mb-0"><span>Đồng bộ chương trình lỗi: {templateItem?.sync_error_message}</span></p>}
                                            {isSyncErrorCampaignItem && <p className="mt-0 mb-0"><span>Đồng bộ sản phẩm lỗi. Nội dung lỗi xem tại <Link onClick={(e) => {
                                                e.preventDefault()
                                                history.push({
                                                    pathname: `/marketing/sale/${templateItem?.id}`,
                                                    search: `?${queryString.stringify({ type: 1, action: 'edit' })}`,
                                                    state: { id: templateItem?.id }
                                                });
                                            }}>Chi tiết</Link></span></p>}
                                        </div>
                                    </td>
                                </tr>} */}
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
                        count={dataTemplate?.length}
                        basePath={'/marketing/sale-list'}
                        emptyTitle={formatMessage({ defaultMessage: 'Không tìm thấy chương trình khuyến mãi phù hợp' })}
                    />
                )}
            </div>
        </Fragment>
    )
});

export default memo(CampaignTemplateTable);