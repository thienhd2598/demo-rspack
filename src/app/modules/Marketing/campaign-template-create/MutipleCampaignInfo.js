import React, { Fragment, memo, useState } from "react";
import { Accordion, OverlayTrigger, Tooltip, useAccordionToggle } from "react-bootstrap";
import { Card } from "../../../../_metronic/_partials/controls";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import dayjs from "dayjs";
import { useMutation } from "@apollo/client";
import mutate_mktApprovedCampaign from "../../../../graphql/mutate_mktApprovedCampaign";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import SVG from "react-inlinesvg";

const CustomToggle = ({ children, eventKey, title }) => {
    const [show, setShow] = useState(true);

    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setShow(prev => !prev);
    });

    return (
        <div className="mx-4 d-flex align-items-center justify-content-between pb-4 mt-4" onClick={decoratedOnClick}>
            <strong
                style={{ fontSize: 14, color: '#000' }}
            >
                {title}
            </strong>

            {show ? (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                    </svg>
                </span>
            ) : (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                    </svg>
                </span>
            )}
        </div>
    );
};

const MutipleCampaignInfo = ({ campaigns }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();

    const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign);

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

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên chương trình' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (item, record, index) => {
                let currentDate = new Date().getTime();
                const coming_soon = !!(record?.start_time * 1000 > currentDate && record?.status != 1)
                const finished = !!(record?.end_time * 1000 < currentDate && record?.status != 1)
                const happening = !!(record?.start_time * 1000 < currentDate && record?.end_time * 1000 >= currentDate && record?.status != 1)

                return <div className="d-flex flex-column">
                    <span className="mb-1 cursor-pointer" onClick={() => {
                        if (coming_soon || happening || record?.status == 1) {
                            if (record?.status != 1) {
                                window.open(`/marketing/sale/${record?.id}?action=edit&type=2`, "_blank")
                            } else {
                                window.open(`/marketing/sale/${record?.id}?action=edit`, "_blank")
                            }
                        }

                        if (finished) {
                            window.open(`/marketing/sale/${record?.id}?type=2`, "_blank")
                        }
                    }}>
                        {record?.name}
                    </span>
                    <span className="text-secondary-custom">ID: {record?.id}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian' }),
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '25%',
            render: (item, record, index) => {
                return <div className="d-flex flex-column">
                    <p> {`${dayjs.unix(record?.start_time).format('DD/MM/YYYY HH:mm')} -`}</p>
                    <p>{`${dayjs.unix(record?.end_time).format('DD/MM/YYYY HH:mm')}`}</p>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '20%',
            render: (item, record, index) => {
                let currentDate = new Date().getTime();

                const coming_soon = !!(record?.start_time * 1000 > currentDate && record?.status != 1)
                const finished = !!(record?.end_time * 1000 < currentDate && record?.status != 1)
                const happening = !!(record?.start_time * 1000 < currentDate && record?.end_time * 1000 >= currentDate && record?.status != 1)

                return <span>
                    {item?.status == 1 && 'Chưa duyệt'}
                    {item?.status != 1 && coming_soon && "Sắp diễn ra"}
                    {item?.status != 1 && happening && "Đang diễn ra"}
                    {item?.status != 1 && finished && "Đã kết thúc"}
                </span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thông tin đồng bộ' }),
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '25%',
            render: (item, record, index) => {
                return <Fragment>
                    {!['sync_error', 'partial_sync'].includes(record?.sync_status_info?.status) && <div>
                        <p style={{ color: record?.sync_status_info?.status_color }}>{record?.sync_status_info?.status_text}</p>
                        {record?.synced_at && <p >{dayjs.unix(record?.synced_at).format('DD/MM/YYYY HH:mm')} </p>}
                    </div>}
                    {['sync_error', 'partial_sync'].includes(record?.sync_status_info?.status) && <div className="d-flex justify-content-center align-items-center">
                        <span style={{ color: record?.sync_status_info?.status_color }}>
                            {record?.sync_status_info?.status_text}
                        </span>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {record?.sync_status_info?.status == 'sync_error' && `Đồng bộ chương trình lỗi: ${record?.sync_status_info?.message}`}
                                    {record?.sync_status_info?.status == 'partial_sync' && 'Đồng bộ sản phẩm lỗi'}
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
                                handleApprovedCampaign(record?.id, 'sync')
                            }}><SVG style={{ cursor: 'pointer', marginLeft: '4px', width: '14px', height: '14px' }} src={toAbsoluteUrl("/media/icons/icon-retry.svg")} /></span>
                        </AuthorizationWrapper>
                    </div>}
                </Fragment>
            }
        },
    ]

    return (
        <Fragment>
            <LoadingDialog show={loadingApprovedCampaign} />
            <Accordion key={`other-pos-card`} defaultActiveKey="other-pos">
                <Card id={`other-pos`} className="mb-4" style={{ overflow: 'unset' }}>
                    <CustomToggle
                        eventKey={`other-pos`}
                        title={formatMessage({ defaultMessage: 'CHƯƠNG TRÌNH LẺ' })}
                    />
                    <Accordion.Collapse eventKey={`other-pos`}>
                        <Table
                            // style={(loadingTable || loadingScProductImproveGMV) ? { opacity: 0.4 } : {}}
                            className="upbase-table mx-4 mb-4"
                            columns={columns}
                            data={campaigns}
                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                            </div>}
                            tableLayout="auto"
                            sticky={{ offsetHeader: 45 }}
                        />
                    </Accordion.Collapse>
                </Card>
            </Accordion>
        </Fragment>
    )
}

export default memo(MutipleCampaignInfo);