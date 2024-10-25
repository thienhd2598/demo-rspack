import { useIntl } from 'react-intl';
import RcTable from 'rc-table';
import React, { useCallback, useMemo, useState } from 'react'
import Pagination from '../../../../components/Pagination';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications';
import dayjs from 'dayjs';
import queryString from "querystring";
import query_prvListProvider from '../../../../graphql/query_prvListProvider'
import { useQuery } from '@apollo/client';
import { useHistory, useLocation } from "react-router-dom";
import DialogConnect from './DialogConnect';
import clsx from 'clsx';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const TableThirdPartyConnection = () => {
    const { addToast } = useToasts()
    const { formatMessage } = useIntl()
    const history = useHistory()
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [dialogConnect, setDialogConnect] = useState({
        isOpen: false
    });

    const name = useMemo(() => {
        try {
            if (!params?.name) return {};

            return { name: params?.name }
        } catch (error) {
            return {}
        }
    }, [params?.name]);

    const list_category = useMemo(() => {
        try {
            let list_category = params?.list_category || null
            if (!list_category) {
                return {}
            }
            return { list_category: list_category?.split(',')?.map(cate => +cate) }
        } catch (error) {
            return {}
        }
    }, [params?.list_category]);

    const list_status = useMemo(() => {
        try {
            let list_status = params?.list_status || null
            if (!list_status) {
                return {}
            }
            return { list_status: list_status?.split(',')?.map(status => +status) }
        } catch (error) {
            return {}
        }
    }, [params?.list_status]);

    const variables = useMemo(() => {
        return {
            ...name,
            ...list_category,
            ...list_status,
        }
    }, [name, list_category, list_status]);

    const { loading, data, error, refetch } = useQuery(query_prvListProvider, {
        fetchPolicy: "cache-and-network",
        variables,
    });

    const thirdPartyConnectData = useMemo(() => {
        return data?.prvListProvider?.data?.map(item => {
            const status = !!item?.providerConnected?.[0]?.status ? 'CONNECTED' : 'LOST_CONNECTION'
            return {
                ...item,
                name: item?.name,
                statusConnect: item?.providerConnected?.length ? status : 'DISCONNECT',
                category: item?.category?.name,
                last_connected_at: item?.providerConnected[0]?.last_connected_at,
                link_webhook: item?.providerConnected[0]?.link_webhook,
                provider_name: item?.providerConnected[0]?.provider_name,
                logo: item?.logo,
                code: item?.code,
                id: item?.providerConnected[0]?.id,
                auth_type: item?.auth_type
            }
        })
    }, [data])
    console.log('thirdPartyConnectData', thirdPartyConnectData)
    const statusView = (status) => {
        switch (status) {
            case 'CONNECTED':
                return <span style={{ color: '#3DA153' }}>{formatMessage({ defaultMessage: "Đã kết nối" })}</span>
            case 'LOST_CONNECTION':
                return (
                    <div className="d-flex align-items-center justify-content-center">
                        <span style={{ color: '#FF0000' }}>{formatMessage({ defaultMessage: "Mất kết nối" })}</span>
                        <img style={{ cursor: 'pointer', marginLeft: '4px' }} src={toAbsoluteUrl("/media/warningsvg.svg")} alt=''></img>
                    </div>
                )
            default:
                return <span style={{ color: '#252525' }}>{formatMessage({ defaultMessage: "Chưa kết nối" })}</span>
        }
    }

    console.log({ thirdPartyConnectData });

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên nhà cung cấp' }),
            align: 'left',
            width: '30%',
            className: 'p-0',
            render: (record, item) => {
                return (
                    <div className='d-flex align-items-center '>
                        <span className='mx-2'>{item?.name}</span>
                        <span><img style={{ height: 40, width: 40, objectFit: 'contain' }} src={item?.logo} /></span>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái kết nối' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                        {statusView(item?.statusConnect)}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Danh mục' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                        {item?.category}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian kết nối' }),
            align: 'center',
            width: '20%',
            render: (record, item) => {
                return (
                    <div>
                        {item?.last_connected_at ? dayjs(item?.last_connected_at).format("HH:mm DD/MM/YYYY") : '--'}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            align: 'center',
            width: '10%',
            render: (record, item) => {
                return (
                    item?.category != "Enabler" && <AuthorizationWrapper keys={['setting_third_party_action']}>
                        <div style={{ color: '#FF0000', cursor: 'pointer' }}>
                            {item?.statusConnect == 'CONNECTED' ? item?.auth_type != 'oauth' ? '' :
                                <span
                                    onClick={() => {
                                        if (item?.system_code == 'hoadon30s') {
                                            history.push(`/setting/third-party-connection/config/${item?.id}`)
                                        } else {
                                            history.push(`/setting/third-party-connection/${item?.name}?system_code=${item?.system_code}&code=${item?.code}&id=${item?.id}&link_webhook=${item?.link_webhook}&provider_name=${item?.provider_name}`)
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Cài đặt' })}
                                </span> :
                                <span onClick={() => setDialogConnect({ isOpen: true, code: item?.code, name: item?.name, auth_type: item?.auth_type })}>{formatMessage({ defaultMessage: 'Kết nối' })}
                                </span>}
                        </div>
                    </AuthorizationWrapper>
                )
            }
        }
    ]

    const errorView = () => {
        return (
            <div
                className="w-100 text-center mt-8r"
                style={{ position: "absolute", zIndex: 100, left: '50%', transform: 'translateX(-50%)' }}
            >
                <div className="d-flex flex-column justify-content-center align-items-center">
                    <i
                        className="far fa-times-circle text-danger"
                        style={{ fontSize: 48, marginBottom: 8 }}
                    ></i>
                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                    <button
                        className="btn btn-primary btn-elevate"
                        style={{ width: 100 }}
                        onClick={(e) => {
                            e.preventDefault();
                            refetch();
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Tải lại' })}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            {!!error && !loading && errorView()}
            {dialogConnect.isOpen && <DialogConnect auth_type={dialogConnect?.auth_type} show={dialogConnect.isOpen} name={dialogConnect?.name} code={dialogConnect?.code} onHide={() => setDialogConnect({ isOpen: false })} />}
            <div style={{ flex: 1 }}>
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                    {[{ title: 'Tất cả', status: '' }, { title: 'Đã kết nối', status: 1 }].map((tab, index) => {
                        const isActive = list_status?.list_status
                            ? list_status?.list_status?.includes(tab?.status)
                            : !tab?.status;

                        return (
                            <li
                                key={`tab-setting-${index}`}
                                className={clsx(`nav-item cursor-pointer`, { active: isActive })}
                            >
                                <span className={clsx(`nav-link font-weight-normal`, { active: isActive })}
                                    style={{ fontSize: "13px" }}
                                    onClick={() => {
                                        history.push(`${location.pathname}?${queryString.stringify({
                                            ...params,
                                            list_status: tab?.status
                                        })}`);
                                    }}
                                >
                                    {tab?.title}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
            <div style={{ position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <RcTable
                    style={loading ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={thirdPartyConnectData || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Không có dữ liệu' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 43 }}
                />
            </div>

        </div>
    )
}

export default TableThirdPartyConnection