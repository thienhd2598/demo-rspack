import React, { Fragment, memo, useCallback, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import ModalIntroStep from '../dialogs/ModalIntroStep';
import { useMutation } from '@apollo/client';
import mutate_guideUpdateStatus from '../../../../graphql/mutate_guideUpdateStatus';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';

const STEPS_GUIDE = [
    { 
        title: <FormattedMessage defaultMessage='Kết nối gian hàng' />, 
        btn: <FormattedMessage defaultMessage='Bắt đầu kết nối' />,
        noti: 'kết nối gian hàng',
        content: <FormattedMessage defaultMessage='Thực hiện kết nối giúp tải sản phẩm từ gian hàng về SME, hỗ trợ quản lý đa kênh.' />,
        description: [
            <FormattedMessage defaultMessage='Kết nối gian hàng/kênh bán' />,            
        ],
        status: 'status_linked_shop_exists', 
        introPath: 'https://guide.upbase.vn/tong-quan/cac-buoc-khoi-tao-co-ban/ket-noi-gian-hang',
        path: '/setting/channels'
    },
    { 
        title: <FormattedMessage defaultMessage='Chuẩn hóa kho' />,
        btn: <FormattedMessage defaultMessage='Bắt đầu chuẩn hóa' />, 
        noti: 'chuẩn hóa kho',
        description: [
            <FormattedMessage defaultMessage='Khởi tạo sản phẩm kho' />,            
            <FormattedMessage defaultMessage='Thiết lập tồn thực tế' />,            
        ],
        content: <FormattedMessage defaultMessage='Thực hiện chuẩn hóa sản phẩm kho giúp tối ưu xử lý fullfillment và tồn kho.' />,
        status: 'status_sme_product_exists', 
        introPath: 'https://guide.upbase.vn/tinh-nang-san-pham/quan-ly-kho/huong-dan/them-moi-san-pham-kho-and-lien-ket-san-pham-san',
        path: '/products/new' 
    },
    { 
        title: <FormattedMessage defaultMessage='Liên kết hàng hóa' />, 
        btn: <FormattedMessage defaultMessage='Bắt đầu liên kết' />,
        noti: 'liên kết hàng hóa',
        description: [
            <FormattedMessage defaultMessage='Liên kết hàng hoá sàn với hàng hoá kho' />,            
        ],
        content: <FormattedMessage defaultMessage='Thực hiện liên kết giúp tối ưu hóa quá trình quản lý tồn kho và đơn hàng.' />,
        status: 'status_linked_product_exists', 
        introPath: 'https://guide.upbase.vn/tinh-nang-san-pham/quan-ly-kho/huong-dan/them-moi-san-pham-kho-and-lien-ket-san-pham-san',
        path: '/product-stores/connect?page=1&type=stock' 
    },
    { 
        title: <FormattedMessage defaultMessage='Thiết lập xử lý tồn' />,
        btn: <FormattedMessage defaultMessage='Bắt đầu thiết lập' />,
        noti: 'thiết lập xử lý tồn', 
        description: [
            <FormattedMessage defaultMessage='Bật xử lý tồn kho' />,
            <FormattedMessage defaultMessage='Liên kết kho' />,
        ],
        content: <FormattedMessage defaultMessage='Bật xử lý tồn, liên kết kho giúp khấu trừ tồn vào hàng hoá kho khi phát sinh và xử lý đơn hàng.' />,
        status: 'status_inventory_handling_enabled', 
        introPath: 'https://guide.upbase.vn/tong-quan/cac-buoc-khoi-tao-co-ban/thiet-lap-cau-hinh-he-thong',
        path: '/setting/sync-warehouse' 
    },
];


const BlockSteps = ({ dataGuideStatus, progress }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const [stepForcus, setStepForcus] = useState(null);   

    const [mutateGuideUpdateStatus, { loading }] = useMutation(mutate_guideUpdateStatus, {
        awaitRefetchQueries: true,
        refetchQueries: ['guideStatus'],
    });    

    const onUpdateGuideStatus = useCallback(async (type) => {
        const notification = STEPS_GUIDE.find(step => step.status == type)?.noti;

        const { data } = await mutateGuideUpdateStatus({
            variables: {
                type, value: 1
            }
        });        

        if (!!data?.guideUpdateStatus) {
            addToast(formatMessage({ defaultMessage: 'Bỏ qua {name} thành công' }, { name: notification }), { appearance: 'success' });
        } else {
            addToast(formatMessage({ defaultMessage: 'Bỏ qua {name} thất bại' }, { name: notification }), { appearance: 'error' });
        }
    }, [STEPS_GUIDE]);

    return (
        <Fragment>
            <LoadingDialog show={loading} />
            <h3 className='txt-title'>
                {formatMessage({ defaultMessage: 'Các bước cần làm' })}
            </h3>
            <ProgressBar
                style={{ height: 8 }}                
                className='fs-16 mb-6'
                now={progress}
                label={``}
            />
            <div className='step-guide'>
                {!!stepForcus && <ModalIntroStep
                    stepForcus={stepForcus}
                    isDone={dataGuideStatus?.[stepForcus?.status] == 2 || dataGuideStatus?.[stepForcus?.status] == 1}
                    onConfirm={() => history.push(stepForcus?.path)}
                    onHide={() => setStepForcus(null)}
                    onUpdate={(type) => {
                        setStepForcus(null);
                        onUpdateGuideStatus(type);
                    }}
                />}
                <div className='step-guide-line' />
                <ul className='step-guide-list'>
                    {STEPS_GUIDE.map(step => {
                        const isStepDone = dataGuideStatus?.[step.status] == 2 || dataGuideStatus?.[step.status] == 1;
                        const stepShow = { ...step, active: isStepDone };

                        return (
                            <li
                                role='button'
                                key={`step-guide-${step.status}`}
                                className='step-guide-item d-flex align-items-center'
                                onClick={() => setStepForcus(stepShow)}
                            >
                                <div className='mr-4'>
                                    {isStepDone ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                                        </svg>
                                    ) : (
                                        <div className='step-guide-none' />
                                    )}
                                </div>
                                <span>{step?.title}</span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </Fragment>
    )
};

export default memo(BlockSteps)