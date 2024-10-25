import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import { useParams } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../../_metronic/layout";
import mutate_sfCancelSessionHandover from "../../../../../graphql/mutate_sfCancelSessionHandover";
import mutate_sfCompleteSessionHandover from "../../../../../graphql/mutate_sfCompleteSessionHandover";
import mutate_sfPrintHandover from "../../../../../graphql/mutate_sfPrintHandover";
import query_findSessionHandoverDetail from "../../../../../graphql/query_findSessionHandoverDetail";
import query_smeCatalogStores from "../../../../../graphql/query_smeCatalogStores";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import HtmlPrint from "../../HtmlPrint";
import { OPTIONS_SEARCH_SCAN, STATUS_SESSION_DELIVERY } from "../OrderFulfillmentHelper";
import SectionPackages from "./SectionPackages";
import Select from 'react-select';
import mutate_sfAddSessionHandoverPackage from "../../../../../graphql/mutate_sfAddSessionHandoverPackage";
import client from "../../../../../apollo";
import { PackStatusName } from "../../OrderStatusName";
import useScanDetection from "../../../../../hooks/useScanDetection";
import query_coGetPackage from "../../../../../graphql/query_coGetPackage";

const OrderSesionDeliveryDetail = () => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [isCopied, setIsCopied] = useState(false);
    const [currentAction, setCurrentAction] = useState(null);
    const [searchType, setSearchType] = useState(OPTIONS_SEARCH_SCAN[0]);
    const [html, setHtml] = useState(false);
    const [loadingScanPackage, setLoadingScanPackage] = useState(false);
    const [namePrint, setNamePrint] = useState('');
    const inputRefOrder = useRef(null);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Chi tiết phiên giao' }) }
        ])
    }, []);

    const { loading: loadingDetail, data: dataDetail } = useQuery(query_findSessionHandoverDetail, {
        variables: {
            id: +params?.id
        },
        fetchPolicy: 'cache-and-network'
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

    const [mutateSfAddPackages, { loading: loadingSfAddPackages }] = useMutation(mutate_sfAddSessionHandoverPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionHandoverDetail']
    });

    const [mutateSfPrintHandover, { loading: loadingSfPrintHandover }] = useMutation(mutate_sfPrintHandover, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionHandoverDetail']
    });

    const [mutateSfCancelSessionHandover, { loading: loadingSfCancelSessionHandover }] = useMutation(mutate_sfCancelSessionHandover, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionHandoverDetail']
    });

    const [mutateSfCompleteSessionHandover, { loading: loadingSfCompleteSessionHandover }] = useMutation(mutate_sfCompleteSessionHandover, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionHandoverDetail']
    });

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const viewStatus = useMemo(() => {
        let color = '#0D6EFD';
        if (dataDetail?.findSessionHandoverDetail?.status == 1) color = '#00DB6D';
        if (dataDetail?.findSessionHandoverDetail?.status == 2) color = '#F80D0D';

        return <span className='fs-12' style={{
            color: '#fff',
            backgroundColor: color,
            fontWeight: 'bold',
            padding: '4px 18px',
            borderRadius: 20
        }}>
            {STATUS_SESSION_DELIVERY?.[dataDetail?.findSessionHandoverDetail?.status]}
        </span>
    }, [dataDetail?.findSessionHandoverDetail]);

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
        return optionsSmeWarehouse?.find(wh => wh?.value == dataDetail?.findSessionHandoverDetail?.sme_warehouse_id)
    }, [optionsSmeWarehouse, dataDetail?.findSessionHandoverDetail]);

    const totalVariant = useMemo(() => {
        const total = dataDetail?.findSessionHandoverDetail?.handoverPackages?.reduce((result, value) => {
            result += value?.package?.total_purchased || 0;
            return result;
        }, 0);

        return total
    }, [dataDetail?.findSessionHandoverDetail]);

    const onCancelSessionHandover = useCallback(async () => {
        const { data } = await mutateSfCancelSessionHandover({
            variables: {
                list_handover_id: [dataDetail?.findSessionHandoverDetail?.id]
            }
        })

        if (!!data?.sfCancelSessionHandover?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Hủy phiên giao thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfCancelSessionHandover?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Hủy phiên giao thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionHandoverDetail]);

    const onCompleteSessionHandover = useCallback(async () => {
        const { data } = await mutateSfCompleteSessionHandover({
            variables: {
                list_handover_id: [dataDetail?.findSessionHandoverDetail?.id]
            }
        })

        if (!!data?.sfCompleteSessionHandover?.list_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Bàn giao phiên thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfCompleteSessionHandover?.list_fail?.[0]?.error_message || formatMessage({ defaultMessage: 'Bàn giao phiên thất bại' }), { appearance: "error" });
        }
        setCurrentAction(null);
    }, [dataDetail?.findSessionHandoverDetail]);

    const onPrintHandover = useCallback(async () => {
        try {
            const { data } = await mutateSfPrintHandover({
                variables: {
                    list_handover_id: [dataDetail?.findSessionHandoverDetail?.id],
                }
            });

            if (data?.sfPrintHandover?.list_fail?.length == 0) {
                setHtml(data?.sfPrintHandover?.html);
                setNamePrint(formatMessage({ defaultMessage: 'In_biên_bản_bàn_giao' }));
            } else {
                addToast(data?.sfPrintHandover?.message || 'In biên bản thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [dataDetail?.findSessionHandoverDetail]);

    const onAddPackages = useCallback(async (value) => {
        try {
            setLoadingScanPackage(true);
            inputRefOrder.current.value = '';
            const { data: dataPackage } = await client.query({
                query: query_coGetPackage,
                variables: {
                    q: value,
                    search_type: searchType?.value,
                    sme_warehouse_id: dataDetail?.findSessionHandoverDetail?.sme_warehouse_id
                },
                fetchPolicy: 'no-cache'
            });

            if (!!dataPackage?.coGetPackage?.data) {
                const isExistPackage = dataDetail?.findSessionHandoverDetail?.handoverPackages?.some(item => item?.package_id == dataPackage?.coGetPackage?.data?.id);
                const isDiffShippingCarrier = dataDetail?.findSessionHandoverDetail?.handoverPackages?.length > 0 && dataDetail?.findSessionHandoverDetail?.handoverPackages?.some(item => item?.package?.shipping_carrier != dataPackage?.coGetPackage?.data?.shipping_carrier);
                const isDiffStatus = dataPackage?.coGetPackage?.data?.pack_status != 'packed';

                if (isDiffStatus) {
                    const { status } = PackStatusName(dataPackage?.coGetPackage?.data?.pack_status, dataPackage?.coGetPackage?.data?.order?.status);
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đang ở trạng thái “{status}” không hợp lệ .Tính năng này chỉ hỗ trợ những đơn hàng đang ở trạng thái “Chờ lấy hàng”" }, { status: formatMessage(status) }), { appearance: "error" });
                    return;
                }

                if (isExistPackage) {
                    addToast(formatMessage({ defaultMessage: "Kiện hàng đã quét rồi" }), { appearance: "error" });
                    return;
                }

                if (isDiffShippingCarrier) {
                    addToast(formatMessage({ defaultMessage: "Kiện hàng được vận chuyển bởi “{shipping_carrier}” khác với ĐVVC của danh sách hiện tại", }, { shipping_carrier: dataPackage?.coGetPackage?.data?.shipping_carrier }), { appearance: 'error' });
                    return;
                }

                const { data: dataAddPackage } = await mutateSfAddPackages({
                    variables: {
                        id: dataDetail?.findSessionHandoverDetail?.id,
                        package_id: dataPackage?.coGetPackage?.data?.id
                    }
                });

                if (dataAddPackage?.sfAddSessionHandoverPackage?.success) {
                    addToast(formatMessage({ defaultMessage: 'Thêm kiện hàng thành công' }), { appearance: "success" });
                } else {
                    addToast(dataAddPackage?.sfAddSessionHandoverPackage?.message || 'In danh sách thất bại', { appearance: 'error' });
                }
            } else {
                addToast(formatMessage({ defaultMessage: "Kiện không tồn tại" }), { appearance: "error" });
            }

        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        } finally {
            setLoadingScanPackage(false);
        }
    }, [dataDetail?.findSessionHandoverDetail, searchType]);

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefOrder?.current) return;
            onAddPackages(value);
        },
    });

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: 'Chi tiết phiên giao - UpBase' })}
                defaultTitle={formatMessage({ defaultMessage: 'Chi tiết phiên giao - UpBase' })}
            >
                <meta
                    name="description"
                    content={formatMessage({ defaultMessage: 'Chi tiết phiên giao - UpBase' })}
                />
            </Helmet>
            <LoadingDialog show={loadingSfCancelSessionHandover || loadingSfCompleteSessionHandover || loadingSfPrintHandover || loadingScanPackage} />
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
                    ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hủy phiên giao?' })
                    : formatMessage({ defaultMessage: 'Bạn xác nhận bàn giao các kiện hàng cho đơn vị vận chuyển?' })
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
                    <span className='mr-1'>{formatMessage({ defaultMessage: 'Mã phiên giao' })}:</span>
                    <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                        <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(dataDetail?.findSessionHandoverDetail?.code)}>
                            {`${dataDetail?.findSessionHandoverDetail?.code}`}
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
                                    <span className="font-weight-bolder">{formatMessage({ defaultMessage: 'Thông tin phiên giao' })}</span>
                                </div>
                                <div className="row mb-2">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Số lượng kiện hàng' })}</span>
                                        <span>{dataDetail?.findSessionHandoverDetail?.count_package}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}</span>
                                        <span>{totalVariant}</span>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Thời gian tạo' })}</span>
                                        <span>{dayjs(dataDetail?.findSessionHandoverDetail?.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                    </div>
                                    <div className="col-6 d-flex flex-column">
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Thời gian bàn giao' })}</span>
                                        <span>{!!dataDetail?.findSessionHandoverDetail?.handover_at ? dayjs(dataDetail?.findSessionHandoverDetail?.handover_at).format('DD/MM/YYYY HH:mm') : ''}</span>
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
                                        <span>{!!dataDetail?.findSessionHandoverDetail?.created_by_obj ? JSON.parse(dataDetail?.findSessionHandoverDetail?.created_by_obj || "")?.name : '--'}</span>
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
                                        <span className="text-secondary-custom mb-1">{formatMessage({ defaultMessage: 'Biên bản bàn giao' })}</span>
                                        <span>{!!dataDetail?.findSessionHandoverDetail?.print_status ? formatMessage({ defaultMessage: 'Đã in' }) : formatMessage({ defaultMessage: 'Chưa in' })}</span>
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
                        <div className="col-7">
                            {dataDetail?.findSessionHandoverDetail?.status == 3 && <div className="d-flex align-items-center">
                                <span className="mr-1">{formatMessage({ defaultMessage: 'ĐVVC nhận hàng:' })}</span>
                                <span>{dataDetail?.findSessionHandoverDetail?.count_package_valid || 0}</span>
                                <span className="mx-1">/</span>
                                <span className="text-danger">{dataDetail?.findSessionHandoverDetail?.count_package || 0}</span>
                            </div>}
                            {dataDetail?.findSessionHandoverDetail?.status == 1 && <div className="row">
                                <div className="col-3 pr-0">
                                    <Select
                                        options={OPTIONS_SEARCH_SCAN}
                                        className="w-100 custom-select-order flex-4"
                                        value={searchType}
                                        styles={{
                                            container: (styles) => ({
                                                ...styles,
                                                zIndex: 9
                                            }),
                                        }}
                                        onKeyDown={e => {
                                            if (e.keyCode === 39 && !e.target.value) {
                                                inputRefOrder.current.focus();
                                                return;
                                            }
                                        }}
                                        onChange={(value) => setSearchType(value)}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>{option.label}</div>;
                                        }}
                                    />
                                </div>
                                <div className="col-9 px-0">
                                    <div className="input-icon pl-0 flex-6">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={searchType?.value == "system_package_number"
                                                ? formatMessage({ defaultMessage: "Quét hoặc nhập mã kiện hàng" })
                                                : formatMessage({ defaultMessage: "Quét hoặc nhập mã vận đơn" })
                                            }
                                            style={{ height: 37, borderRadius: 0, paddingLeft: "50px", fontSize: "15px" }}
                                            ref={inputRefOrder}
                                            onKeyDown={(e) => {
                                                // if (e.keyCode === 37 && !e.target.value) {
                                                //     // refSelectOrder.current.focus();
                                                //     return;
                                                // }

                                                if (e.keyCode == 13) {
                                                    const valueSearch = e.target.value;
                                                    onAddPackages(valueSearch);
                                                }
                                            }}
                                        />
                                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                    </div>
                                </div>
                            </div>}
                        </div>
                        <div className="col-5">
                            <div className="d-flex align-items-center justify-content-end">
                                {(dataDetail?.findSessionHandoverDetail?.status == 1 || dataDetail?.findSessionHandoverDetail?.status == 3) && <button
                                    className="ml-2 btn btn-primary"
                                    style={{ minWidth: 100 }}
                                    onClick={() => onPrintHandover()}
                                >
                                    {formatMessage({ defaultMessage: "In biên bản" })}
                                </button>}
                                {dataDetail?.findSessionHandoverDetail?.status == 1 && <button
                                    className="ml-2 btn btn-primary"
                                    style={{ minWidth: 100 }}
                                    onClick={() => setCurrentAction({ action: 'complete' })}
                                >
                                    {formatMessage({ defaultMessage: "Bàn giao" })}
                                </button>}
                                {dataDetail?.findSessionHandoverDetail?.status == 1 && <button
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
                        detailSessionHandover={dataDetail?.findSessionHandoverDetail}
                    />
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(OrderSesionDeliveryDetail);