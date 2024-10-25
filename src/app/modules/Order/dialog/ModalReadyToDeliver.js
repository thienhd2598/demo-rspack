import dayjs from 'dayjs';
import React, { memo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import weekday from 'dayjs/plugin/weekday';
import _ from "lodash";
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import mutate_coReadyToShipPackage from '../../../../graphql/mutate_coReadyToShipPackage';
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import {useIntl} from 'react-intl'
dayjs.extend(weekday);

const ModalReadyToDelivereliver = ({
    dataOrder,
    openModal,
    onHide,
}) => {
    const [loading, setLoading] = useState(false)
    const { addToast } = useToasts();
    const {formatMessage} = useIntl()


    const [mutate] = useMutation(mutate_coReadyToShipPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages']
    })

    const coReadyToShipPackage = async () => {
        setLoading(true)
        let variables = {
            list_package: [{ package_id: dataOrder?.id }]
        }

        let { data } = await mutate({
            variables: variables
        })
        setLoading(false)
        if (data?.coReadyToShipPackage?.data?.list_package_fail?.length == 0) {
            addToast(formatMessage({defaultMessage:'Sẵn sàng giao thành công'}), { appearance: 'success' });
            onHide('success')
        } else {
            addToast(data?.coReadyToShipPackage?.data?.list_package_fail[0]?.error_message || formatMessage({defaultMessage:'Sẵn sàng giao thất bại'}), { appearance: 'error' });
            onHide()
        }
    }
    return (
        <Modal
            show={openModal == 'ModalReadyToDeliver'}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect modal-pack-order'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({defaultMessage: 'Sẵn sàng giao'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ minHeight: '320px' }}>
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                <div className='row'>
                    <p className='col-12'>
                    {formatMessage({defaultMessage: 'Đơn hàng đóng gói xong sẽ chuyển sang trạng thái "Chờ lấy hàng"'})}
                    </p>
                </div>

                {<LoadingDialog show={loading} />}
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-secondary mr-5"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Hủy bỏ'})}
                    </button>
                    <button
                        type="button"
                        onClick={() => { coReadyToShipPackage(); onHide() }}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({defaultMessage: 'Xác nhận'})}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalReadyToDelivereliver);