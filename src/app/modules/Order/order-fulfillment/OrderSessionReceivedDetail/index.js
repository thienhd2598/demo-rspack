import { useMutation, useQuery } from "@apollo/client";
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
import mutate_sfAddReceivedPackage from "../../../../../graphql/mutate_sfAddReceivedPackage";
import mutate_sfApproveSessionReceived from "../../../../../graphql/mutate_sfApproveSessionReceived";
import mutate_sfCancelSessionReceived from "../../../../../graphql/mutate_sfCancelSessionReceived";
import mutate_sfPrintSessionReceived from "../../../../../graphql/mutate_sfPrintSessionReceived";
import query_findSessionReceivedDetail from "../../../../../graphql/query_findSessionReceivedDetail";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import HtmlPrint from "../../HtmlPrint";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { STATUS_SESSION_DELIVERY } from "../OrderFulfillmentHelper";
import { OrderSessionReceivedDetailProvider, useOrderSessionReceivedDetailContext } from '../context/OrderSesionReceivedDetailContext';
import { useSearchSessionReceived } from "../hooks";
import SectionPackages from "./SectionPackages";
import SectionScan from "./SectionScan";

const STATUS_NEW = 1;
const STATUS_CANCEL = 2;
const STATUS_COMPLETE = 3;

