import React, { Fragment, useMemo, useState, memo, useCallback } from 'react'
import { useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import { useHistory, useLocation } from "react-router-dom";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import dayjs from 'dayjs';
import queryString from "querystring";
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import Pagination from '../../../../../components/Pagination';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import EditableVertical from './EditableVertical';
import query_crmGetCustomers from '../../../../../graphql/query_crmGetCustomers';
import { useMutation, useQuery } from '@apollo/client';
import mutate_crmDeleteCustomer from '../../../../../graphql/mutate_crmDeleteCustomer';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import mutate_crmUpdateCustomer from '../../../../../graphql/mutate_crmUpdateCustomer';
import mutate_crmSaveCustomerTags from '../../../../../graphql/mutate_crmSaveCustomerTags';
import TagDialog from '../dialogs/TagDialog';
import ClampLines from 'react-clamp-lines';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const TableCustomerInfo = ({ ids, setIds, searchVariables, optionsStore, optionsTags, optionsChannelCode }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const [currentIdDelete, setCurrentIdDelete] = useState(null);
    const [currentTag, setCurrentTag] = useState(null);
    const [currentIdCustomer, setCurrentIdCustomer] = useState(null);
    const [expands, setExpands] = useState([]);
    const [expandsStore, setExpandsStore] = useState([]);
    const params = queryString.parse(location.search.slice(1, 100000));
    const loading = false;

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit]);

    const { loading: loadingCustomers, data: dataCustomers } = useQuery(query_crmGetCustomers, {
        fetchPolicy: "cache-and-network",
        variables: {
            page,
            per_page: limit,
            search: searchVariables
        }
    });

    const [crmDeleteCustomer, { loading: loadingCrmDeleteCustomer }] = useMutation(mutate_crmDeleteCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetCustomers']
    });

    const [crmUpdateCustomer, { loading: loadingCrmUpdateCustomer }] = useMutation(mutate_crmUpdateCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetCustomers']
    });

    const [crmSaveCustomerTags, { loading: loadingCrmSaveCustomerTags }] = useMutation(mutate_crmSaveCustomerTags, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetCustomers']
    });

    console.log({ dataCustomers });

    let totalRecord = dataCustomers?.crmGetCustomers?.total || 0;
    let totalPage = Math.ceil(totalRecord / limit);


    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return dataCustomers?.crmGetCustomers?.customers?.some(item => item?.id === _id?.id);
    })?.length == dataCustomers?.crmGetCustomers?.customers?.length;

    const onTagUpdate = useCallback(async (id, idCustomer, crmTags) => {
        try {
            const { data } = await crmSaveCustomerTags({
                variables: {
                    action_type: 0,
                    list_customer_id: [Number(idCustomer)],
                    tags: crmTags?.filter(tag => tag?.id != id)?.map(tag => ({
                        id: tag?.id,
                        title: tag?.title
                    })),
                }
            });

            if (!!data?.crmSaveCustomerTags?.success) {
                addToast(formatMessage({ defaultMessage: 'Xóa tag khách hàng thành công' }), { appearance: "success" });
            } else {
                addToast(data?.crmSaveCustomerTags?.message || formatMessage({ defaultMessage: 'Xóa tag khách hàng thất bại' }), { appearance: "error" });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, []);

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

    const onDeleteCustomer = useCallback(async () => {
        const { data } = await crmDeleteCustomer({
            variables: { id: currentIdDelete }
        });

        setCurrentIdDelete(null);
        if (!!data?.crmDeleteCustomer?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa khách hàng thành công' }), { appearance: "success" });
        } else {
            addToast(formatMessage({ defaultMessage: 'Xóa khách hàng thất bại' }), { appearance: "error" });
        }
    }, [currentIdDelete]);

    const columns = useMemo(() => {
        return [
            {
                title: <div className='d-flex align-items-center'>
                    <div className="mr-2">
                        <Checkbox
                            size="checkbox-md"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={isSelectAll}
                            onChange={e => {
                                if (isSelectAll) {
                                    setIds(ids.filter(x => {
                                        return !dataCustomers?.crmGetCustomers?.customers?.some(customer => customer.id === x.id);
                                    }))
                                } else {
                                    const tempArray = [...ids];
                                    (dataCustomers?.crmGetCustomers?.customers || []).forEach(customer => {
                                        if (customer && !ids.some(item => item.id === customer.id)) {
                                            tempArray.push(customer);
                                        }
                                    })
                                    setIds(tempArray)
                                }
                            }}
                        />
                    </div>
                    <span>{formatMessage({ defaultMessage: 'ID' })}</span>
                </div>,
                dataIndex: 'id',
                key: 'id',
                width: 100,
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <div className='d-flex align-items-center'>
                        <div className='mr-2'>
                            <Checkbox
                                size="checkbox-md"
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
                            />
                        </div>
                        <span>{item}</span>
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Tên khách hàng' }),
                dataIndex: 'name',
                key: 'name',
                align: 'left',
                width: 200,
                render: (item, record) => {
                    return <EditableVertical
                        id={record?.id}
                        type={"name"}
                        text={item}
                        onConfirm={onUpdateCustomer}
                    />
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Kênh bán & Gian hàng' }),
                dataIndex: 'crmStore',
                key: 'crmStore',
                align: 'left',
                width: 300,
                render: (item, record) => {
                    const isExpand = expandsStore?.some(_id => _id?.id == record?.id);

                    if (item?.length > 0) {
                        if (item?.length == 1 && !item[0]?.store_id) {
                            const currentChannel = optionsChannelCode?.find(op => op?.value == item[0]?.connector_channel_code);
                            return <div className='d-flex align-items-center mr-4'>
                                <img
                                    style={{ width: 15, height: 15 }}
                                    src={currentChannel?.logo}
                                    className="mr-2"
                                />
                                <span>{currentChannel?.label}</span>
                            </div>
                        }

                        const stores = item?.filter(store => optionsStore?.some(st => st?.value == store?.store_id))

                        return <div className='d-flex align-items-center flex-wrap' style={{ gap: 10 }}>
                            {stores?.slice(0, isExpand ? stores?.length : 2)?.map((store, index) => {
                                const currentStore = optionsStore?.find(st => st?.value == store?.store_id);

                                if (!currentStore) return <span className='mr-4'>
                                    {formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}
                                </span>

                                return (
                                    <div className='d-flex align-items-center mr-4'>
                                        <img
                                            style={{ width: 15, height: 15 }}
                                            src={currentStore?.logo}
                                            className="mr-2"
                                        />
                                        <span>{currentStore?.label}</span>
                                    </div>
                                )
                            })}
                            {stores?.length > 2 && (
                                <span
                                    role="button"
                                    className='text-primary ml-2'
                                    onClick={() => {
                                        if (isExpand) {
                                            setExpandsStore(prev => prev.filter((_id) => _id.id != record.id));
                                        } else {
                                            setExpandsStore(prev => prev.concat([record]));
                                        }
                                    }}
                                >
                                    {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                                </span>
                            )}
                        </div>
                    }

                    return <span>{'--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Tên tài khoản' }),
                dataIndex: 'seller_username',
                key: 'seller_username',
                align: 'left',
                width: 200,
                render: (item, record) => {
                    return <div>{item || '--'}</div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Số điện thoại' }),
                dataIndex: 'phone',
                key: 'phone',
                align: 'left',
                width: 200,
                render: (item, record) => {
                    return <EditableVertical
                        id={record?.id}
                        type={"phone"}
                        text={item}
                        onConfirm={onUpdateCustomer}
                    />
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Địa chỉ' }),
                dataIndex: 'address',
                key: 'address',
                align: 'left',
                width: 220,
                render: (item, record) => {
                    return <ClampLines
                        text={item || '--'}
                        id="really-unique-id"
                        className='clamp-lines-upbase'                        
                        lines={2}
                        ellipsis="..."
                        moreText={formatMessage({ defaultMessage: "Xem thêm" })}
                        lessText={formatMessage({ defaultMessage: "Thu gọn" })}                        
                        innerElement="div"
                    />                    
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Email' }),
                dataIndex: 'email',
                key: 'email',
                align: 'left',
                width: 220,
                render: (item, record) => {
                    return <EditableVertical
                        id={record?.id}
                        type={"email"}
                        text={item}
                        onConfirm={onUpdateCustomer}
                    />
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Tag' }),
                dataIndex: 'crmTag',
                key: 'crmTag',
                align: 'center',
                width: 305,
                render: (item, record) => {
                    const isExpand = expands?.some(_id => _id?.id == record?.id);

                    if (item?.length > 0) {
                        return <div className='d-flex align-items-center justify-content-center flex-wrap' style={{ gap: 10 }}>
                            {item?.slice(0, isExpand ? item?.length : 2)?.map((tag, index) => (
                                <div className='upbase-tag' key={`upbase-tag-customer-${index}`}>
                                    <span className='mr-2' title={tag?.title}>
                                        {tag?.title?.length > 12 ? `${tag?.title?.slice(0, 12)}...` : tag?.title}
                                    </span>
                                    <span role='button' onClick={() => {
                                        onTagUpdate(tag?.id, record?.id, record?.crmTag);
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                        </svg>
                                    </span>
                                </div>
                            ))}
                            <div className='d-flex justify-content-center align-items-center'>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Thêm tag' })}
                                        </Tooltip>
                                    }
                                >
                                    <span
                                        role='button'
                                        onClick={() => {
                                            setCurrentIdCustomer(record?.id);
                                            setCurrentTag(record?.crmTag);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" color='#ff5629' width="16" height="16" fill="currentColor" class="bi bi-plus-square-fill" viewBox="0 0 16 16">
                                            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                                {item?.length > 2 && (
                                    <span
                                        role="button"
                                        className='text-primary ml-2'
                                        onClick={() => {
                                            if (isExpand) {
                                                setExpands(prev => prev.filter((_id) => _id.id != record.id));
                                            } else {
                                                setExpands(prev => prev.concat([record]));
                                            }
                                        }}
                                    >
                                        {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    } else {
                        return <div className='d-flex justify-content-center'>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Thêm tag' })}
                                    </Tooltip>
                                }
                            >
                                <span
                                    role='button'
                                    onClick={() => {
                                        setCurrentIdCustomer(record?.id);
                                        setCurrentTag([]);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" color='#ff5629' width="16" height="16" fill="currentColor" class="bi bi-plus-square-fill" viewBox="0 0 16 16">
                                        <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0" />
                                    </svg>
                                </span>
                            </OverlayTrigger>
                        </div>
                    }

                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Đơn hàng hiệu quả' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Tổng đơn hàng hiệu quả khách hàng đã đặt không bao gồm đơn hoàn và đơn huỷ' })}
                            </Tooltip>
                        }
                    >
                        <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                    </OverlayTrigger>
                </div>,
                dataIndex: 'count_order',
                key: 'count_order',
                align: 'center',
                width: 170,
                render: (item, record) => {
                    return <div>{formatNumberToCurrency(item)}</div>
                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Tổng tiền hiệu quả' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Tổng tiền hiệu quả tương ứng với khách hàng không bao gồm tiền hoàn và tiền huỷ' })}
                            </Tooltip>
                        }
                    >
                        <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                    </OverlayTrigger>
                </div>,
                dataIndex: 'total_paid',
                key: 'total_paid',
                align: 'right',
                width: 200,
                render: (item, record) => {
                    return <div>{formatNumberToCurrency(item)}đ</div>
                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Giao dịch gần nhất' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Thời gian khách hàng đặt hàng gần nhất' })}
                            </Tooltip>
                        }
                    >
                        <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                    </OverlayTrigger>
                </div>,
                dataIndex: 'last_order_at',
                key: 'last_order_at',
                align: 'center',
                width: 200,
                render: (item, record) => {
                    return <div>{!!item ? dayjs.unix(item).format('HH:mm DD/MM/YYYY') : '--'}</div>
                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Thời gian cập nhật khách hàng lên hệ thống' })}
                            </Tooltip>
                        }
                    >
                        <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                    </OverlayTrigger>
                </div>,
                dataIndex: 'updated_at',
                key: 'updated_at',
                align: 'center',
                width: 200,
                render: (item, record) => {
                    return <div>{!!item ? dayjs(item).format('HH:mm DD/MM/YYYY') : '--'}</div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Thao tác' }),
                dataIndex: 'id',
                key: 'id',
                width: 100,
                fixed: 'right',
                align: 'center',
                render: (item, record) => {
                    return <div className='d-flex justify-content-center align-items-center'>
                        <span
                            role='button'
                            onClick={() => window.open(`/customer-service/customer-info/${item}`, '_blank')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="mr-4 text-info bi bi-eye" viewBox="0 0 16 16">
                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" />
                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                            </svg>
                        </span>
                        <AuthorizationWrapper keys={['customer_service_customer_info_update']}>
                            <span
                                role='button'
                                onClick={() => setCurrentIdDelete(item)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="text-danger bi bi-trash" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                </svg>
                            </span>
                        </AuthorizationWrapper>
                    </div>
                }
            },
        ]
    }, [isSelectAll, dataCustomers?.crmGetCustomers?.customers, expands, ids, optionsStore, expandsStore, optionsChannelCode]);

    return (
        <Fragment>
            <LoadingDialog show={loadingCrmDeleteCustomer || loadingCrmSaveCustomerTags} />
            <ConfirmDialog
                show={!!currentIdDelete}
                title={formatMessage({ defaultMessage: 'Hệ thống sẽ xoá khách hàng này ra khỏi danh sách, bạn có đồng ý tiếp tục?' })}
                onConfirm={onDeleteCustomer}
                onHide={() => setCurrentIdDelete(null)}
            />
            {!!currentIdCustomer && <TagDialog
                show={!!currentIdCustomer}
                onHide={() => {
                    setCurrentIdCustomer(null);
                    setCurrentTag(null);
                }}
                dataTags={currentTag || []}
                list_customer_id={[Number(currentIdCustomer)]}
                optionsTags={optionsTags}
            />}
            <div style={{ position: 'relative' }}>
                {loadingCustomers && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingCustomers ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataCustomers?.crmGetCustomers?.customers || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có thông tin khách hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                    scroll={{ x: 'max-content' }}
                />
            </div>
            {dataCustomers?.crmGetCustomers?.customers?.length > 0 && (
                <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={dataCustomers?.crmGetCustomers?.customers?.length}
                        basePath={'/customer-service/customer-info'}
                        isShowEmpty={false}
                    />
                </div>
            )}
        </Fragment>
    )
};

export default memo(TableCustomerInfo);