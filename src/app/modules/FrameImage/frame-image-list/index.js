import React, { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody, Checkbox } from "../../../../_metronic/_partials/controls";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useQuery, useMutation } from '@apollo/client';
import { useHistory } from 'react-router';
import { Link, useLocation } from 'react-router-dom';
import Pagination from '../../../../components/Pagination';
import query_sme_catalog_photo_frames from '../../../../graphql/query_sme_catalog_photo_frames';
import mutate_remove_frame_image from '../../../../graphql/mutate_remove_frame_image';
import { useToasts } from "react-toast-notifications";
import LoadingDialog from '../LoadingDialog';
import queryString from 'querystring';
import { Helmet } from 'react-helmet-async';
import { useSubheader } from '../../../../_metronic/layout';
import { saveAs } from 'file-saver';
import { useIntl } from 'react-intl';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import InfoProduct from '../../../../components/InfoProduct';
import HoverImage from '../../../../components/HoverImage';
import ModalScheduledFrame from '../dialogs/ModalScheduledFrame';
import mutate_userDeleteProductFrames from '../../../../graphql/mutate_userDeleteProductFrames';
import ModalAddFrames from '../dialogs/ModalAddFrames';
import { TABS_FRAME } from '../FrameImageHelper';
import { omit } from 'lodash';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import ModalFrames from '../dialogs/ModalFrames';

