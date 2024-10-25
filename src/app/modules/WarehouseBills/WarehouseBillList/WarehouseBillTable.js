import React, { memo, useMemo, useCallback, Fragment, useState } from 'react';
import { useMutation, useQuery } from "@apollo/client";
import Pagination from '../../../../components/Pagination';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import WarehouseBillRow from './WarehouseBillRow';
import { Modal } from 'react-bootstrap';
import { useToasts } from 'react-toast-notifications';
import query_warehouse_bills from '../../../../graphql/query_warehouse_bills';
import { TAB_STATUS_IN, TAB_STATUS_OUT } from '../WarehouseBillsUIHelper';
import WarehouseBillCount from './WarehouseBillCount';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import client from '../../../../apollo';

const queryRelateBills = async (ids) => {
    if (!ids?.length) return [];
    
    const { data } = await client.query({
        query: query_warehouse_bills,
        variables: {
            limits: ids?.length,
            where: {
                id: {_in: ids}
            }
        },
        fetchPolicy: "network-only",
    });

    return data?.warehouse_bills || []
}

const WarehouseBillTable = ({ whereCondition, onDelete, onPrint, onConfirm, type, onCancel }) => {
    const { formatMessage } = useIntl();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const history = useHistory();
    const { addToast } = useToasts();
    const [relateBill, setRelateBill] = useState([]);

    const page = useMemo(
        () => {
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
        }, [params.page]
    );

    const limit = useMemo(
        () => {
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
        }, [params.limit]
    );

    const difCondition = useMemo(() => {
        if(params?.status == 'DIF_AFTER_IMPORT') {
            return {
                status: {
                    _eq: 'complete'
                },
                _or: [
                    { state: {_eq: 2}},
                    { state: {_eq: 3}}
                 ]
            }
        }
        return {}
    }, [params?.status])

    const { data, loading, error, refetch } = useQuery(query_warehouse_bills, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            where: {
                ...whereCondition,
                ...difCondition
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    useMemo(async () => {
        if (!data?.warehouse_bills?.some(item =>item?.related_warehouse_bill_id)) return []
        const ids = data?.warehouse_bills?.filter(item => item?.related_warehouse_bill_id)?.map(item => item?.related_warehouse_bill_id)
        const dataRelateBills = await queryRelateBills(ids)
        setRelateBill(dataRelateBills)
    }, [data?.warehouse_bills])

    let totalRecord = data?.warehouse_bills_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    return (
        <div
            style={{
                borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
                minHeight: 300
            }}
        >
            <div className='d-flex w-100 mt-8' style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                <div style={{ flex: 1 }} >
                    <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                        {
                            (type == 'out' ? TAB_STATUS_OUT : TAB_STATUS_IN).map((_tab, index) => {
                                const { title, status } = _tab;
                                const isActive = status == (params?.status || 'new')
                                return (
                                    <li
                                        key={`tab-order-${index}`}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                            style={{ fontSize: '13px' }}
                                            onClick={() => {
                                                history.push(`/products/warehouse-bill/list?${queryString.stringify({
                                                    ...params,
                                                    page: 1,
                                                    status: status
                                                })}`)
                                            }}
                                        >
                                            {status != 'DIF_AFTER_IMPORT' ? <><span>{title}</span> (<WarehouseBillCount
                                                whereCondition={
                                                    _.omit({
                                                        ...whereCondition,
                                                        status: {
                                                            _eq: status
                                                        }
                                                    })
                                                }
                                            />)
                                            </> : <div className="d-flex align-items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill mr-2" viewBox="0 0 16 16">
                                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                            </svg>
                                            <span>{title}</span>
                                            <span className="ml-1">
                                                ({<WarehouseBillCount
                                                whereCondition={
                                                    _.omit({
                                                        ...whereCondition,
                                                        status: {
                                                            _eq: 'complete'
                                                        },
                                                        _or: [
                                                           { state: {_eq: 2}},
                                                           { state: {_eq: 3}}
                                                        ]
                                                    })
                                                }
                                                />})
                                            </span>
                                            </div>}
                                        </a>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </div>

            <div
                style={{
                    borderRadius: 6,
                    minHeight: 220,

                }}
            >
                <table className="table table-borderless product-list table-vertical-center fixed">
                    <thead
                        style={{
                            position: 'sticky', top: 82, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1,
                            borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9'
                        }}
                    >
                        <tr className="font-size-lg" style={{ zIndex: 1, borderRadius: 6 }}>
                            <th style={{ fontSize: '14px' }} width="20%">
                                {formatMessage({ defaultMessage: 'Mã phiếu' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="15%">
                                {formatMessage({ defaultMessage: 'Số lượng' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="17%">
                                {formatMessage({ defaultMessage: 'Kho' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="12%">
                                {formatMessage({ defaultMessage: 'Hình thức' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="15%">
                                {formatMessage({ defaultMessage: 'Thời gian' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="15%">
                                {formatMessage({ defaultMessage: 'Người tạo' })}
                            </th>
                            <th style={{ fontSize: '14px' }} width="12%">
                                {formatMessage({ defaultMessage: 'Thao tác' })}
                            </th>
                        </tr>
                    </thead>
                    <tbody style={{ borderRight: "1px solid #D9D9D9", borderLeft: "1px solid #D9D9D9" }}>
                        {loading && <div className='text-center w-100 mt-12' style={{ position: 'absolute' }} >
                            <span className="spinner spinner-primary"></span>
                        </div>
                        }
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">
                                        {formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}
                                    </p>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 100 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            refetch();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {
                            !error && !loading && data?.warehouse_bills?.map(_wareHouseBill => {
                                return <WarehouseBillRow
                                    key={`warehouse-bill-${_wareHouseBill.id}`}
                                    wareHouseBill={_wareHouseBill}
                                    onDelete={onDelete}
                                    onConfirm={onConfirm}
                                    onCancel={onCancel}
                                    onPrint={onPrint}
                                    stores={data?.sc_stores}
                                    channels={data?.op_connector_channels}
                                    relateBill={relateBill}
                                />
                            })
                        }
                    </tbody>
                </table>
                {!error && !loading && (
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={data?.warehouse_bills?.length}
                        basePath={'/products/warehouse-bill/list'}
                        emptyTitle={params?.type == 'out' ? formatMessage({ defaultMessage: 'Chưa có phiếu xuất kho' }) : formatMessage({ defaultMessage: 'Chưa có phiếu nhập kho' })}
                    />
                )}
            </div>
        </div>
    )
};

export default memo(WarehouseBillTable);