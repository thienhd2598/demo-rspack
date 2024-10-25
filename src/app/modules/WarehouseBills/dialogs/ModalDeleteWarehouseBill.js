import { useMutation } from '@apollo/client';
import React, { memo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import mutate_delete_warehouse_bills_by_pk from '../../../../graphql/mutate_delete_warehouse_bills_by_pk ';
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';


const ModalDeleteWarehouseBill = ({ id, onHide, type }) => {
    const { formatMessage } = useIntl();
    const [deleteWarehouseBills, { loading }] = useMutation(mutate_delete_warehouse_bills_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_bills']
    });

    const { addToast } = useToasts();

    return (
        <Modal
            show={!!id}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            onHide={onHide}
            dialogClassName={loading ? 'width-fit-content' : ''}
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                {
                    loading && <>
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </>
                }
                {
                    !loading && (
                        <>
                            <div className="mb-6" >
                                {formatMessage({ defaultMessage: 'Bạn có muốn xoá không ?' })}
                            </div>

                            <div className="form-group mb-0">
                                <button
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 200 }}
                                    onClick={onHide}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Không' })}</span>
                                </button>
                                <button
                                    className={`btn btn-primary font-weight-bold`}
                                    style={{ width: 200 }}
                                    onClick={async () => {
                                        let { data } = await deleteWarehouseBills({
                                            variables: { id }
                                        });

                                        onHide();
                                        if (data?.delete_warehouse_bills_by_pk?.id) {
                                            addToast(formatMessage({ defaultMessage: `Xóa phiếu {name} thành công` }, { name: type === 'in' ? formatMessage({ defaultMessage: 'nhập kho' }) : formatMessage({ defaultMessage: 'xuất kho' }) }), { appearance: 'success' });
                                        } else {
                                            addToast(formatMessage({ defaultMessage: `Xóa phiếu {name} thất bại` }, { name: type === 'in' ? formatMessage({ defaultMessage: 'nhập kho' }) : formatMessage({ defaultMessage: 'xuất kho' }) }), { appearance: 'error' });
                                        }
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Có, Xóa' })}</span>
                                </button>
                            </div>
                        </>
                    )
                }
            </Modal.Body>
        </Modal>
    )
};

export default memo(ModalDeleteWarehouseBill);