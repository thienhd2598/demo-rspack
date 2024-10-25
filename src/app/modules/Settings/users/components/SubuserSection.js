import dayjs from 'dayjs';
import _ from 'lodash';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useIntl, FormattedMessage } from 'react-intl';
import Select from 'react-select';
import { useHistory } from 'react-router-dom';
import { CardBody } from '../../../../../_metronic/_partials/controls';
import Pagination from '../../../../../components/Pagination';
import { useQuery } from '@apollo/client';
import query_userGetSubUsers from '../../../../../graphql/query_userGetSubUsers';
import query_userGetRoles from '../../../../../graphql/query_userGetRoles';
import query_sc_stores_basics from '../../../../../graphql/query_sc_stores_basic'
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores'
import {OverlayTrigger, Popover, Tooltip} from 'react-bootstrap';
import clsx from 'clsx';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';


const SubuserSection = ({ page, limit, setCurrentSubUserDelete }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [searchText, setSearchText] = useState(null);
    const [searchType, setSearchType] = useState('username');

    const SEARCH_OPTIONS = [
        { value: 'username', label: formatMessage({ defaultMessage: 'Tên tài khoản' }), placeholder: formatMessage({ defaultMessage: 'Nhập tên tài khoản' }) },
        { value: 'name', label: formatMessage({ defaultMessage: 'Tên người dùng' }), placeholder: formatMessage({ defaultMessage: 'Nhập tên người dùng' }) },
    ];

    const { data: dataRoles, loading: loadingRoles } = useQuery(query_userGetRoles, {
        variables: {
            pageSize: 100,
            page: 1,
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStores, loading: loadingStores } = useQuery(query_sc_stores_basics, {
        variables: {
            context: 'order',
            context_channel: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataWarehouses, loading: loadingWarehouses } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data, loading, error: errorSubUser, refetch } = useQuery(query_userGetSubUsers, {
        variables: {
            page,
            pageSize: limit,
            searchText: searchText || '',
            searchType: searchType == 'username' ? 1 : 0            
        },
        fetchPolicy: 'cache-and-network'
    });

    console.log({ dataRoles, data });

    const renderRole = useCallback((rolesSubUser) => {
        if (!dataRoles || dataRoles?.userGetRoles?.items?.length == 0) return [];
        const mappedRoles = dataRoles?.userGetRoles?.items
            ?.filter(_role => rolesSubUser?.includes(_role?.code))
            ?.map(_role => _role?.name);
        
        return mappedRoles.map(item => <span>{item}</span>)
    }, [dataRoles]);

    const stores = useCallback((storeIds) => {
        if (!dataStores || dataStores?.sc_stores?.length == 0) return [];
        const mappedStores = dataStores?.sc_stores
            ?.filter(store => storeIds?.includes(store?.id))
            ?.map(store => {
                const channel = dataStores?.op_connector_channels?.find(cn => cn?.code == store?.connector_channel_code)
                return {
                    ...store, 
                    logoChannel: channel?.logo_asset_url
                }
            })
        
        return mappedStores
    }, [dataStores]);

    const warehouses = useCallback((warehouseIds) => {
        if (!dataWarehouses || dataWarehouses?.sme_warehouses?.length == 0) return [];
        const mappedWh = dataWarehouses?.sme_warehouses
            ?.filter(wh => warehouseIds?.includes(wh?.id))
        return mappedWh
    }, [dataWarehouses]);

    return (
        <CardBody>
            <div className="row mb-8 d-flex align-items-center">
                <div className="col-2 pr-0 d-flex align-items-center">
                    <Select
                        className='w-100 custom-select-warehouse'
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: '#ff5629'
                            }
                        })}
                        isLoading={false}
                        value={
                            _.find(_.omit(SEARCH_OPTIONS, ['placeholder']), _option => _option?.value == searchType)
                            || _.omit(SEARCH_OPTIONS[0], ['placeholder'])
                        }
                        defaultValue={_.omit(SEARCH_OPTIONS[0], ['placeholder'])}
                        options={_.map(SEARCH_OPTIONS, _option => _.omit(_option, ['placeholder']))}
                        onChange={value => {
                            setSearchType(value.value)
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>
                        }}
                    />
                </div>
                <div className="col-5 input-icon pl-0" style={{ height: 'fit-content' }} >
                    <input
                        type="text"
                        className="form-control"
                        style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onBlur={(e) => {
                            setSearchText(e.target.value)
                        }}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                setSearchText(e.target.value)
                            }
                        }}
                        placeholder={_.find(SEARCH_OPTIONS, _option => _option.value == searchType)?.placeholder || SEARCH_OPTIONS[0].placeholder}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6 mr-6"></i></span>
                </div>
                <div className="col-5">
                    <button
                        className="float-right btn btn-primary"
                        onClick={() => history.push('/setting/users/create-sub-user')}
                    >
                        {formatMessage({ defaultMessage: 'Thêm tài khoản phụ' })}
                    </button>
                </div>
            </div>

            <div style={{
                boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                borderRadius: 6, minHeight: 220
            }} >
                <table className="table product-list table-borderless table-vertical-center fixed">
                    <thead style={{
                        borderBottom: '1px solid #F0F0F0',
                        borderRight: '1px solid #d9d9d9',
                        borderLeft: '1px solid #d9d9d9',
                        background: "#F3F6F9",
                        fontWeight: "bold",
                        fontSize: "14px",
                    }}>
                        <tr className="text-left" >
                            <th style={{ fontSize: '14px' }} width='10%'>
                                <span>{formatMessage({ defaultMessage: 'Tên tài khoản' })}</span>
                            </th>
                            <th style={{ fontSize: '14px' }} width='20%'>
                                <span>{formatMessage({ defaultMessage: 'Tên người dùng' })}</span>
                            </th>
                            <th style={{ fontSize: '14px' }} width='20%'>
                                <span>{formatMessage({ defaultMessage: 'Nhóm quyền' })}</span>
                            </th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width='10%'>
                                <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                            </th>
                            <th style={{ fontSize: '14px', textAlign: 'center' }} width='10%'>
                                <span>{formatMessage({ defaultMessage: 'Kho hàng' })}</span>
                            </th>
                            <th style={{ fontSize: '14px' }} width='20%'>
                                <span>{formatMessage({ defaultMessage: 'Thời gian' })}</span>
                            </th>
                            <th style={{ fontSize: '14px' }} className='text-center' width='10%'>
                                <span>{formatMessage({ defaultMessage: 'Thao tác' })}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading || loadingStores || loadingWarehouses && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>}
                        {!!errorSubUser && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
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
                            !errorSubUser && !loading && !loadingStores && !loadingWarehouses && data?.userGetSubUsers?.items?.map(subUser => {
                                const storeList = stores(subUser?.stores)
                                const warehouseList = warehouses(subUser?.warehouses)
                                return (
                                    <tr key={`sub-user-${subUser?.id}`} style={{ borderBottom: '1px solid #D9D9D9' }}>
                                        <td>
                                            <span>{subUser?.username}</span>
                                        </td>
                                        <td>
                                            <span>{subUser?.name}</span>
                                        </td>
                                        <td>
                                            <div className='d-flex flex-column' style={{ gap: 6 }}>
                                                {renderRole(subUser?.roles?.map(item => item?.code))}
                                            </div>
                                        </td>
                                        <td>
                                            {subUser?.stores?.length == 1 && subUser?.stores[0] == -1 ? <div className='text-center'>{formatMessage({defaultMessage: 'Tất cả'})}</div> : 
                                                <div className='text-center'>
                                                    <OverlayTrigger
                                                        className='cursor-pointer'
                                                        rootClose
                                                        trigger="click"
                                                        placement="bottom"
                                                        overlay={<Popover className='mt-2' style={{ minWidth: 250 }}>
                                                            <Popover.Content>
                                                                {!!storeList?.length && storeList?.map((store, idx) => {
                                                                    // const isErrStore = !storeList?.some(st => st?.id == store?.id)
                                                                    return (
                                                                        <div className="d-flex flex-column">
                                                                            <div className={clsx('d-flex justify-content-between align-items-center', storeList?.length - 1 != idx && 'mb-4')}>
                                                                                <div className='d-flex align-items-center'>
                                                                                    <img
                                                                                        src={toAbsoluteUrl(`/media/logo_${store?.connector_channel_code}.png`)}
                                                                                        style={{ width: 20, height: 20, objectFit: "contain" }}
                                                                                    />
                                                                                    <span className='fs-14 ml-2'>{store?.name}</span>
                                                                                    {store?.status == 2 && <span className='ml-2' style={{ position: 'relative', top: -3 }}>
                                                                                        <OverlayTrigger
                                                                                            overlay={
                                                                                                <Tooltip>
                                                                                                    <FormattedMessage defaultMessage="Gian hàng đã bị ngắt kết nối" />
                                                                                                </Tooltip>
                                                                                            }
                                                                                        >
                                                                                            <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} />
                                                                                        </OverlayTrigger>
                                                                                    </span>}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {loadingStores && <div className='d-flex justify-content-center align-items-center my-4'>
                                                                    <span className="spinner spinner-primary" style={{ position: 'relative', right: 10 }} />
                                                                </div>}
                                                            </Popover.Content>
                                                        </Popover>}
                                                    >
                                                        <span className='cursor-pointer text-primary'>
                                                            {formatMessage({ defaultMessage: '{count} gian hàng' }, { count: storeList?.length })}
                                                        </span>
                                                    </OverlayTrigger>
                                                </div>    
                                            }
                                        </td>
                                        <td>
                                            {subUser?.warehouses?.length == 1 && subUser?.warehouses[0] == -1 ? <div className='text-center'>{formatMessage({defaultMessage: 'Tất cả'})}</div> : 
                                                <div className='text-center'>
                                                    <OverlayTrigger
                                                        className='cursor-pointer'
                                                        rootClose
                                                        trigger="click"
                                                        placement="bottom"
                                                        overlay={<Popover className='mt-2' style={{ minWidth: 250 }}>
                                                            <Popover.Content>
                                                                {!!warehouseList?.length && warehouseList?.map((warehouse, idx) => {
                                                                    // const isErrStore = !storeList?.some(st => st?.id == store?.id)
                                                                    return (
                                                                        <div className="d-flex flex-column">
                                                                            <div className={clsx('d-flex justify-content-between align-items-center', warehouseList?.length - 1 != idx && 'mb-4')}>
                                                                                <div className='d-flex align-items-center'>
                                                                                    <span className='fs-14 ml-2'>{warehouse?.name}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {loadingWarehouses && <div className='d-flex justify-content-center align-items-center my-4'>
                                                                    <span className="spinner spinner-primary" style={{ position: 'relative', right: 10 }} />
                                                                </div>}
                                                            </Popover.Content>
                                                        </Popover>}
                                                    >
                                                        <span className='cursor-pointer text-primary'>
                                                            {formatMessage({ defaultMessage: '{count} kho hàng' }, { count: warehouseList?.length })}
                                                        </span>
                                                    </OverlayTrigger>
                                                </div>    
                                            }
                                        </td>
                                        <td>
                                            <div className="d-flex flex-column mb-4">
                                                <span className="mb-1">{formatMessage({ defaultMessage: 'Thời gian tạo' })}:</span>
                                                {dayjs.unix(subUser.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                            <div className="d-flex flex-column">
                                                <span className="mb-1">{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}:</span>
                                                {dayjs.unix(subUser.updatedAt).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                        </td>
                                        <td className='text-center'>
                                            <Dropdown drop='down' >
                                                <Dropdown.Toggle className='btn-outline-secondary' >
                                                    {formatMessage({ defaultMessage: 'Chọn' })}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    {subUser?.provider !='agency' &&<Dropdown.Item
                                                        className="mb-1 d-flex"
                                                        onClick={async e => {
                                                            e.preventDefault();

                                                            history.push({
                                                                pathname: '/setting/users/change-password-sub-user',
                                                                state: {
                                                                    sub_user: subUser
                                                                }
                                                            })
                                                        }}>
                                                        {formatMessage({ defaultMessage: 'Đổi mật khẩu' })}
                                                    </Dropdown.Item>}
                                                    <Dropdown.Item
                                                        className="mb-1 d-flex"
                                                        onClick={async e => {
                                                            e.preventDefault();

                                                            history.push({
                                                                pathname: '/setting/users/update-sub-user',
                                                                state: {
                                                                    sub_user: subUser
                                                                }
                                                            })
                                                        }}>
                                                        {formatMessage({ defaultMessage: 'Cập nhật thông tin' })}
                                                    </Dropdown.Item>
                                                    {subUser?.provider !='agency' && <Dropdown.Item
                                                        className="mb-1 d-flex"
                                                        onClick={async e => {
                                                            e.preventDefault();

                                                            setCurrentSubUserDelete({
                                                                id: subUser?.id,
                                                                username: subUser?.username
                                                            });
                                                        }}>
                                                        {formatMessage({ defaultMessage: 'Xóa' })}
                                                    </Dropdown.Item>}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
                {!errorSubUser && !loading && (
                    <Pagination
                        page={page}
                        loading={loading}
                        limit={limit}
                        totalPage={data?.userGetSubUsers?.pagination?.totalPage}
                        totalRecord={data?.userGetSubUsers?.pagination?.total}
                        count={data?.userGetSubUsers?.items?.length}
                        basePath={`/setting/users`}
                        emptyTitle={formatMessage({ defaultMessage: `Chưa có tài khoản phụ` })}
                    />
                )}
            </div>
        </CardBody>
    )
}

export default memo(SubuserSection);