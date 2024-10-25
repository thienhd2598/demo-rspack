import React, { Fragment, useMemo, useState, memo, useCallback } from 'react'
import { useIntl } from 'react-intl';
import { useHistory, useParams } from "react-router-dom";
import Table from 'rc-table';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_crmRecipientAddressByCustomer from '../../../../../graphql/query_crmRecipientAddressByCustomer';
import PaginationModal from '../../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import EditableVertical from './EditableVertical';
import { useMutation, useQuery } from '@apollo/client';
import mutate_crmUpdateCustomerRecipientAddress from '../../../../../graphql/mutate_crmUpdateCustomerRecipientAddress';
import AddressDialog from '../dialogs/AddressDialog';

const DetailCustomerReceive = ({ optionsProvince, optionsDistrict }) => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [currentData, setCurrentData] = useState(null);
    const history = useHistory();

    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);

    const { loading: loadingRecipientAddressByCustomer, data: dataRecipientAddressByCustomer } = useQuery(query_crmRecipientAddressByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            crm_customer_id: Number(params?.id),
            first: Number(limit),
            page,
        }
    });
    console.log('dataRecipientAddressByCustomer', dataRecipientAddressByCustomer)
    const [crmUpdateCustomerRecipientAddress, { loading: loadingCrmUpdateCustomerRecipientAddress }] = useMutation(mutate_crmUpdateCustomerRecipientAddress, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmRecipientAddressByCustomer']
    });

    const onUpdateCustomer = useCallback(async (body, callback, type) => {
        try {
            const mss = {
                ['name']: formatMessage({ defaultMessage: 'tên người nhận' }),
                ['phone']: formatMessage({ defaultMessage: 'số điện thoại' }),
            };

            const { data } = await crmUpdateCustomerRecipientAddress({
                variables: body
            });

            callback();
            if (!!data?.crmUpdateCustomerRecipientAddress?.success) {
                addToast(formatMessage({ defaultMessage: 'Cập nhật {mss} thành công' }, { mss: mss[type] }), { appearance: "success" });
            } else {
                addToast(data?.crmUpdateCustomerRecipientAddress?.message || formatMessage({ defaultMessage: 'Cập nhật {mss} thất bại' }, { mss: mss[type] }), { appearance: "error" });
            }
        } catch (error) {
            callback();
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
        }
    }, []);

    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Tên người nhận' }),
                dataIndex: 'name',
                key: 'name',
                width: '20%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <EditableVertical
                        type="name"
                        text={item}
                        id={record?.id}
                        onConfirm={onUpdateCustomer}
                    />
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Số điện thoại' }),
                dataIndex: 'phone',
                key: 'phone',
                width: '20%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <EditableVertical
                        type={"phone"}
                        id={record?.id}
                        text={item}
                        onConfirm={onUpdateCustomer}
                    />
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Tỉnh/Thành phố' }),
                dataIndex: 'province_code',
                key: 'province_code',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    const province = optionsProvince?.find(pr => pr?.value == item)?.label;
                    return <span>{province || '--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Quận/Huyện' }),
                dataIndex: 'district_code',
                key: 'district_code',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    const district = optionsDistrict[record?.province_code]?.find(dt => dt?.value == item)?.label;
                    return <span>{district || '--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Phường/Xã' }),
                dataIndex: 'district_code',
                key: 'district_code',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{record?.wards_name || '--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Địa chỉ đầy đủ' }),
                dataIndex: 'address',
                key: 'address',
                width: '30%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <div className='d-flex algin-items-center'>
                        <span>{item || '--'}</span>
                        <i
                            role="button"
                            className="ml-2 text-dark far fa-edit"
                            onClick={() => setCurrentData(record)}
                        />
                    </div>
                }
            },
        ]
    }, [optionsProvince, optionsDistrict]);

    return (
        <Fragment>
            <AddressDialog
                show={!!currentData}
                onHide={() => setCurrentData(null)}
                id={currentData?.id}
                data={currentData}
                type="recipient"
                optionsProvince={optionsProvince}
                optionsDistrict={optionsDistrict}
            />
            <div style={{ position: 'relative' }}>
                {loadingRecipientAddressByCustomer && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingRecipientAddressByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataRecipientAddressByCustomer?.crmRecipientAddressByCustomer?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có thông tin nhận hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataRecipientAddressByCustomer?.crmRecipientAddressByCustomer?.paginatorInfo?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onPanigate={(page) => setPage(page)}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    totalPage={Math.ceil(dataRecipientAddressByCustomer?.crmRecipientAddressByCustomer?.paginatorInfo?.total / limit)}
                    totalRecord={dataRecipientAddressByCustomer?.crmRecipientAddressByCustomer?.paginatorInfo?.total || 0}
                    count={dataRecipientAddressByCustomer?.crmRecipientAddressByCustomer?.data?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                />
            )}
        </Fragment>
    )
};

export default memo(DetailCustomerReceive);