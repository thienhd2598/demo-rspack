import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import Table from 'rc-table';
import { Link } from "react-router-dom";
import InfoProduct from '../../../../../components/InfoProduct';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';

const ModalAlert = ({
    dataErrors,
    onHide,
}) => {
    const { formatMessage } = useIntl();

    console.log({ dataErrors });

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên hàng hóa' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '50%',
            render: (_item, record) => {
                let imgAssets = null;
                if (record?.product?.productAssets?.[0]?.origin_image_url) {
                    imgAssets = record?.product?.productAssets?.[0]
                }

                return (
                    <div className="d-flex">                        
                        <div className='ml-1 d-flex flex-column'>
                            <InfoProduct
                                name={record?.product?.name}
                                isSingle                                
                            />                            
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Kho vật lý' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '50%',
            render: (_item, record) => {
                return (
                    <div className="d-flex">                        
                        <div className='ml-1 d-flex flex-column'>
                            {/* <InfoProduct
                                name={record?.product?.name}
                                isSingle                                
                            />                             */}
                            {record?.warehouse?.name}
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Lỗi' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '50%',
            render: (_item, record) => {
                return (
                    <div className="d-flex flex-column">
                        <div className='d-flex align-items-center'>
                            {record?.error_message}
                        </div>
                    </div>
                )
            }
        },
    ];

    return (
        <Modal
            show={!!dataErrors}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='mt-4 mb-4 d-flex justify-content-center align-items-center text-danger fs-16'>
                    <span>{formatMessage({ defaultMessage: 'Lưu ý: Những hàng hoá dưới đây đang bị lỗi khi tạo phiếu dự trữ.' })}</span>
                </div>
                <Table
                    className="upbase-table"
                    columns={columns}
                    data={dataErrors || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}</span>
                    </div>}
                    tableLayout="auto"
                    scroll={{ y: 350 }}
                    sticky={{ offsetHeader: 0 }}
                />
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalAlert);