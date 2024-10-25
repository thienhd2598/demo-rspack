import { useMutation, useQuery } from "@apollo/client";
import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import query_sfListPackageInSessionPickup from "../../../../../graphql/query_sfListPackageInSessionPickup";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import PaginationModal from "../../../../../components/PaginationModal";
import Table from 'rc-table';
import dayjs from "dayjs";
import mutate_sfDeleteSessionPickupPackage from "../../../../../graphql/mutate_sfDeleteSessionPickupPackage";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { useHistory } from 'react-router-dom';
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import Select from 'react-select';
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import query_sfCountPackageInSessionPickup from "../../../../../graphql/query_sfCountPackageInSessionPickup";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";
import mutate_getShipmentLabel from "../../../../../graphql/mutate_getShipmentLabel";
import mutate_sfPackSessionPickupPackages from "../../../../../graphql/mutate_sfPackSessionPickupPackages";
import { PackStatusName } from "../../OrderStatusName";
import SVG from "react-inlinesvg";
import mutate_sfPrintPackageInPickup from "../../../../../graphql/mutate_sfPrintPackageInPickup";
import HtmlPrint from "../../HtmlPrint";

const SectionPackages = ({ pickUpId, optionsStore, detailSessionPickup }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();

    const [isCopied, setIsCopied] = useState(false);
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);
    const [currentPackageId, setCurrentPackageId] = useState(null);
    const [currentTabPackage, setCurrentTabPackage] = useState('valid');
    const [currentActions, setCurrentActions] = useState(null);
    const [ids, setIds] = useState([]);
    const [isExpand, setIsExpand] = useState(false);
    const [inVanDon, setInVanDon] = useState(false);
    const [inPhieuXuat, setInPhieuXuat] = useState(false);
    const [html, setHtml] = useState(false);
    const [namePrint, setNamePrint] = useState('');

    const { data: dataCountPackage } = useQuery(query_sfCountPackageInSessionPickup, {
        variables: {
            pickup_id: pickUpId,
            // search: {
            //     print_status: [inVanDon, inPhieuXuat].filter(Boolean)
            // }
        },
        fetchPolicy: "cache-and-network"
    });

    const { loading: loadingPackages, data: dataPackages } = useQuery(query_sfListPackageInSessionPickup, {
        fetchPolicy: "cache-and-network",
        variables: {
            pickup_id: pickUpId,
            per_page: Number(limit),
            search: {
                ...(detailSessionPickup?.status == 3 ? { sub_tab: currentTabPackage } : {}),
                print_status: [inVanDon, inPhieuXuat].filter(Boolean)
            },
            page,
        }
    });

    const TRANG_THAI_IN_VAN_DON = [
        {
            value: '!1',
            label: formatMessage({ defaultMessage: 'Chưa in vận đơn' })
        },
        {
            value: '1',
            label: formatMessage({ defaultMessage: 'Đã in vận đơn' })
        }
    ]

    const TRANG_THAI_IN_PHIEU_XUAT_KHO = [
        {
            value: '!2',
            label: formatMessage({ defaultMessage: 'Chưa in phiếu xuất kho' })
        },
        {
            value: '2',
            label: formatMessage({ defaultMessage: 'Đã in phiếu xuất kho' })
        }
    ]

    const TABS_FULFILLMENT_PACKAGE = useMemo(() => {
        return [
            { label: <FormattedMessage defaultMessage="Hợp lệ" />, value: 'valid', count: dataCountPackage?.sfCountPackageInSessionPickup?.count_valid },
            { label: <FormattedMessage defaultMessage="Lỗi sàn TMĐT" />, value: 'connector_channel_error', count: dataCountPackage?.sfCountPackageInSessionPickup?.count_channel_error },
            { label: <FormattedMessage defaultMessage="Chưa có vận đơn" />, value: 'not_document', count: dataCountPackage?.sfCountPackageInSessionPickup?.count_not_document },
        ]
    }, [dataCountPackage]);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return dataPackages?.sfListPackageInSessionPickup?.list_record?.some(item => item?.id === _id?.id);
    })?.length == dataPackages?.sfListPackageInSessionPickup?.list_record?.length;

    const [deleteSessionPickupPackage, { loading }] = useMutation(mutate_sfDeleteSessionPickupPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListPackageInSessionPickup', 'findSessionPickupDetail', 'sfCountPackageInSessionPickup']
    });

    const [printPackageInPickup, { loading: loadingPrintPackageInPickup }] = useMutation(mutate_sfPrintPackageInPickup, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListPackageInSessionPickup', 'findSessionPickupDetail', 'sfCountPackageInSessionPickup']
    });

    const [packSessionPickupPackages, { loading: loadingPackSession }] = useMutation(mutate_sfPackSessionPickupPackages, {
        awaitRefetchQueries: true,
        refetchQueries: ['sfListPackageInSessionPickup', 'findSessionPickupDetail', 'sfCountPackageInSessionPickup']
    });

    const [getShipmentLabel, { loading: loadingGetShipmentLabel }] = useMutation(mutate_getShipmentLabel);

    const onGetShipmentLabel = async () => {
        let variables = {
            list_package_id: ids?.map(item => item?.id),
            connector_channel_code: ids?.[0]?.connector_channel_code,
            store_id: ids?.[0]?.store_id
        }

        let { data } = await getShipmentLabel({
            variables: variables
        });

        setIds([]);
        if (!!data?.getShipmentLabel?.success) {
            addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện lấy vận đơn từ sàn. Vui lòng chờ trong ít phút sau đó tải lại trang' }), { appearance: 'success' });
        } else {
            addToast(data?.getShipmentLabel?.message || formatMessage({ defaultMessage: 'Xử lý hàng hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    const onPrintPackagesInPickup = useCallback(async (type) => {
        try {
            const { data } = await printPackageInPickup({
                variables: {
                    pickup_id: pickUpId,
                    print_type: type,
                    pickup_package_ids: ids?.map(el => el?.id)
                }
            });

            setIds([]);
            if (data?.sfPrintPackageInPickup?.success) {
                if (type == 1) {
                    window.open(data?.sfPrintPackageInPickup?.html);
                    return;
                }

                setHtml(data?.sfPrintPackageInPickup?.html);
                setNamePrint(type == 1 ? formatMessage({ defaultMessage: 'In_phiếu_nhặt_hàng' }) : formatMessage({ defaultMessage: 'In_phiếu_xuất_kho' }));
            } else {
                addToast(data?.sfPrintPackageInPickup?.message || 'In kiện hàng thất bại', { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, [pickUpId, ids]);

    const onPackSessionPickupPackages = async () => {
        let variables = {
            list_pickup_package_id: ids?.map(item => item?.id),
            pickup_id: pickUpId
        }

        let { data } = await packSessionPickupPackages({
            variables: variables
        });

        setIds([]);
        if (!!data?.sfPackSessionPickupPackages?.success) {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng hàng loạt thành công' }), { appearance: 'success' });
        } else {
            addToast(data?.sfPackSessionPickupPackages?.message || formatMessage({ defaultMessage: 'Chuẩn bị hàng hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    const onDeleteSessionPickupPackage = useCallback(async () => {
        const { data } = await deleteSessionPickupPackage({
            variables: {
                id: detailSessionPickup?.id,
                list_pickup_package_id: currentActions == 'cancel' ? ids?.map(item => item?.id) : [currentPackageId]
            }
        });

        if (currentActions == 'cancel') {
            setCurrentActions(null);
            setIds([]);
        }
        setCurrentPackageId(null);
        if (!!data?.sfDeleteSessionPickupPackage?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa {name} thành công' }, { name: currentActions == 'cancel' ? 'kiện hàng hàng loạt' : 'kiện hàng' }), { appearance: "success" });
        } else {
            addToast(data?.sfDeleteSessionPickupPackage?.message || formatMessage({ defaultMessage: 'Xóa {name} thất bại' }, { name: currentActions == 'cancel' ? 'kiện hàng hàng loạt' : 'kiện hàng' }), { appearance: "error" });
        }
    }, [detailSessionPickup, currentPackageId, ids, currentActions]);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const columns = [
        {
            title: <div className="d-flex align-items-center">
                {[1, 2, 3, 5].includes(detailSessionPickup?.status) && <div className="mr-2">
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        isSelected={isSelectAll}
                        onChange={e => {
                            if (isSelectAll) {
                                setIds(ids.filter(x => {
                                    return !dataPackages?.sfListPackageInSessionPickup?.list_record?.some(ffm => ffm.id === x.id);
                                }))
                            } else {
                                const tempArray = [...ids];
                                (dataPackages?.sfListPackageInSessionPickup?.list_record || []).forEach(ffm => {
                                    if (ffm && !ids.some(item => item.id === ffm.id)) {
                                        tempArray.push(ffm);
                                    }
                                })
                                setIds(tempArray)
                            }
                        }}
                    />
                </div>}
                <span>{formatMessage({ defaultMessage: 'Mã kiện hàng' })}</span>
            </div>,
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '23%',
            fixed: 'left',
            align: 'left',
            className: 'p-0',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 7 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div style={{ padding: '7px', color: '#F80D0D', background: 'rgba(254, 86, 41, 0.31)' }}>{record?.errorMessage}</div>
                }

                const { status, pack_status } = PackStatusName(
                    record?.package?.pack_status,
                    record?.package?.order?.status,
                );

                let color = '';
                switch (pack_status) {
                    case 'pending':
                        color = '#FFA500'
                        break;
                    case 'waiting_for_packing':
                        color = '#FF4500'
                        break;
                    case 'packing':
                        color = '#5e7e1b'
                        break;
                    case 'packed':
                        color = '#35955b'
                        break;
                    case 'shipped':
                        color = '#3699ff'
                        break;
                    case 'shipping':
                        color = '#913f92'
                        break;
                    case 'completed':
                        color = '#03a84e'
                        break;
                    case 'cancelled':
                        color = '#808080'
                        break;
                    default:
                        color = '#000'
                        break;
                };

                const renderStatusColor = <span className='fs-12 mr-2' style={{
                    color: '#fff',
                    backgroundColor: color,
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: 20
                }}>
                    {formatMessage(status)}
                </span>

                return <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center ml-2">
                        {[1, 2, 3, 5].includes(detailSessionPickup?.status) && <Checkbox
                            size='checkbox-md'
                            className="mr-2"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={ids.some(_id => _id?.id == record?.id)}
                            onChange={e => {
                                if (ids.some((_id) => _id.id == record.id)) {
                                    setIds(prev => prev.filter((_id) => _id.id != record.id));
                                } else {
                                    setIds(prev => prev.concat([record]));
                                }
                            }}
                        />}
                        <span>{!!record?.package?.system_package_number &&
                            <span style={{ cursor: 'pointer' }} onClick={() => window.open(`/orders/${record?.package?.order?.id}`, '_blank')}>
                                {record?.package?.system_package_number}
                                <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                    <span className='ml-2 mr-4' onClick={(e) => {
                                        e.stopPropagation();
                                        onCopyToClipBoard(record?.package?.system_package_number)
                                    }}>
                                        <i style={{ fontSize: 12 }} className="far fa-copy text-info"></i>
                                    </span>
                                </OverlayTrigger>
                            </span>
                        }</span>
                    </div>
                    {renderStatusColor}
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Mã vận đơn' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '12%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                return <span>{!!record?.package?.tracking_number && <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                    <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(record?.package?.tracking_number)}>
                        {record?.package?.tracking_number}
                        <span className='ml-2 mr-4'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>
                    </span>
                </OverlayTrigger>}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng hàng hóa' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '13%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                return <span>{record?.package?.total_purchased}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            dataIndex: 'store_id',
            key: 'store_id',
            width: '14%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                const store = optionsStore?.find(st => st?.value == record?.store_id);

                if (!store) return <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>

                return <div className='d-flex align-items-center justify-content-center'>
                    <img
                        style={{ width: 15, height: 15 }}
                        src={store?.logo}
                        className="mr-2"
                    />
                    <span>{store?.label}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian phát sinh' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '13%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                return <span>{!!record?.package?.order?.order_at && dayjs.unix(record?.package?.order?.order_at).format('HH:mm DD/MM/YYYY')}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Hạn xử lý' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '16%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                return <div className="d-flex algin-items-center justify-content-center">
                    <span>{!!record?.package?.order?.tts_expired && dayjs.unix(record?.package?.order?.tts_expired).format('HH:mm DD/MM/YYYY')}</span>
                    {(1 & record?.package?.print_status) == 1 && <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in vận đơn' })}</Tooltip>}>
                        <SVG className="ml-2" src={toAbsoluteUrl("/media/svg/print1.svg")} />
                    </OverlayTrigger>}
                    {(2 & record?.package?.print_status) == 2 && <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Đã in phiếu xuất kho' })}</Tooltip>}>
                        <SVG className="ml-2" src={toAbsoluteUrl("/media/svg/print2.svg")} />
                    </OverlayTrigger>
                    }
                </div>
            }
        },
        ([1, 2].includes(detailSessionPickup?.status) || (detailSessionPickup?.status == 3 && currentTabPackage == 'connector_channel_error')) ? {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '8%',
            fixed: 'center',
            align: 'center',
            onCell(record, index) {
                if (record?.errorMessage) {
                    return { colSpan: 0 };
                }
            },
            render: (item, record) => {
                if (record?.errorMessage) {
                    return <div></div>
                }

                return <i
                    className="fas fa-trash-alt text-danger cursor-pointer"
                    onClick={() => setCurrentPackageId(record?.id)}
                />
            }
        } : null
    ].filter(Boolean);

    console.log({ inVanDon, inPhieuXuat })

    return (
        <Fragment>
            <LoadingDialog show={loading || loadingGetShipmentLabel || loadingPackSession || loadingPrintPackageInPickup} />
            <ModalConfirmCancel
                title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn xoá kiện hàng khỏi danh sách xử lý ?' })}
                titleSuccess={formatMessage({ defaultMessage: 'Có' })}
                show={!!currentPackageId || currentActions == 'cancel'}
                onHide={() => {
                    if (currentActions == 'cancel') {
                        setCurrentActions(null);
                        setIds([]);
                    }
                    setCurrentPackageId(null)
                }}
                onConfirm={onDeleteSessionPickupPackage}
            />
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
            {detailSessionPickup?.status == 3 && <div className="my-2 d-flex align-items-center justify-content-between">
                <div className="d-flex" style={{ gap: 20 }}>
                    {TABS_FULFILLMENT_PACKAGE.map(tab => {
                        const isActive = tab?.value == (currentTabPackage || 'valid');

                        return <span
                            key={`status-package-${tab?.value}`}
                            className="py-2 px-6 d-flex justify-content-between align-items-center cursor-pointer"
                            style={{ borderRadius: 20, background: isActive ? "#ff6d49" : "#828282", color: "#fff" }}
                            onClick={() => {
                                setIds([]);
                                setCurrentTabPackage(tab?.value);
                                setInPhieuXuat(null);
                                setInVanDon(null);
                                setPage(1);
                            }}
                        >
                            {tab?.label} ({tab?.count})
                        </span>
                    })}
                </div>
            </div>}
            {[1, 2, 3, 5].includes(detailSessionPickup?.status) && <div className="d-flex align-items-center justify-content-between">
                <div className='d-flex align-items-center' style={{ minHeight: 37.5 }}>
                    <div className="mr-4 text-primary">
                        {formatMessage({ defaultMessage: 'Đã chọn: {count} kiện hàng' }, { count: ids?.length })}
                    </div>
                    <AuthorizationWrapper keys={['order_session_pickup_actions']}>
                        {detailSessionPickup?.status == 3 && currentTabPackage == 'connector_channel_error' && <Dropdown drop='down' style={{ zIndex: 9 }}>
                            <Dropdown.Toggle disabled={ids?.length == 0} className={`my-2 btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => setCurrentActions('cancel')} className="d-flex">
                                    {formatMessage({ defaultMessage: "Xóa đơn hàng loạt" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={onPackSessionPickupPackages} className="d-flex">
                                    {formatMessage({ defaultMessage: "Chuẩn bị hàng hàng loạt" })}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>}
                        {((detailSessionPickup?.status == 3 && currentTabPackage == 'valid') || detailSessionPickup?.status == 5) && <Dropdown drop='down' style={{ zIndex: 9 }}>
                            <Dropdown.Toggle disabled={ids?.length == 0} className={`my-2 btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onPrintPackagesInPickup(2)} className="d-flex">
                                    {formatMessage({ defaultMessage: "In phiếu xuất" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onPrintPackagesInPickup(1)} className="d-flex">
                                    {formatMessage({ defaultMessage: "In vận đơn" })}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>}
                        {detailSessionPickup?.status == 1 && <button
                            className={`my-2 btn btn-primary`}
                            disabled={ids?.length == 0}
                            onClick={() => setCurrentActions('cancel')}
                        >
                            {formatMessage({ defaultMessage: 'Xóa đơn hàng loạt' })}
                        </button>}
                        {detailSessionPickup?.status == 2 && <Dropdown drop='down' style={{ zIndex: 9 }}>
                            <Dropdown.Toggle disabled={ids?.length == 0} className={`my-2 btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onPrintPackagesInPickup(2)} className="d-flex">
                                    {formatMessage({ defaultMessage: "In phiếu xuất" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setCurrentActions('cancel')} className="d-flex">
                                    {formatMessage({ defaultMessage: 'Xóa đơn hàng loạt' })}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>}
                        {detailSessionPickup?.status == 3 && currentTabPackage == 'not_document' && <button
                            className={`my-2 btn btn-primary`}
                            disabled={ids?.length == 0}
                            onClick={onGetShipmentLabel}
                        >
                            {formatMessage({ defaultMessage: 'Tải vận đơn hàng loạt' })}
                        </button>}
                    </AuthorizationWrapper>
                </div>
                {[2, 3, 5].includes(detailSessionPickup?.status) && <div className="d-flex align-items-center">
                    <div className="mr-4" style={{ width: 225 }}>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Trạng thái in vận đơn" })}
                            isClearable
                            className="w-100"
                            value={TRANG_THAI_IN_VAN_DON.find(el => el?.value == inVanDon) || null}
                            options={TRANG_THAI_IN_VAN_DON}
                            styles={{
                                container: (styles) => ({
                                    ...styles,
                                    zIndex: 9
                                }),
                            }}
                            onChange={values => {
                                setInVanDon(values?.value || null)
                            }}
                        />
                    </div>
                    <div style={{ width: 225 }}>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Trạng thái in phiếu xuất" })}
                            isClearable
                            className="w-100"
                            value={TRANG_THAI_IN_PHIEU_XUAT_KHO.find(el => el?.value == inPhieuXuat) || null}
                            options={TRANG_THAI_IN_PHIEU_XUAT_KHO}
                            styles={{
                                container: (styles) => ({
                                    ...styles,
                                    zIndex: 9
                                }),
                            }}
                            onChange={values => setInPhieuXuat(values?.value || null)}
                        />
                    </div>
                </div>}
            </div>}
            {[1, 2, 3].includes(detailSessionPickup?.status) && detailSessionPickup?.cancel_removed?.length > 0 && <div className="d-flex align-items-center py-2 px-4 mb-2" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
                <svg style={{ minWidth: 'fit-content' }} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-info-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                </svg>
                <span className="fs-14" style={{ color: '#055160' }}>
                    {formatMessage({ defaultMessage: 'Các kiện hàng bị Huỷ trước khi Chuẩn bị hàng sẽ tự động xoá khỏi danh sách xử lý: {listOrderCode}' }, { listOrderCode: detailSessionPickup?.cancel_removed?.slice(0, isExpand ? detailSessionPickup?.cancel_removed?.length : 3)?.join(', ') })}
                    {!isExpand && detailSessionPickup?.cancel_removed?.length > 3 && <span>,...</span>}
                    {' '}{detailSessionPickup?.cancel_removed?.length > 3 && <span
                        className="cursor-pointer"
                        style={{ color: '#0962f3' }}
                        onClick={() => setIsExpand(prev => !prev)}
                    >
                        {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                    </span>}
                </span>
            </div>}
            <div style={{ position: 'relative' }}>
                {loadingPackages && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingPackages ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataPackages?.sfListPackageInSessionPickup?.list_record?.flatMap(item => {
                        if (detailSessionPickup?.status == 3 && currentTabPackage == 'connector_channel_error') {
                            return [item, { errorMessage: item?.package?.connector_channel_error }]
                        }
                        return item
                    }) || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có kiện hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataPackages?.sfListPackageInSessionPickup?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    onPanigate={(page) => setPage(page)}
                    totalPage={Math.ceil(dataPackages?.sfListPackageInSessionPickup?.total / limit)}
                    totalRecord={dataPackages?.sfListPackageInSessionPickup?.total || 0}
                    count={dataPackages?.sfListPackageInSessionPickup?.list_record?.length}
                />
            )}
        </Fragment>
    )
}

export default memo(SectionPackages);