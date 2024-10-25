import { useQuery } from "@apollo/client";
import { sum } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import { useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import InfoProduct from '../../../../../components/InfoProduct';
import Pagination from '../../../../../components/PaginationModal';
import query_sme_catalog_product_variant from '../../../../../graphql/query_sme_catalog_product_variant';
import { formatNumberToCurrency } from '../../../../../utils';
import ModalCombo from "../../../Products/products-list/dialog/ModalCombo";
import query_crmGetCustomers from "../../../../../graphql/query_crmGetCustomers";
import ClampLines from "react-clamp-lines";
import { useOrderManualContext } from "../OrderManualContext";
import query_crmGetChannelCode from "../../../../../graphql/query_crmGetChannelCode";

const ModalCustomer = ({
    show,
    onHide,
    onSelectCustomer,
}) => {
    const { formatMessage } = useIntl();
    const { optionsStore } = useOrderManualContext();
    const [expandsStore, setExpandsStore] = useState([]);
    const [customerSelected, setCustomerSelected] = useState(null);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        page: 1,
        limit: 10,
    });

    const { data: dataCrmGetChannelCode } = useQuery(query_crmGetChannelCode, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingCustomers, data: dataCustomers } = useQuery(query_crmGetCustomers, {
        fetchPolicy: "cache-and-network",
        variables: {
            page: search.page,
            per_page: search.limit,
            search: {
                ...(!!search.searchText ? {
                    q: search.searchText
                } : {})
            }
        }
    });

    const totalRecord = dataCustomers?.crmGetCustomers?.total || 0;
    const totalPage = Math.ceil(totalRecord / search.limit);

    const resetData = useCallback(() => {
        setSearch({
            searchText: null,
            searchType: '',
            page: 1,
            limit: 10,
        })
        setCustomerSelected(null);
        onHide();
    }, []);

    const optionsChannelCode = useMemo(() => {
        return dataCrmGetChannelCode?.crmGetChannelCode?.map(channel => ({
            value: channel?.key,
            label: channel?.name,
            logo: channel?.url_logo
        }));
    }, [dataCrmGetChannelCode]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
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
                            isSelected={customerSelected?.id == record?.id}
                            onChange={e => {
                                if (customerSelected?.id == record?.id) {
                                    setCustomerSelected(null)
                                } else {
                                    setCustomerSelected(record)
                                }
                            }}
                        />
                    </div>
                    <span>{item}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tên người mua' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: 150,
            render: (item, record) => {
                return <span>{item || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Kênh bán & Gian hàng' }),
            dataIndex: 'crmStore',
            key: 'crmStore',
            align: 'left',
            width: 200,
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
            width: 150,
            render: (item, record) => {
                return <div>{item || '--'}</div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số điện thoại' }),
            dataIndex: 'phone',
            key: 'phone',
            align: 'left',
            width: 150,
            render: (item, record) => {
                return <span>{item || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Email' }),
            dataIndex: 'email',
            key: 'email',
            align: 'left',
            width: 150,
            render: (item, record) => {
                return <span>{item || ''}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Địa chỉ' }),
            dataIndex: 'address',
            key: 'address',
            align: 'left',
            width: 200,
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
    ];

    console.log({ customerSelected })

    return (
        <Fragment>
            <Modal
                size="xl"
                show={show}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Chọn thông tin người mua' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className='row mb-4'>
                        <div className="col-6 input-icon" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tìm kiếm tên khách hàng, tài khoản, sđt, …" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    setSearch({ ...search, searchText: e.target.value, page: 1 })
                                }}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        setSearch({ ...search, searchText: e.target.value, page: 1 })
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                    </div>
                    <div>
                        <div style={{ position: 'relative' }}>
                            {loadingCustomers && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}
                            <Table
                                style={loadingCustomers ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={dataCustomers?.crmGetCustomers?.customers || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có thông tin người mua' })}</span>
                                </div>}
                                tableLayout="auto"
                                scroll={{ y: 350, offsetHeader: 45 }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                        {dataCustomers?.crmGetCustomers?.customers?.length > 0 && (
                            <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                                <Pagination
                                    page={search.page}
                                    totalPage={totalPage}
                                    loading={loadingCustomers}
                                    isAddOrder={true}
                                    quickAdd={true}
                                    limit={search.limit}
                                    totalRecord={totalRecord}
                                    count={dataCustomers?.crmGetCustomers?.customers?.length}
                                    onPanigate={(page) => setSearch({ ...search, page: page })}
                                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có thông tin người mua' })}
                                />
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={resetData}
                            className="btn btn-secondary mr-4"
                            style={{ width: 120 }}
                        >
                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                        </button>
                        <button
                            type="button"
                            className={`btn ${!customerSelected ? 'btn-darkk' : 'btn-primary'}`}
                            disabled={!customerSelected}
                            style={{ width: 120, cursor: !customerSelected ? 'not-allowed' : 'pointer' }}
                            onClick={() => {
                                onSelectCustomer(customerSelected)
                                resetData();
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Xác nhận' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
};

export default memo(ModalCustomer);