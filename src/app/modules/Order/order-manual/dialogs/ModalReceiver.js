import { useQuery } from "@apollo/client";
import { sum } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import Pagination from '../../../../../components/PaginationModal';
import ClampLines from "react-clamp-lines";
import { useOrderManualContext } from "../OrderManualContext";
import query_crmSearchRecipientAddressByCustomer from "../../../../../graphql/query_crmSearchRecipientAddressByCustomer";

const ModalReceiver = ({
    show,
    onHide,
    idCustomer,
    onSelectReceiver,
}) => {
    const { formatMessage } = useIntl();
    const { optionsProvince, optionsDistrict } = useOrderManualContext();
    const [customerSelected, setCustomerSelected] = useState(null);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        page: 1,
        limit: 10,
    });

    const { loading: loadingRecipientAddressByCustomer, data: dataRecipientAddressByCustomer } = useQuery(query_crmSearchRecipientAddressByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            search: {
                q: search?.searchText,
                crm_customer_id: Number(idCustomer),
            },
            per_page: Number(search.limit),
            page: search.page,
        }
    });
    
    const totalRecord = Math.ceil(dataRecipientAddressByCustomer?.crmSearchRecipientAddressByCustomer?.total || 0);
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

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên người nhận' }),
            dataIndex: 'name',
            key: 'name',
            width: '20%',
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
                    <span>{item || '--'}</span>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số điện thoại' }),
            dataIndex: 'phone',
            key: 'phone',
            width: '15%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                return <span>{item || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tỉnh/Thành phố' }),
            dataIndex: 'province_code',
            key: 'province_code',
            width: '15%',
            fixed: 'left',
            align: 'left',
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
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                const district = optionsDistrict[record?.province_code]?.find(dt => dt?.value == item)?.label;
                return <span>{district || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Phường/Xã' }),
            dataIndex: 'wards_name',
            key: 'wards_name',
            width: '15%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                return <span>{record?.wards_name || '--'}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Địa chỉ đầy đủ' }),
            dataIndex: 'address',
            key: 'address',
            width: '20%',
            fixed: 'left',
            align: 'left',
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
                        {formatMessage({ defaultMessage: 'Chọn thông tin người nhận' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className='row mb-4'>
                        <div className="col-6 input-icon" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tìm kiếm tên khách hàng, sđt, …" })}
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
                            {loadingRecipientAddressByCustomer && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}
                            <Table
                                style={loadingRecipientAddressByCustomer ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={dataRecipientAddressByCustomer?.crmSearchRecipientAddressByCustomer?.customer_address || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>
                                        {!!idCustomer ? formatMessage({ defaultMessage: 'Chưa có thông tin người nhận' }) : formatMessage({ defaultMessage: 'Chưa có dữ liệu. Vui lòng chọn thông tin người mua' })}
                                    </span>
                                </div>}
                                tableLayout="auto"
                                scroll={{ y: 350 }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                        {dataRecipientAddressByCustomer?.crmSearchRecipientAddressByCustomer?.total > 0 && (
                            <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                                <Pagination
                                    page={search.page}
                                    totalPage={totalPage}
                                    loading={loadingRecipientAddressByCustomer}
                                    isAddOrder={true}
                                    quickAdd={true}
                                    limit={search.limit}
                                    totalRecord={totalRecord}
                                    count={dataRecipientAddressByCustomer?.crmSearchRecipientAddressByCustomer?.customer_address?.length}
                                    onPanigate={(page) => setSearch({ ...search, page: page })}                                    
                                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có thông tin người nhận' })}
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
                            className={`btn ${(!customerSelected || !idCustomer) ? 'btn-darkk' : 'btn-primary'}`}
                            disabled={!customerSelected || !idCustomer}
                            style={{ width: 120, cursor: (!customerSelected || !idCustomer) ? 'not-allowed' : 'pointer' }}
                            onClick={() => {
                                onSelectReceiver(customerSelected);
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

export default memo(ModalReceiver);