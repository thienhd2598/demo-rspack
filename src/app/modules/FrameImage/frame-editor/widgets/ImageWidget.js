import React, { Fragment, memo, useCallback, useMemo, useRef, useState } from "react";
import { FRAME_WAREHOUSE } from "../FrameEditorHelper";
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "@apollo/client";
import query_sme_catalog_photo_library from "../../../../../graphql/query_sme_catalog_photo_library";
import query_sme_catalog_photo_library_category from "../../../../../graphql/query_sme_catalog_photo_library_category";
import mutate_insert_sme_catalog_photo_library from "../../../../../graphql/mutate_insert_sme_catalog_photo_library";
import mutate_delete_sme_catalog_photo_library_by_pk from "../../../../../graphql/mutate_delete_sme_catalog_photo_library_by_pk";
import { sortBy } from "lodash";
import { useIntl } from "react-intl";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import clsx from "clsx";
import axios from "axios";
import ModalConfirm from "../../dialogs/ModalConfirm";
import { useToasts } from "react-toast-notifications";
import Drag from "../components/Drag";
import TRIGGER from "../config/trigger";
import { useFrameEditorContext } from "../FrameEditorContext";
import HoverImage from '../../../../../components/HoverImage';

const ImageWidget = ({currentTab, setCurrentTab, currentType, setCurrentType, currentTypeFrame}) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const inputFileRef = useRef();
    const user = useSelector((state) => state.auth.user);
    // const [currentTab, setCurrentTab] = useState(null);
    // const [currentType, setCurrentType] = useState(1);
    const [currentIdLibDelete, setCurrentIdLibDelete] = useState(null);
    const { updateCurrentStageData, currentStageData } = useFrameEditorContext();
    const [isExpanded, setIsExpanded] = useState([])

    const { data: dataPhotoLib, loading: loadingPhotoLib } = useQuery(query_sme_catalog_photo_library, {
        variables: {
            where: {
                sme_id: { _eq: currentType == 1 ? user?.sme_id : 0 },
                category_id: { _eq: currentTab?.id }
            },
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log(currentTypeFrame)
    const { data: dataPhotoLibCategory } = useQuery(query_sme_catalog_photo_library_category, {
        variables: {
            wherePhoto: {
                sme_id: { _eq: currentType == 1 ? user?.sme_id : 0 },
            },
            where: {
                type: {_eq: 0},
                _or: [
                    {
                        parent_id: {_is_null: true}, 
                    },
                    {
                        id: {_in: currentTypeFrame?.map(item => item?.value)},
                    }
                ]
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const [mutateCreatePhotoLib, { loading: loadingCreatePhotoLib }] = useMutation(mutate_insert_sme_catalog_photo_library, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_library']
    });

    const [mutateDeletePhotoLib, { loading: loadingDeletePhotoLib }] = useMutation(mutate_delete_sme_catalog_photo_library_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_catalog_photo_library']
    });

    const photoLibCategories = useMemo(() => {
        const sortedDataPhotoLibCategory = sortBy(dataPhotoLibCategory?.sme_catalog_photo_library_category?.filter(cate => !cate?.parent_id) || [], ['id']);
        setCurrentTab(sortedDataPhotoLibCategory?.[0]);
        return sortedDataPhotoLibCategory;
    }, [dataPhotoLibCategory]);

    
    const childrenCategory = useMemo(() => {
        const children = dataPhotoLibCategory?.sme_catalog_photo_library_category?.filter(cate => cate?.parent_id && cate?.parent_id == currentTab?.id).map(child =>{
            return {
                ...child,
                parent_id: currentTab?.id
            }
        })
        return children
    }, [dataPhotoLibCategory, currentTab, currentType])

    const onDeletePhotoLibrary = useCallback(async () => {
        try {
            const { data } = await mutateDeletePhotoLib({
                variables: {
                    id: currentIdLibDelete
                }
            });

            setCurrentIdLibDelete(null);
            if (data?.delete_sme_catalog_photo_library_by_pk?.id) {
                addToast(formatMessage({ defaultMessage: 'Xóa ảnh thành công' }), { appearance: 'success' });
            } else {
                addToast(formatMessage({ defaultMessage: 'Xóa ảnh thất bại' }), { appearance: 'error' })
            }
        } catch (error) {
            setCurrentIdLibDelete(null);
            addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: 'error' })
        }
    }, [currentIdLibDelete]);

    return (
        <Fragment>
            {!loadingDeletePhotoLib && <ModalConfirm
                show={!!currentIdLibDelete}
                title={formatMessage({ defaultMessage: "Bạn có đồng ý xoá ảnh này không?" })}
                onHide={() => setCurrentIdLibDelete(null)}
                onConfirm={onDeletePhotoLibrary}
            />}
            <div className='row mb-4'>
                <div className='col-3 text-right'>
                    <span style={{ position: 'relative', top: 10 }}>
                        <span>{formatMessage({ defaultMessage: 'Thư viện' })}</span>
                        <span className='text-danger ml-1'>*</span>
                    </span>
                </div>
                <div className='col-9'>
                    <div className="form-group d-flex align-items-center radio-inline">
                        {FRAME_WAREHOUSE.map((wh, idx) => {
                            return (
                                <>
                                    <label key={wh.value} className="radio mt-3 mb-1">
                                        <input
                                            type="radio"
                                            name={`channel-${wh.value}`}
                                            checked={currentType == wh.value}
                                            onChange={() => {
                                                setCurrentType(wh.value);
                                                setCurrentTab(photoLibCategories?.[0]);
                                            }}
                                        />
                                        <span className={clsx(idx != 0 && "mx-2")}></span>
                                        {wh?.label}
                                    </label>

                                </>
                            )
                        })}
                    </div>
                </div>
                <ul className="nav nav-tabs-custom nav-tabs-line mb-5 fs-6 w-100">
                    {photoLibCategories?.map(tab => (
                        <li
                            className="nav-item"
                            key={`frame-tab-${tab?.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                setCurrentTab(tab);
                            }}
                        >
                            <a
                                className={clsx('nav-link', { active: currentTab?.id === tab?.id })}
                                data-bs-toggle="tab"
                                href=""
                            >
                                {tab?.name}
                            </a>
                        </li>
                    ))}
                </ul>
                {photoLibCategories?.length > 0 && <div className="w-100" style={{ position: 'relative', opacity: (loadingPhotoLib || loadingCreatePhotoLib || loadingDeletePhotoLib) ? 0.4 : 1 }}>
                    {(loadingPhotoLib || loadingCreatePhotoLib || loadingDeletePhotoLib) && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>}
                    <div className="d-flex align-items-center mx-4 flex-wrap" style={{ gap: 20 }}>
                        <input
                            ref={inputFileRef}
                            style={{ display: 'none' }}
                            multiple
                            type="file"
                            accept={".png, .jpg, .jpeg, .svg"}
                            onChange={async e => {
                                const filesUpload = [...e.target.files];

                                const totalLibs = await Promise.all(filesUpload?.map(file => {
                                    let formData = new FormData();
                                    formData.append('type', 'file');
                                    formData.append('file', file);
                                    formData.append('isUseCDN', false);

                                    return axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
                                        isSubUser: user?.is_subuser,
                                    });
                                }));

                                const requestCreatePhotoLibs = totalLibs?.map(item => {
                                    return {
                                        asset_id: item?.data?.data?.id,
                                        asset_url: item?.data?.data?.source,
                                        category_id: currentTab?.id
                                    }
                                })

                                await mutateCreatePhotoLib({
                                    variables: {
                                        objects: requestCreatePhotoLibs
                                    }
                                });
                            }}
                        />
                        {currentType == 1 && <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Thêm mới ảnh' })}
                                </Tooltip>
                            }
                        >
                            <svg
                                className="bi bi-plus-square-fill text-primary cursor-pointer"
                                xmlns="http://www.w3.org/2000/svg"
                                width="16" height="16" fill="currentColor"
                                viewBox="0 0 16 16"
                                onClick={() => inputFileRef.current.click()}
                            >
                                <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.5 4.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3a.5.5 0 0 1 1 0" />
                            </svg>
                        </OverlayTrigger>}
                        {dataPhotoLibCategory?.sme_catalog_photo_library_category?.find(lib => lib?.id == currentTab?.id)?.photoLibraries?.map(lib => {
                            console.log(lib)   
                            const isImageIcon = lib?.asset_url?.endsWith('svg');
                            const imageView = <div
                                className="image-input overlay"
                                id="kt_image_4"
                                style={{
                                    width: 50, height: 50,
                                    cursor: 'pointer',
                                    backgroundColor: '#F7F7FA',
                                    border: '1px dashed #D9D9D9',
                                    position: 'relative'
                                }}
                            >
                                <HoverImage
                                    className="image-input-wrapper"
                                    styles={{
                                       borderRadius: '0.42rem'
                                    }}
                                    defaultSize={{
                                        width: 50,
                                        height: 50}}
                                    size={{
                                        width: 150,
                                        height: 150}}
                                    url={lib?.asset_url}
                                    handleOnclick={(e) => {
                                        e.preventDefault();
                                        console.log('vaoday')
                                        if (lib?.category_id == 1) {
                                            const findedStageFrame = currentStageData?.find(item => item?.attrs?.['data-item-type'] == 'frame');
                                            updateCurrentStageData(findedStageFrame?.id, {
                                                src: lib?.asset_url
                                            })
                                        }
                                    }}
                                />
                                {currentType == 1 && (
                                    <svg
                                        className="bi bi-x-circle-fill cursor-pointer text-muted"
                                        style={{ position: 'absolute', top: -5, right: -5 }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16" height="16" fill="currentColor"
                                        viewBox="0 0 16 16"
                                        onClick={e => {
                                            e.preventDefault();
                                            setCurrentIdLibDelete(lib?.id);
                                        }}
                                    >
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
                                    </svg>
                                )}
                            </div>

                            if (lib?.category_id != 1) {
                                return <Drag
                                    dragType="copyMove"
                                    dragSrc={{
                                        trigger: TRIGGER.INSERT.IMAGE,
                                        "data-item-type": isImageIcon ? 'icon' : 'image',
                                        src: lib?.asset_url,
                                    }}>
                                    {imageView}
                                </Drag>
                            }
                            return imageView
                        })}

                    </div>
                    {currentType ==  2 && !!childrenCategory?.length && 
                        childrenCategory?.map(child => {
                            const dataImageChild = !isExpanded?.includes(child?.id) ? child?.photoLibraries?.slice(0,6) : child?.photoLibraries
                            return (
                                <div>
                                    <p className="d-flex justify-content-between align-items-center mt-4 mb-4 mr-2 ml-2"><strong>{child?.name}</strong>
                                        {child?.photoLibraries?.length > 6 && <span
                                            className='cursor-pointer active'
                                            style={{color: '#ff5629'}}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if(isExpanded?.includes(child?.id)) {
                                                    setIsExpanded(prev => prev?.filter(item => item != child?.id));
                                                } else {
                                                    setIsExpanded(prev => [...prev, child?.id]);
                                                }
                                            }}
                                        >
                                            {!!isExpanded?.includes(child?.id) ? formatMessage({defaultMessage: 'Thu gọn'}): formatMessage({defaultMessage: 'Xem tất cả'})}
                                        </span>}
                                    </p>
                                    <div className="d-flex align-items-center mx-4 row">
                                    {dataImageChild?.map(lib => {   
                                        const isImageIcon = lib?.asset_url?.endsWith('svg');
                                        const imageView = <div className="col-2  mt-2"><div
                                            className="image-input overlay"
                                            id="kt_image_4"
                                            style={{
                                                width: 50, height: 50,
                                                cursor: 'pointer',
                                                backgroundColor: '#F7F7FA',
                                                border: '1px dashed #D9D9D9',
                                                position: 'relative'
                                            }}
                                        >
                                            <HoverImage
                                                className="image-input-wrapper"
                                                styles={{
                                                    borderRadius: '0.42rem'
                                                }}
                                                defaultSize={{
                                                    width: 50,
                                                    height: 50}}
                                                size={{
                                                    width: 150,
                                                    height: 150}}
                                                url={lib?.asset_url}
                                                handleOnclick={(e) => {
                                                    e.preventDefault();
                                                    if (child?.parent_id == 1) {
                                                        const findedStageFrame = currentStageData?.find(item => item?.attrs?.['data-item-type'] == 'frame');
                                                        updateCurrentStageData(findedStageFrame?.id, {
                                                            src: lib?.asset_url
                                                        })
                                                    }
                                                }}
                                            />
                                        </div>
                                        </div>
                                        if (child?.parent_id != 1) {
                                            return <Drag
                                                dragType="copyMove"
                                                dragSrc={{
                                                    trigger: TRIGGER.INSERT.IMAGE,
                                                    "data-item-type": isImageIcon ? 'icon' : 'image',
                                                    src: lib?.asset_url,
                                                }}>
                                                {imageView}
                                            </Drag>
                                        }
                                        return imageView
                                    })} 
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>}
            </div>
        </Fragment>
    )
};

export default memo(ImageWidget);