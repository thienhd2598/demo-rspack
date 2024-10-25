import React, { useMemo, useState, memo, Fragment, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import EditableVertical from '../components/EditableVertical';
import mutate_crmUpdateCustomer from '../../../../../graphql/mutate_crmUpdateCustomer';
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import AddressDialog from '../dialogs/AddressDialog';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import mutate_crmSaveCustomerTags from '../../../../../graphql/mutate_crmSaveCustomerTags';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import TagDialog from '../dialogs/TagDialog';
import query_crmGetTag from '../../../../../graphql/query_crmGetTag';
import query_crmGetWards from '../../../../../graphql/query_crmGetWards';


const SectionCustomerInfo = ({ data, loading, optionsProvince, optionsDistrict, optionsChannelCode, optionsStore }) => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [showAddress, setShowAddress] = useState(false);
    const [showAddTag, setShowAddTag] = useState(false);
    const [expandTag, setExpandTag] = useState(false);

    const { data: dataCrmGetTag } = useQuery(query_crmGetTag, {
        fetchPolicy: "cache-and-network",
    });

    const [crmUpdateCustomer, { loading: loadingCrmUpdateCustomer }] = useMutation(mutate_crmUpdateCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmFindCustomer']
    });

    const [crmSaveCustomerTags, { loading: loadingCrmSaveCustomerTags }] = useMutation(mutate_crmSaveCustomerTags, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmFindCustomer']
    });

    const optionsTags = useMemo(() => {
        return dataCrmGetTag?.crmGetTag?.map(tag => ({
            value: tag?.id,
            label: tag?.title,
        }));
    }, [dataCrmGetTag]);

    const [province, district] = useMemo(() => {
        if (!data) return []
        return [
            optionsProvince?.find(item => item?.value == data?.province_code)?.label,
            optionsDistrict[data?.province_code]?.find(item => item?.value == data?.district_code)?.label,
        ]
    }, [data, optionsProvince, optionsDistrict]);

   
    
    const stores = useMemo(() => {
        return optionsStore?.filter(st => data?.crmStore?.some(item => item?.store_id == st?.value))
    }, [optionsStore, data]);

    const onTagUpdate = useCallback(async (id) => {
        try {
            const { data: dataTags } = await crmSaveCustomerTags({
                variables: {
                    list_customer_id: [Number(params?.id)],
                    action_type: 0,
                    tags: data?.crmTag?.filter(tag => tag?.id != id)?.map(tag => ({
                        id: tag?.id,
                        title: tag?.title
                    }))
                }
            });

            if (!!dataTags?.crmSaveCustomerTags?.success) {
                addToast(formatMessage({ defaultMessage: 'Xóa tag khách hàng thành công' }), { appearance: "success" });
            } else {
                addToast(dataTags?.crmSaveCustomerTags?.message || formatMessage({ defaultMessage: 'Xóa tag khách hàng thất bại' }), { appearance: "error" });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, [params?.id, data]);

    const onUpdateCustomer = useCallback(async (body, callback, type) => {
        try {
            const mss = {
                ['name']: formatMessage({ defaultMessage: 'tên khách hàng' }),
                ['email']: formatMessage({ defaultMessage: 'email' }),
                ['phone']: formatMessage({ defaultMessage: 'số điện thoại' }),
            };

            const { data } = await crmUpdateCustomer({
                variables: body
            });

            callback();
            if (!!data?.crmUpdateCustomer?.success) {
                addToast(formatMessage({ defaultMessage: 'Cập nhật {mss} thành công' }, { mss: mss[type] }), { appearance: "success" });
            } else {
                addToast(data?.crmUpdateCustomer?.message || formatMessage({ defaultMessage: 'Cập nhật {mss} thất bại' }, { mss: mss[type] }), { appearance: "error" });
            }
        } catch (error) {
            callback();
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, []);

    return (
        <Fragment>
            <LoadingDialog show={loadingCrmSaveCustomerTags} />
            <AddressDialog
                show={showAddress}
                onHide={() => setShowAddress(false)}
                id={Number(params?.id)}
                data={data}
                optionsProvince={optionsProvince}
                optionsDistrict={optionsDistrict}
            />
            {!!showAddTag && <TagDialog
                show={showAddTag}
                onHide={() => setShowAddTag(false)}
                dataTags={data?.crmTag || []}
                list_customer_id={[Number(params?.id)]}
                optionsTags={optionsTags}
            />}
            {!!loading && (
                <div className='d-flex justify-content-center align-items-center my-20'>
                    <span className="spinner spinner-primary" />
                </div>
            )}
            {!loading && (
                <div className='customer-info-wrapper d-flex flex-column'>
                    <span className='txt-title mt-4'>{data?.name || '--'}</span>
                    <span className='text-center my-4'>{data?.seller_username || '--'}</span>
                    {data?.crmStore?.length == 1 && !data?.crmStore?.[0]?.store_id && (
                        <div className='mb-4 d-flex justify-content-center align-items-center'>
                            <img
                                style={{ width: 15, height: 15 }}
                                src={optionsChannelCode?.find(op => op?.value == data?.crmStore?.[0]?.connector_channel_code)?.logo}
                                className="mr-2"
                            />
                            <span>{optionsChannelCode?.find(op => op?.value == data?.crmStore?.[0]?.connector_channel_code)?.label}</span>
                        </div>
                    )}
                    {stores?.length > 0 && (
                        <div className='mb-4 d-flex align-items-center justify-content-center flex-wrap' style={{ gap: 4 }}>
                            {stores?.map(store => (
                                <div className='d-flex align-items-center'>
                                    <img
                                        style={{ width: 15, height: 15 }}
                                        src={store?.logo}
                                        className="mr-2"
                                    />
                                    <span>{store?.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className='mb-2 d-flex align-items-center justify-content-center flex-wrap' style={{ gap: 4 }}>
                        {data?.crmTag?.length > 0 && data?.crmTag?.slice(0, expandTag ? data?.crmTag?.length : 2)?.map((tag, index) => (
                            <div className='upbase-tag' key={`upbase-tag-customer-${index}`}>
                                <span className='mr-2' title={tag?.title}>
                                    {tag?.title?.length > 12 ? `${tag?.title?.slice(0, 12)}...` : tag?.title}
                                </span>
                                <span role='button' onClick={() => onTagUpdate(tag?.id)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                    </svg>
                                </span>
                            </div>
                        ))}
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Thêm tag' })}
                                </Tooltip>
                            }
                        >
                            <span role='button' onClick={() => setShowAddTag(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" color='#ff5629' width="16" height="16" fill="currentColor" class="bi bi-plus-square-fill" viewBox="0 0 16 16">
                                    <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0" />
                                </svg>
                            </span>
                        </OverlayTrigger>
                        {data?.crmTag?.length > 2 && (
                            <span
                                role="button"
                                className='text-primary ml-2'
                                onClick={() => setExpandTag(prev => !prev)}
                            >
                                {expandTag ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                            </span>
                        )}
                    </div>
                    <div className='box-info d-flex flex-column'>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Tên tài khoản kênh bán' })}
                            </span>
                            <span>{data?.seller_username || '--'}</span>
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Email' })}
                            </span>
                            <EditableVertical
                                type="email"
                                text={data?.email}
                                id={Number(params?.id)}
                                onConfirm={onUpdateCustomer}
                            />
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Số điện thoại' })}
                            </span>
                            <EditableVertical
                                type="phone"
                                text={data?.phone}
                                id={Number(params?.id)}
                                onConfirm={onUpdateCustomer}
                            />
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Tỉnh/Thành phố' })}
                            </span>
                            <span>{province || '--'}</span>
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Quận/Huyện' })}
                            </span>
                            <span>{district || '--'}</span>
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Phường/Xã' })}
                            </span>
                            <span>{data?.wards_name || '--'}</span>
                        </div>
                        <div className='d-flex flex-column mb-4'>
                            <span className='text-secondary-custom mb-1'>
                                {formatMessage({ defaultMessage: 'Địa chỉ' })}
                            </span>
                            <div className='d-flex algin-items-center'>
                                <span style={{ maxWidth: '92%' }}>{data?.address || '--'}</span>
                                <i
                                    role="button"
                                    className="ml-2 text-dark far fa-edit"
                                    onClick={() => setShowAddress(true)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
};

export default memo(SectionCustomerInfo);