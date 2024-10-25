import { useMutation, useQuery } from "@apollo/client";
import clsx from "clsx";
import dayjs from "dayjs";
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import { useParams } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../../_metronic/layout";
import mutate_sfAssignPickupPic from "../../../../../graphql/mutate_sfAssignPickupPic";
import mutate_sfCancelSessionPickup from "../../../../../graphql/mutate_sfCancelSessionPickup";
import mutate_sfPackSessionPickup from "../../../../../graphql/mutate_sfPackSessionPickup";
import query_findSessionPickupDetail from "../../../../../graphql/query_findSessionPickupDetail";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_userGetSubUsers from "../../../../../graphql/query_userGetSubUsers";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { OPTIONS_TYPE_PICKUP, STATUS_PICKUP } from "../OrderFulfillmentHelper";
import HtmlPrint from "../../HtmlPrint";
import mutate_sfPrintPickup from "../../../../../graphql/mutate_sfPrintPickup";
import ModalAssignPic from "../components/ModalAssignPic";
import SectionPackages from "./SectionPackages";
import SectionProducts from "./SectionProducts";
import EditableNoteVertical from "../components/EditableNoteVertical";
import mutate_sfUpdateNote from "../../../../../graphql/mutate_sfUpdateNote";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import mutate_coExportSessionPick from "../../../../../graphql/mutate_coExportSessionPick";

