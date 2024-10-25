import React, { memo, useCallback, useState } from "react";
import ModalConfirm from "../../../FrameImage/dialogs/ModalConfirm";
import { useIntl } from "react-intl";
import { useHistory } from 'react-router-dom';
import { CardBody } from "../../../../../_metronic/_partials/controls";
import Table from "rc-table";
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Dropdown } from "react-bootstrap";
import dayjs from "dayjs";
import query_userGetRoles from "../../../../../graphql/query_userGetRoles";
import { useMutation, useQuery } from "@apollo/client";
import Pagination from "../../../../../components/Pagination";
import mutate_userDeleteRole from "../../../../../graphql/mutate_userDeleteRole";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../../FrameImage/LoadingDialog";

const PermissionSection = ({ page, limit }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [searchText, setSearchText] = useState(null);
    const [currentIdDelete, setCurrentIdDelete]  = useState(null);
    const { addToast } = useToasts();

    const { data, loading } = useQuery(query_userGetRoles, {
        variables: {         
            pageSize: limit,
            page,
            searchText: searchText || '',
        },
        fetchPolicy: 'cache-and-network'
    });

    const [deleteUserRole, { loading: loadingDeleteRole }] = useMutation(mutate_userDeleteRole, {
        awaitRefetchQueries: true,
        refetchQueries: ['userGetRoles']
    });    

    const onDeleteUserRole = useCallback(async (id) => {
        try {
            const { data } = await deleteUserRole({
                variables: { id }
            });

            if (data?.userDeleteRole?.success) {
                addToast(formatMessage({ defaultMessage: 'Xóa nhóm quyền thành công' }), { appearance: 'success' });
            } else {
                addToast(data?.userDeleteRole?.message || formatMessage({ defaultMessage: 'Xóa nhóm quyền thất bại' }), { appearance: 'error' });
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' });
        }
    }, []);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên nhóm phân quyền' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (item, record) => {
                return <span>{item}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Mô tả' }),
            dataIndex: 'description',
            key: 'description',
            align: 'left',
            width: '35%',
            render: (item, record) => {
                return item
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian' }),
            dataIndex: 'id',
            key: 'id',
            align: 'left',
            width: '20%',
            render: (item, record) => {
                console.log(record)
                return (
                    <div className="d-flex flex-column">
                        <div className="d-flex flex-column mb-4">
                            <span className="mb-1">{formatMessage({ defaultMessage: 'Thời gian tạo' })}:</span>
                            {dayjs(record.createdAt*1000).format('DD/MM/YYYY HH:mm')}
                        </div>
                        <div className="d-flex flex-column">
                            <span className="mb-1">{formatMessage({ defaultMessage: 'Thời gian cập nhật' })}:</span>
                            {dayjs(record.updatedAt*1000).format('DD/MM/YYYY HH:mm')}
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                return (
                    <Dropdown drop='down' >
                        <Dropdown.Toggle className='btn-outline-secondary' >
                            {formatMessage({ defaultMessage: 'Chọn' })}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item
                                className="mb-1 d-flex"
                                onClick={async e => {
                                    e.preventDefault();

                                    history.push(`/setting/users/role/${record?.id}`)
                                }}>
                                {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                            </Dropdown.Item>
                            <Dropdown.Item
                                className="mb-1 d-flex"
                                onClick={async e => {
                                    e.preventDefault();

                                    history.push({
                                        pathname: '/setting/users/create-role',
                                        state: {
                                            role: record
                                        }
                                    })
                                }}>
                                {formatMessage({ defaultMessage: 'Sao chép' })}
                            </Dropdown.Item>
                            <Dropdown.Item
                                className="mb-1 d-flex"
                                onClick={async e => {
                                    e.preventDefault();
                                    setCurrentIdDelete(record?.id);
                                }}>
                                {formatMessage({ defaultMessage: 'Xóa' })}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                )
            }
        },
    ];

    return (
        <CardBody>
            <LoadingDialog show={loadingDeleteRole} />
            {!!currentIdDelete && <ModalConfirm
                show={!!currentIdDelete}
                title={formatMessage({ defaultMessage: 'Hệ thống sẽ xoá nhóm quyền này, bạn có đồng ý tiếp tục?' })}
                onConfirm={() => {
                    onDeleteUserRole(currentIdDelete);
                    setCurrentIdDelete(null);
                }}
                onHide={() => setCurrentIdDelete(null)}
            />}
            <div className="row ml-0 mx-2 mb-8 d-flex align-items-center justify-content-between">
                <div className="col-6 input-icon pl-0" style={{ height: 'fit-content' }} >
                    <input
                        type="text"
                        className="form-control"
                        style={{ height: 38 }}
                        onBlur={(e) => {
                            setSearchText(e.target.value)
                        }}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                setSearchText(e.target.value)
                            }
                        }}
                        placeholder={formatMessage({ defaultMessage: 'Nhập tên nhóm quyền' })}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6 mr-6"></i></span>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => history.push('/setting/users/create-role')}
                >
                    {formatMessage({ defaultMessage: 'Thêm nhóm quyền' })}
                </button>
            </div>

            <div style={{ position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loading ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={data?.userGetRoles?.items || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có nhóm quyền' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 0 }}
                />
            </div>
            {data?.userGetRoles?.items?.length > 0 && (
                <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                    <Pagination
                        page={page}
                        loading={loading}
                        limit={limit}
                        totalRecord={data?.userGetRoles?.pagination?.total}
                        totalPage={data?.userGetRoles?.pagination?.totalPage}
                        count={data?.userGetRoles?.items?.length}
                        basePath={'/setting/users'}
                        isShowEmpty={false}
                    />
                </div>
            )}
        </CardBody>
    )
};

export default memo(PermissionSection);