import React, { memo, useMemo, useState } from 'react';
import { toAbsoluteUrl } from '../_metronic/_helpers';
import { useIntl } from 'react-intl';
import { Modal } from 'react-bootstrap';
import mutate_update_sme_users_by_pk from '../graphql/mutate_update_sme_users_by_pk';
import { useMutation } from '@apollo/client';
import { useSelector } from 'react-redux';

const StepModal = ({ show, onHide }) => {
    const { formatMessage } = useIntl();
    const { user } = useSelector((state) => state.auth);
    const [currentStep, setCurrentStep] = useState(1);

    const STEPS_INTRO = [
        {
            step: 1,
            title: formatMessage({ defaultMessage: 'Quản lý sản phẩm đa sàn' }),
            content: formatMessage({ defaultMessage: 'Tính năng Quản lý sản phẩm đa sàn giúp người dùng kiểm soát tình trạng của tất cả sản phẩm trên toàn bộ gian hàng đăng bán, hỗ trợ đăng bán, cập nhật lịch sử đẩy tồn và thực hiện các thao tác hàng loạt.' }),
            src: toAbsoluteUrl("/media/steps/step1.png"),
        },
        {
            step: 2,
            title: formatMessage({ defaultMessage: 'Quản lý đồng bộ đơn hàng, kho hàng' }),
            content: formatMessage({ defaultMessage: 'Quản lý đồng bộ đơn hàng, kho hàng hỗ trợ nhà bán hàng kiểm soát, đồng bộ tồn sản phẩm trong kho, theo dõi đơn hàng, lịch sử thay đổi tồn và xử lý đơn hàng loạt.' }),
            src: toAbsoluteUrl("/media/steps/step2.png"),
        },
        {
            step: 3,
            title: formatMessage({ defaultMessage: 'Báo cáo và Phân tích' }),
            content: formatMessage({ defaultMessage: 'Báo cáo và phân tích giúp người dùng có cái nhìn tổng quan về bức tranh tài chính của gian hàng và đánh giá được mức độ hiệu quả bán hàng của sản phẩm.' }),
            src: toAbsoluteUrl("/media/steps/step3.png"),
        },
    ];

    const [mutate, { loading }] = useMutation(mutate_update_sme_users_by_pk, {
        refetchQueries: ['sme_users'],
        awaitRefetchQueries: true
    })

    const stepView = useMemo(() => {
        return STEPS_INTRO?.find(item => item.step == currentStep);
    }, [currentStep]);

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            backdrop={true}
            dialogClassName={"body-dialog-step"}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='mb-6'>
                    <img width="100%" src={stepView?.src} />
                </div>
                <div className='d-flex flex-column align-items-center justify-content-center mb-6'>
                    <span className='fs-16 font-weight-bolder mb-2' style={{ textTransform: 'uppercase' }}>{stepView?.title}</span>
                    <span className='text-center'>{stepView?.content}</span>
                </div>
                {(currentStep == 1 || currentStep == 2) && (
                    <div className='d-flex modal-step justify-content-end align-items-center'>
                        <div className="form-group">
                            <div 
                            className="radio-inline" 
                            onChange={e => {
                                const value = Number(e.target.value);
                                
                                if (value > currentStep) return;
                                setCurrentStep(value)                                
                            }}
                            >

                                {STEPS_INTRO.map(item => {
                                    return (
                                        <label key={`op-${item.step}`} className="radio">
                                            <input type="radio" value={item.step} checked={currentStep == item.step} />
                                            <span></span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                        <button
                            className='btn btn-primary'
                            role='button'
                            onClick={() => setCurrentStep(prev => prev + 1)}
                        >
                            {formatMessage({ defaultMessage: 'Tiếp theo' })}
                        </button>
                    </div>
                )}
                {currentStep == 3 && (
                    <div className='d-flex justify-content-center'>
                        <button
                            className='btn btn-primary'
                            role='button'
                            style={loading ? { minWidth: 160 } : {}}
                            disabled={loading}
                            onClick={async () => {
                                const { data } = await mutate({
                                    variables: {
                                        id: user?.id,
                                        _set: {
                                            is_complete_tutorial: 1
                                        }
                                    }
                                })

                                onHide();
                            }}
                        >
                            <span>{formatMessage({ defaultMessage: 'Bắt đầu sử dụng' })}</span>
                            {loading && <span className="ml-3 spinner spinner-white"></span>}
                        </button>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    )
}

export default memo(StepModal);