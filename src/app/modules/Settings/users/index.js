import { useMutation, useQuery } from '@apollo/client';
import axios from "axios";
import dayjs from 'dayjs';
import _ from 'lodash';
import queryString from 'querystring';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { connect, shallowEqual, useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from 'react-router-dom';
import Select from 'react-select';
import { useToasts } from "react-toast-notifications";
import { Card, CardBody, CardHeader } from '../../../../_metronic/_partials/controls';
import { useSubheader } from '../../../../_metronic/layout';
import Pagination from '../../../../components/Pagination';
import mutate_delete_sme_sub_users_by_pk from '../../../../graphql/mutate_delete_sme_sub_users_by_pk';
import mutate_update_sme_users_by_pk from '../../../../graphql/mutate_update_sme_users_by_pk';
import mutate_userUpdateMe from "../../../../graphql/mutate_userUpdateMe";
import query_sme_roles from '../../../../graphql/query_sme_roles';
import query_sme_sub_users from '../../../../graphql/query_sme_sub_users';
import { loadSizeImage, validateImageFileKho } from '../../../../utils';
import { actions } from '../../Auth/_redux/authRedux';
import { FormattedMessage, useIntl } from 'react-intl';
import SubuserSection from './components/SubuserSection';
import PermissionSection from './components/PermissionSection';
import mutate_userDeleteSubUser from '../../../../graphql/mutate_userDeleteSubUser';

const CancelToken = axios.CancelToken;

const TABS_USER = [
    { title: <FormattedMessage defaultMessage='Tài khoản phụ' />, type: 'subUser' },
    { title: <FormattedMessage defaultMessage='Nhóm quyền' />, type: 'permission' }
];

const UsersManagement = (props) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();

    const OPTIONS_BUSINESS = [
        { value: 'enterprise', label: formatMessage({ defaultMessage: 'Doanh nghiệp' }) },
        { value: 'individual', label: formatMessage({ defaultMessage: 'Cá nhân' }) },
    ]
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user, shallowEqual);
    const { appendBreadcrumbs, setBreadcrumbs } = useSubheader();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const history = useHistory();
    const refInput = useRef();
    const refCancel = useRef();
    const [file, setFile] = useState()
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState();
    const [currentSubUserDelete, setCurrentSubUserDelete] = useState(null);

    useEffect(() => {
        setBreadcrumbs([]);
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Cài đặt' }),
            pathname: `/setting`
        })
        appendBreadcrumbs({
            title: formatMessage({ defaultMessage: 'Tài khoản' }),
            pathname: `/setting/users`
        })
    }, [])

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

    const [mutateUpdateUser, { loading: loadingUpdateUser }] = useMutation(mutate_userUpdateMe);
    const [mutateDeleteSubUser, { loading: loadingDeleteSubUser }] = useMutation(mutate_userDeleteSubUser, {
        awaitRefetchQueries: true,
        refetchQueries: ['userGetSubUsers']
    });

    console.log(user)
    const _upload = useCallback(async (file) => {
        setUploading(true)
        try {
            let formData = new FormData();
            formData.append('type', 'file')
            formData.append('file', file, file.name || 'file.jpg')
            let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                isSubUser: user?.is_subuser,
                cancelToken: new CancelToken(function executor(c) {
                    refCancel.current = c;
                }),
            })

            if (res.data?.success) {
                const { data: dataUpdateUser } = await mutateUpdateUser({
                    variables: {
                        userUpdateMeInput: {
                            avatar_url: res.data?.data.source,
                            phone: String(user?.phone),
                            business_model: user?.business_model,
                            full_name: user?.full_name,
                        }
                    }
                })

                setUploading(false)
                if (!!dataUpdateUser?.userUpdateMe?.success) {
                    dispatch(props.setUser({
                        ...user,
                        avatar_url: res.data?.data.source
                    }));
                    addToast(formatMessage({ defaultMessage: 'Cập nhật ảnh đại diện thành công' }), { appearance: 'success' });
                } else {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật ảnh đại diện thất bại' }), { appearance: 'error' });
                }
            } else {
                addToast(formatMessage({ defaultMessage: 'Tải ảnh không thành công.' }), { appearance: 'error' });
            }
        } catch (error) {
            console.log('error', error)
            addToast(formatMessage({ defaultMessage: 'Cập nhật ảnh đại diện thất bại' }), { appearance: 'error' });
        } finally {
            setUploading(false)
        }
    }, [user])

    useEffect(() => {
        if (!!file) {
            let reader = new FileReader();
            let url = reader.readAsDataURL(file);

            reader.onloadend = function (e) {
                let img = new Image()

                img.onload = function (imageEvent) {
                    _upload(file);

                }
                img.src = e.target.result;
            }
        }
        return () => {
            !!refCancel.current && refCancel.current('unmount')
        }
    }, [file]);

    console.log({ user });

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: `Tài khoản` }) + `- UpBase`}
                defaultTitle={formatMessage({ defaultMessage: `Tài khoản` }) + `- UpBase`}
            >
                <meta name="description" content={formatMessage({ defaultMessage: `Tài khoản` }) + `- UpBase`} />
            </Helmet>

            <Modal
                show={!!currentSubUserDelete}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => setCurrentSubUserDelete(null)}
                dialogClassName={loadingDeleteSubUser ? 'width-fit-content' : ''}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    {loadingDeleteSubUser && <>
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </>}
                    {!loadingDeleteSubUser && (
                        <>
                            <div className="mb-4" >{formatMessage({ defaultMessage: 'Bạn có chắc chắn xoá tài khoản' })} {currentSubUserDelete?.username || ''} {formatMessage({ defaultMessage: 'không' })}?</div>

                            <div className="form-group mb-0">
                                <button
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 90 }}
                                    onClick={() => setCurrentSubUserDelete(null)}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Không' })}</span>
                                </button>
                                <button
                                    className={`btn btn-primary font-weight-bold`}
                                    style={{ width: 90 }}
                                    onClick={async () => {
                                        let res = await mutateDeleteSubUser({
                                            variables: {
                                                id: currentSubUserDelete?.id
                                            }
                                        })
                                        if (!!res?.data?.userDeleteSubUser?.success) {
                                            addToast(formatMessage({ defaultMessage: 'Xóa tài khoản thành công' }), { appearance: 'success' });
                                        } else {
                                            addToast(formatMessage({ defaultMessage: "Xóa tài khoản thất bại" }), { appearance: 'error' });
                                        }
                                        setCurrentSubUserDelete(null)
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đồng ý' })}</span>
                                </button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal >

            <Card>
                <CardHeader title={formatMessage({ defaultMessage: "Thông tin chung" })} />
                <CardBody>
                    <div className='row'>
                        <div className="col-6">
                            <div className='row mb-8'>
                                <span className="col-sm-4 text-right">Email:</span>
                                <span className="col-sm-8">{user?.email || '--'}</span>
                            </div>
                            <div className='row mb-8'>
                                <span className="col-sm-4 text-right">{formatMessage({ defaultMessage: 'Số điện thoại' })}:</span>
                                <span className="col-sm-8">{user?.phone || '--'}</span>
                            </div>
                            <div className='row mb-8'>
                                <span className="col-sm-4 text-right">{formatMessage({ defaultMessage: 'Hình thức tổ chức' })}:</span>
                                <span className="col-sm-8">{_.find(OPTIONS_BUSINESS, _option => _option?.value == user?.business_model)?.label || '--'}</span>
                            </div>
                            <div className='row mb-8'>
                                <span className="col-sm-4 text-right">{formatMessage({ defaultMessage: 'Tên doanh nghiệp/ cá nhân' })}:</span>
                                <span className="col-sm-8">{user?.full_name || '--'}</span>
                            </div>
                            <div className='row'>
                                <span className="col-sm-4 text-right">
                                    <span className="mr-1">{formatMessage({ defaultMessage: 'Mã tài khoản' })}</span>
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Mã tài khoản là Account ID để đăng nhập tài khoản phụ' })}
                                            </Tooltip>
                                        }
                                    >
                                        <i className="fas fa-info-circle" style={{ fontSize: 14 }}></i>
                                    </OverlayTrigger>
                                    {`:`}
                                </span>
                                <span className="col-sm-8">{user?.sme_id || '--'}</span>
                            </div>
                        </div>
                        <div className="col-3">
                            <div className='d-flex'>
                                <div className='d-flex' style={{ flexDirection: 'column' }}>
                                    <div
                                        className="image-input mr-6 overlay"
                                        id="kt_image_4"
                                        style={{
                                            width: 122, height: 122,
                                            cursor: 'pointer',
                                            backgroundColor: '#F7F7FA',
                                            border: !!error ? '1px solid #f14336' : '1px dashed #D9D9D9'
                                        }}
                                        onClick={e => {
                                            if (!!user?.avatar_url) return;
                                            !!refInput.current && refInput.current.click()
                                        }}
                                    >
                                        {!!user?.avatar_url ? (
                                            <div className="image-input-wrapper" style={{
                                                backgroundImage: `url("${user?.avatar_url}")`,
                                            }}></div>
                                        ) : (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                            }}>
                                                {(!uploading || !loadingUpdateUser) && (
                                                    <>
                                                        <i className='flaticon2-add-1' style={{ fontSize: 28 }} ></i>
                                                        <span style={{ marginTop: 4 }} >{formatMessage({ defaultMessage: 'Tải ảnh lên' })}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {(!!uploading || !!loadingUpdateUser) && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                            }}>
                                                <span className="mr-6 spinner spinner-primary"></span>
                                            </div>
                                        )}
                                        {!!user?.avatar_url && (
                                            <div className="overlay-layer align-items-end justify-content-center">
                                                <div className="d-flex flex-grow-1 flex-center bg-white-o-5 py-5">
                                                    <a href="#" className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow mr-2"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            e.stopPropagation();

                                                            !!refInput.current && refInput.current.click();
                                                        }}
                                                    >
                                                        <i className="fa fa-pen icon-sm text-muted"></i>
                                                    </a>
                                                    <a href="#" className="btn btn-xs btn-icon btn-circle btn-white btn-hover-text-primary btn-shadow"
                                                        onClick={async e => {
                                                            e.preventDefault();
                                                            e.stopPropagation();

                                                            const { data: dataUpdateUser } = await mutateUpdateUser({
                                                                variables: {
                                                                    userUpdateMeInput: {
                                                                        avatar_url: '',
                                                                        phone: String(user?.phone),
                                                                        business_model: user?.business_model,
                                                                        full_name: user?.full_name,
                                                                    }
                                                                }
                                                            })

                                                            if (!!dataUpdateUser?.userUpdateMe?.success) {
                                                                dispatch(props.setUser({
                                                                    ...user,
                                                                    avatar_url: ""
                                                                }));
                                                                addToast(formatMessage({ defaultMessage: 'Xóa ảnh đại diện thành công' }), { appearance: 'success' });
                                                            } else {
                                                                addToast(formatMessage({ defaultMessage: 'Xóa ảnh đại diện thất bại' }), { appearance: 'error' });
                                                            }
                                                        }}
                                                    >
                                                        <i className="ki ki-bold-close icon-xs text-muted"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <input
                                    ref={refInput}
                                    type="file"
                                    style={{ display: 'none' }}
                                    multiple={false}
                                    accept={".png, .jpg, .jpeg"}
                                    onChange={async e => {
                                        let _file = e.target.files[0];
                                        let resFetchSize = await Promise.resolve(loadSizeImage(_file));
                                        if (_file.size > 3 * 1024 * 1024) {
                                            addToast(formatMessage({ defaultMessage: 'Không thể được tải lên. Kích thước tập tin vượt quá 3.0 MB.' }), { appearance: 'error' });
                                            return;
                                        }
                                        if (!!validateImageFileKho({ ...resFetchSize, size: 0 })) {
                                            addToast(formatMessage({ defaultMessage: 'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu 500x500, tối đa 5000x5000' }), { appearance: 'error' });
                                            return;
                                        }
                                        setError(null);
                                        setFile(_file);
                                        // e.target.value = ''
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-3">
                            <div className='d-flex justify-content-center align-items-center'>
                                {!user?.is_subuser && (
                                    <button
                                        className="btn btn-primary mr-3"
                                        onClick={() => history.push('/user-profile/update-information')}
                                    >
                                        {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={() => history.push('/setting/users/change-password')}
                                >
                                    {formatMessage({ defaultMessage: 'Đổi mật khẩu' })}
                                </button>
                            </div>
                        </div>
                    </div>

                </CardBody>
            </Card>
            {!user?.is_subuser && (
                <Card className="mt-4">
                    <div style={{ flex: 1 }} className="my-4 mx-4" >
                        <ul className="nav nav-tabs">
                            {
                                TABS_USER.map((_tab, index) => {
                                    const { title, type } = _tab;
                                    const isActive = type == (params?.type || 'subUser')
                                    return (
                                        <li
                                            key={`tab-order-${index}`}
                                            className="nav-item"
                                        >
                                            <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''}`}
                                                style={{ fontSize: '16px' }}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    history.push(`/setting/users?${queryString.stringify(
                                                        _.omit({
                                                            ...params,
                                                            page: 1,
                                                            type: type,
                                                        }, ['warehouseId', 'protocol', 'q', 'search_type', 'store'])
                                                    )}`)
                                                }}
                                            >
                                                {title}
                                            </a>
                                        </li>
                                    )
                                })
                            }
                        </ul>

                    </div>
                    {params?.type != TABS_USER[1].type ? <SubuserSection
                        page={page}
                        limit={limit}
                        setCurrentSubUserDelete={setCurrentSubUserDelete}
                    /> : <PermissionSection
                        page={page}
                        limit={limit}
                    />}
                </Card>
            )}

        </Fragment>
    )
};

export default memo(connect(null, actions)(UsersManagement));