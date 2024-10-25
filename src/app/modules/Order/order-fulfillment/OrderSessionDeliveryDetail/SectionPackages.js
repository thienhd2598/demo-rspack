import { useMutation } from "@apollo/client";
import Table from 'rc-table';
import React, { Fragment, memo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { useHistory } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import mutate_sfDeleteSessionHandoverPackage from "../../../../../graphql/mutate_sfDeleteSessionHandoverPackage";
import { formatNumberToCurrency } from "../../../../../utils";
import LoadingDialog from "../../../FrameImage/LoadingDialog";
import ModalConfirmCancel from "../../dialog/ModalConfirmCancel";
import { PackStatusName } from "../../OrderStatusName";

const SectionPackages = ({ pickUpId, detailSessionHandover, loadingDetail }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();

    const [isCopied, setIsCopied] = useState(false);    
    const [currentPackageId, setCurrentPackageId] = useState(null);

    const [deleteSessionHandover, { loading }] = useMutation(mutate_sfDeleteSessionHandoverPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['findSessionHandoverDetail']
    });

    const onDeleteSessionHandover = useCallback(async () => {
        const { data } = await deleteSessionHandover({
            variables: {
                id: detailSessionHandover?.id,
                handover_package_id: currentPackageId
            }
        });

        setCurrentPackageId(null);
        if (!!data?.sfDeleteSessionHandoverPackage?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa kiện hàng thành công' }), { appearance: "success" });
        } else {
            addToast(data?.sfDeleteSessionHandoverPackage?.message || formatMessage({ defaultMessage: 'Xóa kiện hàng thất bại' }), { appearance: "error" });
        }
    }, [detailSessionHandover, currentPackageId]);

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Mã kiện hàng' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '25%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
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

                const renderStatusColor = <span className='fs-12' style={{
                    color: '#fff',
                    backgroundColor: color,
                    fontWeight: 'bold',
                    padding: '4px 8px',
                    borderRadius: 20
                }}>
                    {formatMessage(status)}
                </span>

                return <div className="d-flex justify-content-between align-items-center">
                    <span>{record?.package?.system_package_number}</span>
                    {renderStatusColor}
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng hàng hóa' }),
            dataIndex: 'id',
            key: 'id',
            width: '18%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <b>{record?.package?.total_purchased}</b>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thành tiền' }),
            dataIndex: 'id',
            key: 'id',
            width: '18%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <b>{formatNumberToCurrency(record?.package?.order?.paid_price)}đ</b>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Vận chuyển' }),
            dataIndex: 'id',
            key: 'id',
            width: '25%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                return <div className='d-flex flex-column'>
                    <span className="mb-1">{record?.package?.shipping_carrier}</span>
                    <span>{formatMessage({ defaultMessage: "Mã vận đơn: {name}" }, { name: record?.package?.tracking_number })}</span>
                </div>
            }
        },
        detailSessionHandover?.status == 1 ? {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '8%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <i
                    className="fas fa-trash-alt text-danger cursor-pointer"
                    style={{ cursor: detailSessionHandover?.handoverPackages?.length > 1 ? 'pointer' : 'not-allowed' }}
                    onClick={() => {
                        if (detailSessionHandover?.handoverPackages?.length == 1) return;
                        setCurrentPackageId(record?.id)
                    }}
                />
            }
        } : null
    ].filter(Boolean);

    return (
        <Fragment>
            <LoadingDialog show={loading} />
            <ModalConfirmCancel
                title={formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn xoá kiện hàng khỏi phiên giao?' })}
                titleSuccess={formatMessage({ defaultMessage: 'Có, Xóa' })}
                show={!!currentPackageId}
                onHide={() => setCurrentPackageId(null)}
                onConfirm={onDeleteSessionHandover}
            />
            <div className="mt-4" style={{ position: 'relative' }}>
                {loadingDetail && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingDetail ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={detailSessionHandover?.handoverPackages || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có kiện hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
        </Fragment>
    )
}

export default memo(SectionPackages);