const OrderSesionReceivedDetail = () => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [isCopied, setIsCopied] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    // const [searchType, setSearchType] = useState(OPTIONS_SEARCH_SCAN[0]);
    const [html, setHtml] = useState(false);
    // const [loadingScanPackage, setLoadingScanPackage] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const { inputRefOrder, setIsLoadPackages, isLoadPackages, search } = useOrderSessionReceivedDetailContext();

    const { loading: loadingDetail, data: dataDetail } = useQuery(query_findSessionReceivedDetail, {
        variables: {
            id: +params?.id
        },
        fetchPolicy: 'cache-and-network',
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

    const { refetch: refetchPackages } = useSearchSessionReceived({
        search,
        packages: (dataDetail?.findSessionReceivedDetail?.receivedPackage || []).map((item) => {
            return {
                code: item?.input_search,
                data: {
                    "has_import_history": 0,
                    "keyword": item?.input_search,
                    "object_id": item?.object_id,
                    "object_ref_id": item?.object_ref_id,
                    "object_tracking_number": item?.object_tracking_number,
                    "object_type": item?.object_type,
                    "package_id": item?.package_id,
                    "sf_received_code": null,
                    "sf_received_id": item?.sf_received_id,
                    "store_id": item?.store_id,
                },
                isManual: item?.input_type == 2
            }
        }),
        isLoad: isLoadPackages,
        onComplete: async (item) => {
            // gọi api và refetch lại query_findSessionReceivedDetail
            await mutateSfAddReceivedPackage({
                variables: {
                    sf_received_id: +params?.id,
                    received_package: {
                        input_search: item?.code,
                        input_type: item?.isManual ? 2 : 1,
                        object_id: item?.data?.object_id,
                        object_ref_id: item?.data?.object_ref_id,
                        object_tracking_number: item?.data?.object_tracking_number,
                        object_type: item?.data?.object_type,
                        package_id: item?.data?.package_id,
                        store_id: item?.data?.store_id,
                    }
                }
            })
        },
        onReset: () => {
            setIsLoadPackages(false);
            inputRefOrder.current.value = '';
        }
    });

    const [mutateSfAddReceivedPackage] = useMutation(mutate_sfAddReceivedPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    });

    const [mutateSfPrintRecieved, { loading: loadingSfPrintRecieved }] = useMutation(mutate_sfPrintSessionReceived, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    });

    const [mutateSfCancelSessionRecieved, { loading: loadingSfCancelSessionRecieved }] = useMutation(mutate_sfCancelSessionReceived, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    });

    const [mutateSfCompleteSessionRecieved, { loading: loadingSfCompleteSessionRecieved }] = useMutation(mutate_sfApproveSessionReceived, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionReceivedDetail']
    });

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const viewStatus = useMemo(() => {
        let color = '#0D6EFD';
        let _status = dataDetail?.findSessionReceivedDetail?.status
        if (_status == STATUS_NEW) color = '#00DB6D';
        if (_status == STATUS_CANCEL) color = '#F80D0D';

        return <span className='fs-12' style={{
            color: '#fff',
            backgroundColor: color,
            fontWeight: 'bold',
            padding: '4px 18px',
            borderRadius: 20
        }}>
            {STATUS_SESSION_DELIVERY?.[_status]}
        </span>
    }, [dataDetail?.findSessionReceivedDetail]);

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
        return optionsSmeWarehouse?.find(wh => wh?.value == dataDetail?.findSessionReceivedDetail?.sme_warehouse_id)
    }, [optionsSmeWarehouse, dataDetail?.findSessionReceivedDetail]);

    const onCancelSessionHandover = useCallback(async () => {
        const { data } = await mutateSfCancelSessionRecieved({
            variables: {
                list_received_id: [dataDetail?.findSessionReceivedDetail?.id]
            }
        })

        if (!!data?.sfCancelSessionReceived?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Hủy phiên nhận thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfCancelSessionReceived?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy phiên nhận thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionReceivedDetail]);

    const onCompleteSessionHandover = useCallback(async () => {
        const { data } = await mutateSfCompleteSessionRecieved({
            variables: {
                list_received_id: [dataDetail?.findSessionReceivedDetail?.id]
            }
        });

        if (!!data?.sfApproveSessionReceived?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Giao phiên thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfApproveSessionReceived?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Giao phiên thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionReceivedDetail]);

    const onPrintHandover = useCallback(async () => {
        try {
            const { data } = await mutateSfPrintRecieved({
                variables: {
                    list_session_received_id: [dataDetail?.findSessionReceivedDetail?.id]
                }
            });

            if (data?.sfPrintSessionReceived?.list_fail?.length == 0) {
                setHtml(data?.sfPrintSessionReceived?.html);
                setNamePrint(formatMessage({ defaultMessage: 'In_biên_bản_bàn_giao' }));
            } else {
                addToast(data?.sfPrintSessionReceived?.message || 'In biên bản thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [dataDetail?.findSessionReceivedDetail]);

    const sessionStatus = dataDetail?.findSessionReceivedDetail?.status;
    return (
        <>
            <LoadingDialog show={loadingSfCompleteSessionRecieved || loadingSfCancelSessionRecieved || loadingSfPrintRecieved
                //|| loadingScanPackage
            } />
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
                title={currentAction?.action == 'cancel'
                    ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy phiên nhận?' })
                    : formatMessage({ defaultMessage: 'Bạn xác nhận nhận các kiện hàng từ đơn vị vận chuyển?' })
                }
                show={currentAction?.action == 'cancel' || currentAction?.action == 'complete'}
                titleSuccess={currentAction?.action == 'complete' ? formatMessage({ defaultMessage: 'Xác nhận' }) : formatMessage({ defaultMessage: 'Có, Hủy' })}
                onHide={() => setCurrentAction(null)}
                onConfirm={currentAction?.action == 'complete' ? onCompleteSessionHandover : onCancelSessionHandover}
            />

            <div style={{ position: 'relative', opacity: loadingDetail ? 0.4 : 1 }}>
                {loadingDetail && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                    <span className="spinner spinner-primary" />
                </div>}
                <div className="d-flex align-items-center mb-4">
                    <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã phiên nhận' })}:</span>
                    <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(dataDetail?.findSessionReceivedDetail?.code)}>
                            {`${dataDetail?.findSessionReceivedDetail?.code}`}
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
                                    <span className="font-weight-bolder">{formatMessage({ defaultMessage: 'Thông tin phiên nhận' })}</span>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Số lượng kiện hàng' })}</span>
                                        <span>{dataDetail?.findSessionReceivedDetail?.count_package}</span>
                                    </div>
                                    {sessionStatus != STATUS_COMPLETE && <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Kiện đã xử lý trả hàng' })}</span>
                                        <span>{dataDetail?.findSessionReceivedDetail?.count_imported}</span>
                                    </div>}
                                </div>
                                <div className="row">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Thời gian tạo' })}</span>
                                        <span>{dayjs(dataDetail?.findSessionReceivedDetail?.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Thời gian nhận hàng' })}</span>
                                        <span>{!!dataDetail?.findSessionReceivedDetail?.received_at ? dayjs(dataDetail?.findSessionReceivedDetail?.received_at).format('DD/MM/YYYY HH:mm') : "--"}</span>
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
                                <div className="row mb-2">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Kho xử lý' })}</span>
                                        <span>{warehouse?.label || '--'}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Người tạo' })}</span>
                                        <span>{!!dataDetail?.findSessionReceivedDetail?.created_by_obj ? JSON.parse(dataDetail?.findSessionReceivedDetail?.created_by_obj || "")?.name : '--'}</span>
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
                                <div className="row mb-2">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Biên bản nhận' })}</span>
                                        <span>{!!dataDetail?.findSessionReceivedDetail?.print_status ? formatMessage({ defaultMessage: 'Đã in' }) : formatMessage({ defaultMessage: 'Chưa in' })}</span>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
            <Card>
                <CardBody>
                    <div className="row d-flex align-items-center">
                        <div className={sessionStatus != STATUS_COMPLETE ? "col-7" : "col-9"}>
                            {sessionStatus == STATUS_NEW && <div className="row ml-0">
                                <SectionScan refetchPackages={refetchPackages} />
                            </div>}
                            {sessionStatus == STATUS_COMPLETE && <div className="ml-0">
                                <span style={{ fontSize: "20px" }}> {formatMessage({ defaultMessage: "XỬ LÝ TRẢ HÀNG: " })}
                                    &nbsp; {dataDetail?.findSessionReceivedDetail?.count_imported}/
                                    <span style={{ color: "#FE5629" }}>
                                        {dataDetail?.findSessionReceivedDetail?.count_package}</span>
                                </span>
                                <div className="px-4 py-3 rounded mt-4 d-flex align-items-center" style={{ border: "1px solid #B6EFFB", color: "#055160", background: "#CFF4FC", fontSize: "16px", lineHeight: "24px" }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                    </svg>&nbsp;
                                    {formatMessage({ defaultMessage: "Chỉ được thao tác xoá hoặc đổi kiện với các kiện hàng trả được chọn thủ công trên hệ thống. " })}</div>
                            </div>}
                        </div>
                        <div className={sessionStatus != STATUS_COMPLETE ? "col-5" : "col-3"}>
                            <div className="d-flex align-items-center justify-content-end">
                                {(dataDetail?.findSessionReceivedDetail?.status == 1 || dataDetail?.findSessionReceivedDetail?.status == 3) && <button
                                    className="ml-2 btn btn-primary"
                                    style={{ minWidth: 100 }}
                                    onClick={() => onPrintHandover()}
                                >
                                    {formatMessage({ defaultMessage: "In biên bản" })}
                                </button>}
                                {dataDetail?.findSessionReceivedDetail?.status == 1 && <button
                                    className="ml-2 btn btn-primary"
                                    style={{ minWidth: 100 }}
                                    onClick={() => setCurrentAction({ action: 'complete' })}
                                >
                                    {formatMessage({ defaultMessage: "Nhận hàng" })}
                                </button>}
                                {dataDetail?.findSessionReceivedDetail?.status == 1 && <button
                                    className="ml-2 btn btn-primary"
                                    style={{ minWidth: 100 }}
                                    onClick={() => setCurrentAction({ action: 'cancel' })}
                                >
                                    {formatMessage({ defaultMessage: "Hủy" })}
                                </button>}
                            </div>
                        </div>
                    </div>
                    <SectionPackages
                        pickUpId={+params?.id}
                        loadingDetail={loadingDetail}
                        detailSessionHandover={dataDetail?.findSessionReceivedDetail}
                    />
                </CardBody>
            </Card>
        </>
    )
}

const OrderSesionReceivedDetailWrapper = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Chi tiết phiên nhận' }) }
        ])
    }, []);

    return <Fragment>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: 'Chi tiết phiên nhận - UpBase' })}
            defaultTitle={formatMessage({ defaultMessage: 'Chi tiết phiên nhận - UpBase' })}
        >
            <meta
                name="description"
                content={formatMessage({ defaultMessage: 'Chi tiết phiên nhận - UpBase' })}
            />
        </Helmet>
        <OrderSessionReceivedDetailProvider>
            <OrderSesionReceivedDetail />
        </OrderSessionReceivedDetailProvider>
    </Fragment>
}
export default memo(OrderSesionReceivedDetailWrapper);