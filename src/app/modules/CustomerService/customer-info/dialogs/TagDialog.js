import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import CreatableSelect from 'react-select/creatable';
import mutate_crmSaveCustomerTags from '../../../../../graphql/mutate_crmSaveCustomerTags';
import { useMutation } from '@apollo/client';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';
const TagDialog = memo(({
    show,
    onHide,
    dataTags,
    list_customer_id, 
    optionsTags,
    type = 'single'
}) => {
    const [tags, setTags] = useState([]);
    const { formatMessage } = useIntl();
    const { removeAllToasts, addToast } = useToasts();

    const [crmSaveCustomerTags, { loading: loadingCrmSaveCustomerTags }] = useMutation(mutate_crmSaveCustomerTags, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmFindCustomer', 'crmGetCustomers', 'crmGetTag']
    });    

    const resetForm = useCallback(() => {
        onHide();
        setTags([]);
    }, []);

    const onTagUpdate = useCallback(async () => {
        try {
            const { data } = await crmSaveCustomerTags({
                variables: {
                    action_type: type == 'mutilple' ? 1 : 0,
                    list_customer_id,
                    tags: (tags?.map(tag => {
                        let { value, label } = tag;
                        if (tag?.__isNew__) {
                            return {
                                id: null,
                                title: label
                            }
                        }
                        return {
                            id: value,
                            title: label
                        }
                    }) || [])?.concat(dataTags?.map(tag => ({ id: tag?.id, title: tag?.title }))),
                }
            });

            resetForm();
            if (!!data?.crmSaveCustomerTags?.success) {
                addToast(formatMessage({ defaultMessage: 'Thêm tag khách hàng thành công' }), { appearance: "success" });
            } else {
                addToast(data?.crmSaveCustomerTags?.message || formatMessage({ defaultMessage: 'Thêm tag khách hàng thất bại' }), { appearance: "error" });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, [list_customer_id, tags, type, dataTags]);

    return (
        <Fragment>
            <LoadingDialog show={loadingCrmSaveCustomerTags} />
            {!loadingCrmSaveCustomerTags && <Modal
                show={show}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => { }}
                backdrop={true}
            >
                <Modal.Header>
                    <Modal.Title>{formatMessage({ defaultMessage: 'Thêm tag khách hàng' })}</Modal.Title>
                    <i
                        className="drawer-filter-icon fas fa-times icon-md text-right"
                        style={{ cursor: "pointer" }}
                        onClick={resetForm}
                    />
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='text-center'>
                        <CreatableSelect
                            placeholder={formatMessage({ defaultMessage: "Nhập thêm tag mới hoặc chọn tag khách hàng" })}
                            value={tags}
                            isMulti
                            isClearable
                            onChange={values => {
                                if (values?.length > 0 && values?.some(_value => _value?.label?.trim()?.length > 255)) {
                                    removeAllToasts();
                                    addToast(formatMessage({ defaultMessage: 'Tag khách hàng tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                                    return;
                                }
                                setTags(values)
                            }}
                            options={optionsTags}
                            formatCreateLabel={(inputValue) => formatMessage({ defaultMessage: "Tạo mới: {value}" }, { value: inputValue })}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <AuthorizationWrapper keys={['customer_service_customer_info_update']}>
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 120 }}
                            disabled={tags?.length == 0}
                            onClick={onTagUpdate}
                        >
                            <span className="font-weight-boldest">
                                {formatMessage({ defaultMessage: 'Lưu' })}
                            </span>
                        </button>
                    </AuthorizationWrapper>
                </Modal.Footer>
            </Modal>}
        </Fragment>
    )
});

export default TagDialog;

export const actionKeys = {
    "customer_service_customer_tags_update": {
        router: '',
        actions: ["crmSaveCustomerTags", 'crmFindCustomer', 'crmGetCustomers', 'crmGetTag'],
        name: 'Cập nhật tag hàng loạt',
        group_code: 'customer_info',
        group_name: 'Thông tin khách hàng',
        cate_code: 'customer_service',
        cate_name: 'Chăm sóc khách hàng'
    }
};