const OrderFulfillmentDetail = () => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [isCopied, setIsCopied] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [currentTab, setCurrentTab] = useState(1);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Chi tiết danh sách xử lý đơn' }) }
        ])
    }, []);

    const { data: dataSubUsers } = useQuery(query_userGetSubUsers, {
        variables: {
            page: 1,
            pageSize: 200,
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsSubUser = useMemo(() => {
        if (!dataSubUsers?.userGetSubUsers) return []

        return dataSubUsers?.userGetSubUsers?.items?.map(item => ({
            ...item,
            value: item?.id,
            label: item?.username,
        }))
    }, [dataSubUsers]);

    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsStore = useMemo(() => {
        return dataStore?.sc_stores?.map(store => ({
            value: store?.id,
            label: store?.name,
            logo: dataStore?.op_connector_channels?.find(channel => channel?.code == store?.connector_channel_code)?.logo_asset_url,
            connector_channel_code: store?.connector_channel_code
        }));
    }, [dataStore]);

    const { loading: loadingDetail, data: dataDetail } = useQuery(query_findSessionPickupDetail, {
        variables: {
            id: +params?.id
        },
        fetchPolicy: 'cache-and-network'
    });

    const [mutateSfUpdateNote, { loading: loadingSfUpdateNote }] = useMutation(mutate_sfUpdateNote, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail']
    });

    const [mutateSfPrintPickup, { loading: loadingSfPrintPickup }] = useMutation(mutate_sfPrintPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail', 'sfListPackageInSessionPickup']
    });

    const [mutateExportSessionPick, { loading: loadingExportSessionPick }] = useMutation(mutate_coExportSessionPick, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail']
    });

    const [mutateSfAssignPickupPic, { loading: loadingSfAssignPickupPic }] = useMutation(mutate_sfAssignPickupPic, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail']
    });

    const [mutateSfCancelSessionPickup, { loading: loadingSfCancelSessionPickup }] = useMutation(mutate_sfCancelSessionPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail']
    });

    const [mutateSfPackSessionPickup, { loading: loadingSfPackSessionPickup }] = useMutation(mutate_sfPackSessionPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionPickupDetail']
    });

    const { data: dataCatalogStores } = useQuery(query_smeCatalogStores, {
        variables: {
            where: {
                fulfillment_by: { _eq: 1 },
                status: { _eq: 10 }
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const optionsSmeWarehouse = useMemo(() => {
        const optionsCatalogStores = dataCatalogStores?.sme_warehouses?.map(
            _store => ({
                value: _store?.id,
                label: _store?.name,
                isDefault: _store?.is_default,
                ..._store
            })
        );

        return optionsCatalogStores
    }, [dataCatalogStores?.sme_warehouses]);

    const warehouse = useMemo(() => {
        return optionsSmeWarehouse?.find(wh => wh?.value == dataDetail?.findSessionPickupDetail?.sme_warehouse_id)
    }, [optionsSmeWarehouse, dataDetail?.findSessionPickupDetail]);

    const tabOrder = [
        {
            id: 1,
            title: formatMessage({ defaultMessage: 'Kiện hàng' }),
            component: <SectionPackages
                pickUpId={+params?.id}
                detailSessionPickup={dataDetail?.findSessionPickupDetail}
                optionsStore={optionsStore}
            />
        },
        {
            id: 2,
            title: formatMessage({ defaultMessage: 'Sản phẩm' }),
            component: <SectionProducts
                pickUpId={+params?.id}
                optionsStore={optionsStore}
            />
        },
    ]

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const viewStatus = useMemo(() => {
        let color = '#FF5629';
        if (dataDetail?.findSessionPickupDetail?.status == 1) color = '#00DB6D';
        if (dataDetail?.findSessionPickupDetail?.status == 5) color = '#0D6EFD';
        if (dataDetail?.findSessionPickupDetail?.status == 4) color = '#F80D0D';

        return <span className='fs-12' style={{
            color: '#fff',
            backgroundColor: color,
            fontWeight: 'bold',
            padding: '4px 18px',
            borderRadius: 20
        }}>
            {STATUS_PICKUP?.[dataDetail?.findSessionPickupDetail?.status]}
        </span>
    }, [dataDetail?.findSessionPickupDetail]);

    const onCancelSessionPick = useCallback(async () => {
        const { data } = await mutateSfCancelSessionPickup({
            variables: {
                list_session_pickup_id: [dataDetail?.findSessionPickupDetail?.id]
            }
        })

        if (!!data?.sfCancelSessionPickup?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Hủy danh sách xử lý đơn thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfCancelSessionPickup?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy danh sách xử lý đơn thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionPickupDetail]);

    const onPackSessionPick = useCallback(async () => {
        const { data } = await mutateSfPackSessionPickup({
            variables: {
                list_id: [dataDetail?.findSessionPickupDetail?.id]
            }
        })

        if (!!data?.sfPackSessionPickup?.success) {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfPackSessionPickup?.message || formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: "error" });
        }
    }, [dataDetail?.findSessionPickupDetail]);

    const onExportSessionPick = useCallback(async () => {
        const { data } = await mutateExportSessionPick({
            variables: {
                id: dataDetail?.findSessionPickupDetail?.id
            }
        })

        if (!!data?.coExportSessionPick?.success) {
            fetch(data?.coExportSessionPick?.url).then((response) => {
                response.blob().then((blob) => {
                    const fileURL = window.URL.createObjectURL(blob)
                    let alink = document.createElement("a");
                    alink.href = fileURL;
                    alink.download = data?.coExportSessionPick?.file_name;
                    alink.click();
                });
            });
        } else {
            addToast(data?.coExportSessionPick?.message || formatMessage({ defaultMessage: 'Xuất excel thất bại' }), { appearance: "error" });
        }
    }, [dataDetail?.findSessionPickupDetail]);

    const onAssignSessionPick = useCallback(async (currentPic) => {
        const { data } = await mutateSfAssignPickupPic({
            variables: {
                pic_id: String(currentPic),
                list_session_pickup_id: [dataDetail?.findSessionPickupDetail?.id],
            }
        })

        if (!!data?.sfAssignPickupPic?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Phân công nhân viên thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfAssignPickupPic?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Phân công nhân viên thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionPickupDetail]);

    const onPrintPickup = useCallback(async (type) => {
        try {
            const { data } = await mutateSfPrintPickup({
                variables: {
                    id: dataDetail?.findSessionPickupDetail?.id,
                    print_type: type,
                }
            });

            if (data?.sfPrintPickup?.success) {
                if (type == 1) {
                    window.open(data?.sfPrintPickup?.html);
                    return;
                }

                setHtml(data?.sfPrintPickup?.html);
                setNamePrint(type == 1 ? formatMessage({ defaultMessage: 'In_phiếu_nhặt_hàng' }) : formatMessage({ defaultMessage: 'In_phiếu_xuất_kho' }));
            } else {
                addToast(data?.sfPrintPickup?.message || 'In danh sách thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [dataDetail?.findSessionPickupDetail]);

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: 'Chi tiết danh sách xử lý - UpBase' })}
                defaultTitle={formatMessage({ defaultMessage: 'Chi tiết danh sách xử lý - UpBase' })}
            >
                <meta
                    name="description"
                    content={formatMessage({ defaultMessage: 'Chi tiết danh sách xử lý - UpBase' })}
                />
            </Helmet>
            <LoadingDialog show={loadingSfAssignPickupPic || loadingSfCancelSessionPickup || loadingSfPackSessionPickup || loadingSfUpdateNote || loadingSfPrintPickup || loadingExportSessionPick} />
            {html && namePrint && <HtmlPrint
                setNamePrint={setNamePrint}
                html={html}
                setHtml={setHtml}
                namePrint={namePrint}
                pageStyle={`
                        @page {
                            margin: auto;
                            size: A8 landscape;
                        }
                    `}
            />}
            <ModalConfirmCancel
                title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy danh sách xử lý đơn ?' })}
                show={currentAction?.action == 'cancel'}
                onHide={() => setCurrentAction(null)}
                onConfirm={onCancelSessionPick}
            />
            <ModalAssignPic
                show={currentAction?.action == 'assign'}
                onHide={() => setCurrentAction(null)}
                onConfirm={(currentPic) => onAssignSessionPick(currentPic)}
                optionsSubUser={optionsSubUser}
            />
            <div style={{ position: 'relative', opacity: loadingDetail ? 0.4 : 1 }}>
                {loadingDetail && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                    <span className="spinner spinner-primary" />
                </div>}
                <div className="d-flex align-items-center mb-4">
                    <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã danh sách' })}:</span>
                    <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(dataDetail?.findSessionPickupDetail?.code)}>
                            {`${dataDetail?.findSessionPickupDetail?.code}`}
                            <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>
                        </span>
                    </OverlayTrigger>
                    {viewStatus}
                </div>
                <div className="row mb-4">
                    <div className="col-4">
                        <Card style={{ minHeight: 140 }}>
                            <CardBody>
                                <div className="mb-2">
                                    <span className="font-weight-bolder">{formatMessage({ defaultMessage: 'Thông tin danh sách xử lý' })}</span>
                                </div>
                                <div className="row mb-4">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Số lượng kiện hàng' })}</span>
                                        <span>{dataDetail?.findSessionPickupDetail?.count_package}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}</span>
                                        <span>{dataDetail?.findSessionPickupDetail?.total_purchased}</span>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Loại danh sách' })}</span>
                                        <span>{OPTIONS_TYPE_PICKUP?.[dataDetail?.findSessionPickupDetail?.type]}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}</span>
                                        <span>{dayjs(dataDetail?.findSessionPickupDetail?.updated_at).format('HH:mm DD/MM/YYYY')}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="col-4">
                        <Card style={{ minHeight: 140 }}>
                            <CardBody>
                                <div className="mb-2">
                                    <span className="font-weight-bolder">{formatMessage({ defaultMessage: 'Thông tin kho' })}</span>
                                </div>
                                <div className="row mb-4">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Kho xử lý' })}</span>
                                        <span>{warehouse?.label || ''}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Phân công' })}</span>
                                        <span>{optionsSubUser?.find(item => item?.value == dataDetail?.findSessionPickupDetail?.pic_id)?.username || ''}</span>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Ghi chú' })}</span>
                                        <EditableNoteVertical
                                            id={dataDetail?.findSessionPickupDetail?.id}
                                            text={dataDetail?.findSessionPickupDetail?.note}
                                            onConfirm={async (body, callback) => {
                                                const { data } = await mutateSfUpdateNote({ variables: body })

                                                callback();
                                                if (!!data?.sfUpdateNote?.success) {
                                                    addToast(formatMessage({ defaultMessage: 'Cập nhật ghi chú thành công' }), { appearance: 'success' });
                                                } else {
                                                    addToast(data?.sfUpdateNote?.message || formatMessage({ defaultMessage: 'Cập nhật ghi chú thất bại' }), { appearance: 'error' });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="col-4">
                        <Card style={{ minHeight: 140 }}>
                            <CardBody>
                                <div className="mb-2">
                                    <span className="font-weight-bolder">{formatMessage({ defaultMessage: 'Trạng thái in' })}</span>
                                </div>
                                <div className="row mb-4">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Phiếu nhặt hàng' })}</span>
                                        <span>{dataDetail?.findSessionPickupDetail?.print_pickup == 0 ? 'Chưa in' : 'Đã in'}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Phiếu xuất kho' })}</span>
                                        <span>{dataDetail?.findSessionPickupDetail?.print_export == 0 ? 'Chưa in' : <span>Đã in ({dataDetail?.findSessionPickupDetail?.total_package_print_export}/<span className="text-primary">{dataDetail?.findSessionPickupDetail?.count_package}</span>)</span>}</span>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Phiếu vận đơn' })}</span>
                                        <span>{dataDetail?.findSessionPickupDetail?.print_label == 0 ? 'Chưa in' : <span>Đã in ({dataDetail?.findSessionPickupDetail?.total_package_print_label}/<span className="text-primary">{dataDetail?.findSessionPickupDetail?.count_package}</span>)</span>}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
            <Card>
                <CardBody>
                    <div className="d-flex align-items-center justify-content-end">
                        <button
                            className="btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={onExportSessionPick}
                        >
                            {formatMessage({ defaultMessage: "Xuất excel" })}
                        </button>
                        {dataDetail?.findSessionPickupDetail?.status == 1 && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => setCurrentAction({ action: 'assign' })}
                        >
                            {formatMessage({ defaultMessage: "Phân công nhân viên" })}
                        </button>}
                        {dataDetail?.findSessionPickupDetail?.status == 2 && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => onPackSessionPick()}
                        >
                            {formatMessage({ defaultMessage: "Chuẩn bị hàng" })}
                        </button>}
                        {(dataDetail?.findSessionPickupDetail?.status == 2 || dataDetail?.findSessionPickupDetail?.status == 3 || dataDetail?.findSessionPickupDetail?.status == 5) && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => onPrintPickup(64)}
                        >
                            {formatMessage({ defaultMessage: "In phiếu nhặt" })}
                        </button>}
                        {(dataDetail?.findSessionPickupDetail?.status == 2 || dataDetail?.findSessionPickupDetail?.status == 3 || dataDetail?.findSessionPickupDetail?.status == 5) && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => onPrintPickup(2)}
                        >
                            {formatMessage({ defaultMessage: "In phiếu xuất" })}
                        </button>}
                        {(dataDetail?.findSessionPickupDetail?.status == 3 || dataDetail?.findSessionPickupDetail?.status == 5) && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => onPrintPickup(1)}
                        >
                            {formatMessage({ defaultMessage: "In vận đơn" })}
                        </button>}
                        {(dataDetail?.findSessionPickupDetail?.status == 1 || dataDetail?.findSessionPickupDetail?.status == 2) && <button
                            className="ml-2 btn btn-primary"
                            style={{ minWidth: 100 }}
                            onClick={() => setCurrentAction({ action: 'cancel' })}
                        >
                            {formatMessage({ defaultMessage: "Hủy" })}
                        </button>}
                    </div>
                    <div className="d-flex" style={{ zIndex: 1 }}>
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs">
                                {tabOrder.map(tab => (
                                    <li
                                        key={`customer-order-tab-${tab.id}`}
                                        className="nav-item"
                                        onClick={() => setCurrentTab(tab?.id)}
                                    >
                                        <a
                                            className={clsx('nav-link fs-14', { active: currentTab == tab.id })}
                                        >
                                            <span>{tab?.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {tabOrder?.find(tab => tab.id == currentTab)['component']}
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(OrderFulfillmentDetail);