export default memo(({ }) => {
    const history = useHistory();
    const { formatMessage } = useIntl();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { addToast } = useToasts();
    const refInput = useRef(null);
    const inputFileRef = useRef(null);
    const [ids, setIds] = useState([]);
    const [dataFiles, setDataFiles] = useState([]);
    const [showAddFrames, setShowAddFrames] = useState(false);
    const [currentFrameId, setCurrentFrameId] = useState(null);
    const [idFrameImage, setIdFrameImage] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [dataFrame, setDataFrame] = useState(null);
    const suhbeader = useSubheader();
    suhbeader.setTitle();

    useLayoutEffect(() => {
        suhbeader.setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Quản lý khung ảnh mẫu' }) },
            { title: formatMessage({ defaultMessage: 'Danh sách khung mẫu' }) },
        ])
    }, []);

    let page = useMemo(() => {
        try {
            let _page = Number(params.page)
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1
        }
    }, [params.page]);

    let limit = useMemo(() => {
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

    const { data, loading } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            limit,
            where: {
                sme_id: {_neq: 0},
                _or: [{ name: { _iregex: (params?.q || "")?.trim()?.replace(/%/g, '') } }],
                ...(params?.type ? {
                    is_static: { _eq: Number(params?.type) },
                } : {
                    is_static: { _eq: 1 }
                })
            },
            offset: (page - 1) * limit,
        },
        fetchPolicy: 'cache-and-network'
    });

    const [userDeleteProductFrames, { loading: loadingUserDeleteProductFrames }] = useMutation(mutate_userDeleteProductFrames, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_frames'],
    });

    const totalRecord = data?.sme_catalog_photo_frames_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return data?.sme_catalog_photo_frames?.some(item => item?.id === _id?.id);
    })?.length == data?.sme_catalog_photo_frames?.filter(frame => frame?.scheduleCount?.total_scheduled == 0)?.length;

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                <div className="mr-1">
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        isSelected={isSelectAll}
                        onChange={e => {
                            if (isSelectAll) {
                                setIds(ids.filter(x => {
                                    return !data?.sme_catalog_photo_frames?.some(frame => frame.id === x.id);
                                }))
                            } else {
                                const tempArray = [...ids];
                                (data?.sme_catalog_photo_frames || []).forEach(frame => {
                                    if (frame?.scheduleCount?.total_scheduled > 0) return;
                                    if (frame && !ids.some(item => item.id === frame.id)) {
                                        tempArray.push(frame);
                                    }
                                })
                                setIds(tempArray)
                            }
                        }}
                    />
                </div>
                <span>{formatMessage({ defaultMessage: 'Tên mẫu' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            width: '45%',
            align: 'left',
            render: (item, record) => {

                return <div className='d-flex align-items-center'>
                    <div className='mr-1'>
                        <Checkbox
                            size="checkbox-md"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={ids.some(_id => _id?.id == record?.id)}
                            onChange={e => {
                                if (record?.scheduleCount?.total_scheduled > 0) return;

                                if (ids.some((_id) => _id.id == record?.id)) {
                                    setIds(prev => prev.filter((_id) => _id.id != record?.id));
                                } else {
                                    setIds(prev => prev.concat([record]));
                                }
                            }}
                        />
                    </div>
                    <div className='d-flex flex-column'>
                        <InfoProduct
                            name={record?.name}
                            isSingle
                            productOrder={true}
                            url={() => {
                                if (record?.scheduleCount?.total_scheduled > 0) return;
                                window.open(`/frame-image/editor/${record?.id}`, "_blank")
                            }}
                        />
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Ảnh' }),
            dataIndex: 'asset_url',
            key: 'asset_url',
            align: 'left',
            width: '20%',
            render: (item, record) => {
                return <HoverImage
                    styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                    size={{ width: 320, height: 320 }}
                    defaultSize={{ width: 80, height: 80 }}
                    url={record?.asset_url || ''}
                />
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Lịch thay khung tự động' }),
            dataIndex: 'scheduleCount',
            key: 'scheduleCount',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                return <span
                    className={item?.total_scheduled > 0 ? 'text-primary' : ''}
                    style={item?.total_scheduled > 0 ? { cursor: 'pointer' } : {}}
                    onClick={() => {
                        if (item?.total_scheduled > 0) {
                            setCurrentFrameId(record?.id);
                        }
                    }}
                >
                    {item?.total_scheduled || '--'}
                </span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thao tác' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '20%',
            render: (item, record) => {
                return <div className='d-flex-justify-content-center align-items-center'>
                    <AuthorizationWrapper keys={['frame_image_action']}>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Tải xuống' })}
                                </Tooltip>
                            }
                        >
                            <div
                                className="btn btn-icon btn-light btn-sm mr-2"
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    saveAs(record?.asset_url, `${record?.name}.png`);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" color='#000' width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                                </svg>
                            </div>
                        </OverlayTrigger>
                        {record?.is_static == 0 && <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Sao chép' })}
                                </Tooltip>
                            }
                        >
                            <div
                                className='btn btn-icon btn-light btn-sm mr-2'
                                onClick={e => {
                                    e.preventDefault();
                                    history.push({
                                        pathname: '/frame-image/create-editor',
                                        state: {
                                            frame: record
                                        }
                                    });
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000000" class="bi bi-copy" viewBox="0 0 16 16">
                                    <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
                                </svg>
                            </div>
                        </OverlayTrigger>}
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Xoá' })}
                                </Tooltip>
                            }
                        >
                            <button
                                className="btn btn-icon btn-light btn-sm mr-2"
                                style={record?.scheduleCount?.total_scheduled > 0 ? { cursor: 'not-allowed' } : {}}
                                onClick={e => {
                                    e.preventDefault();

                                    if (record?.scheduleCount?.total_scheduled > 0) return;
                                    setActionType('single');
                                    setIdFrameImage(record?.id);
                                }}
                            >
                                <span className="svg-icon svg-icon-md svg-icon-control">
                                    <SVG src={toAbsoluteUrl("/media/svg/ic_delete_.svg")} />
                                </span>
                            </button>
                        </OverlayTrigger>
                    </AuthorizationWrapper>
                    <AuthorizationWrapper keys={['frame_image_edit']}>
                        {record?.is_static == 0 && <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                                </Tooltip>
                            }
                        >
                            {record?.scheduleCount?.total_scheduled > 0 ? (
                                <div className='btn btn-icon btn-light btn-sm mr-2' style={{ cursor: 'not-allowed' }}>
                                    <span className="svg-icon svg-icon-md svg-icon-control">
                                        <SVG src={toAbsoluteUrl("/media/svg/ic_edit_.svg")} />
                                    </span>
                                </div>
                            ) : (
                                <Link
                                    className="btn btn-icon btn-light btn-sm mr-2"
                                    to={`/frame-image/editor/${record?.id}`}
                                >
                                    <span className="svg-icon svg-icon-md svg-icon-control">
                                        <SVG src={toAbsoluteUrl("/media/svg/ic_edit_.svg")} />
                                    </span>
                                </Link>
                            )}
                        </OverlayTrigger>}
                    </AuthorizationWrapper>
                </div>
            }
        },
    ];

    return (
        <>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Danh sách khung mẫu' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Danh sách khung mẫu' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Danh sách khung mẫu' })} - UpBase`} />
            </Helmet>
            {!!currentFrameId && <ModalScheduledFrame
                currentFrameId={currentFrameId}
                onHide={() => setCurrentFrameId(null)}
            />}
            {showAddFrames && <ModalAddFrames
                dataFiles={dataFiles}
                show={showAddFrames}
                onHide={() => {
                    setDataFiles([]);
                    setShowAddFrames(false)
                }}
            />}

            {openModal && <ModalFrames
                show={openModal}
                onHide={() => setOpenModal(false)}
                onSelect={(frame) => {
                    if(frame?.id) {
                        history.push({pathname: '/frame-image/create-editor',
                            state: {
                                frame: frame
                            }
                        })
                    } else {
                        history.push('/frame-image/create-editor');
                    }
                }}
            />}
            <Card>
                <CardBody>
                    <div style={{ flex: 1 }} className="mb-4" >
                        <ul className="nav nav-tabs">
                            {TABS_FRAME.map((tab, index) => {
                                const { label, value } = tab;
                                const isActive = value == (params?.type || 1)
                                return (
                                    <li
                                        key={`tab-order-${index}`}
                                        className="nav-item"
                                    >
                                        <a className={`nav-link font-weight-normal ${isActive ? 'active' : ''} fs-16`}
                                            onClick={e => {
                                                e.preventDefault();
                                                refInput.current.value = "";
                                                history.push(`/frame-image/list?${queryString.stringify(
                                                    omit({ ...params, page: 1, type: value, }, ['q'])
                                                )}`)
                                            }}
                                        >
                                            {label}
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    <div className='d-flex align-items-center mb-4'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-info bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                            <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                        </svg>
                        <span className='text-info'>
                            {formatMessage({ defaultMessage: 'Khung ảnh đang ở trạng thái Đang áp khung thì sẽ không được phép chỉnh sửa và xoá.' })}
                        </span>
                    </div>
                    <div className='row mb-4'>
                        <div className="col-5 d-flex align-items-center justify-content-center">
                            <input
                                ref={refInput}
                                type="text"
                                style={{ borderRadius: 0, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: 'Tên khung ảnh mẫu' })}
                                defaultValue={params?.q || ''}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        history.push(`/frame-image/list?${queryString.stringify({
                                            ...params,
                                            q: e.target.value,
                                            page: 1
                                        })}`.replaceAll('%2C', '\,'))
                                    }
                                }}
                            />
                            <button
                                className="btn btn-primary d-flex justify-content-center align-items-center"
                                style={{ minWidth: 120, borderRadius: 0, height: 38, borderTopRightRadius: 8, borderBottomRightRadius: 8 }}
                                type="submit"
                                onClick={e => {
                                    e.preventDefault();
                                    history.push(`/frame-image/list?${queryString.stringify({
                                        ...params,
                                        q: refInput?.current?.value,
                                        page: 1
                                    })}`.replaceAll('%2C', '\,'))
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-4 bi bi-search" viewBox="0 0 16 16">
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                </svg>
                                <span>{formatMessage({ defaultMessage: 'Tìm kiếm' })}</span>
                            </button>
                        </div>
                    </div>
                    <div className='d-flex justify-content-between align-items-center mb-6'>
                        <div className='d-flex align-items-center'>
                            <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                                {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                            </div>
                            <button
                                type="button"
                                className="btn btn-elevate btn-primary ml-4"
                                disabled={ids?.length == 0}
                                style={{
                                    color: "white",
                                    width: 'max-content',
                                    minWidth: 120,
                                    background: ids?.length == 0 ? "#6c757d" : "",
                                    border: ids?.length == 0 ? "#6c757d" : "",
                                }}
                                onClick={() => setActionType('multiple')}
                            >
                                {formatMessage({ defaultMessage: "Xóa hàng loạt" })}
                            </button>
                        </div>
                        <div className='d-flex align-items-center'>
                            <input
                                ref={inputFileRef}
                                style={{ display: 'none' }}
                                multiple
                                type="file"
                                accept={".png, .jpg, .jpeg"}
                                onChange={e => {
                                    const filesUpload = [...e.target.files];

                                    setShowAddFrames(true);
                                    setDataFiles(filesUpload?.slice(0, 100));
                                }}
                            />
                            {(!params?.type || params?.type == 1) ? (
                                <AuthorizationWrapper keys={['frame_image_action']}>
                                    <button
                                        className="btn btn-primary"
                                        // style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                                        onClick={() => inputFileRef.current.click()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-cloud-upload" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                                            <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                                        </svg>
                                        {formatMessage({ defaultMessage: 'Thêm khung ảnh mẫu hàng loạt' })}
                                    </button>
                                </AuthorizationWrapper>
                            ) : (
                                <AuthorizationWrapper keys={['frame_schedule_create']}>
                                    <button
                                        className="btn btn-primary mr-4"
                                        style={{ width: 180 }}
                                        type="submit"
                                        onClick={e => {
                                            e.preventDefault();
                                            setOpenModal(true)
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Thêm khung ảnh' })}
                                    </button>
                                    {/* <button
                                        className="btn btn-primary"
                                        style={{ width: 150 }}
                                        type="submit"
                                        onClick={e => {
                                            e.preventDefault();
                                            history.push('/frame-image/create-editor');
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Thêm khung mẫu' })}
                                    </button> */}
                                </AuthorizationWrapper>
                            )}
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        {loading && (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                <span className="spinner spinner-primary" />
                            </div>
                        )}
                        <Table
                            style={loading ? { opacity: 0.4 } : {}}
                            className="upbase-table"
                            columns={columns}
                            data={!loading ? (data?.sme_catalog_photo_frames || []) : []}
                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có danh sách khung ảnh mẫu' })}</span>
                            </div>}
                            tableLayout="auto"
                            sticky={{ offsetHeader: 45 }}
                        />
                    </div>

                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={data?.sme_catalog_photo_frames?.length}
                        basePath={`/frame-image/list`}
                        isShowEmpty={false}
                    />
                </CardBody>
            </Card>

            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>{" "}
            </div>

            <LoadingDialog show={loadingUserDeleteProductFrames} />

            <Modal
                show={!!actionType}
                aria-labelledby="example-modal-sizes-title-lg"
                centered
                onHide={() => setActionType(null)}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-6" >
                        {actionType == 'single' ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn xoá khung ảnh mẫu này ?' }) : formatMessage({ defaultMessage: 'Hệ thống sẽ thực hiện xoá các khung mẫu đã chọn, bạn có đồng ý tiếp tục?' })}
                    </div>
                    <div>
                        <button
                            className="btn btn-secondary mr-4"
                            style={{ width: 150 }}
                            onClick={() => setActionType(null)}
                        >
                            {actionType == 'single' ? formatMessage({ defaultMessage: 'KHÔNG' }) : formatMessage({ defaultMessage: 'Hủy' })}
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ width: 150 }}
                            onClick={async () => {
                                setActionType(null);
                                let { data } = await userDeleteProductFrames({
                                    variables: {
                                        ids: actionType == 'single' ? [idFrameImage] : ids?.map(item => item?.id)
                                    }
                                });

                                if (!!data?.userDeleteProductFrames?.success) {
                                    addToast(formatMessage({ defaultMessage: 'Xoá khung mẫu thành công' }), { appearance: 'success' });
                                } else {
                                    addToast(formatMessage({ defaultMessage: 'Xoá khung mẫu thất bại' }), { appearance: 'error' });
                                }

                                setIds([]);
                                setIdFrameImage(null);
                            }}
                        >
                            {actionType == 'single' ? formatMessage({ defaultMessage: 'CÓ, XOÁ' }) : formatMessage({ defaultMessage: 'Đồng ý' })}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
});

export const actionKeys = {
    "frame_image_view": {
        router: '/frame-image/list',
        actions: ["sme_catalog_photo_frames", "sme_catalog_photo_frames_aggregate", "getSummaryScheduledFrame",
            "sc_stores"
        ],
        name: "Danh sách khung ảnh",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    },
    "frame_image_action": {
        router: '',
        actions: ["userDeleteProductFrames", "sme_catalog_photo_frames", "insert_sme_catalog_photo_frames", "sme_catalog_photo_frames_aggregate"],
        name: "Các thao tác màn danh sách khung ảnh",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    },
};