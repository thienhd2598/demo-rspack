import { useMutation, useQuery } from "@apollo/client";
import { Field, Formik } from "formik";
import queryString from 'querystring';
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Modal, useAccordionToggle } from "react-bootstrap";
import { injectIntl, useIntl } from "react-intl";
import { Link, useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { InputVertical } from "../../../../../_metronic/_partials/controls";
import mutate_scActionMultipleProduct from "../../../../../graphql/mutate_scActionMultipleProduct";
import query_sc_composite_image_sync from "../../../../../graphql/query_sc_composite_image_sync";
import query_sme_catalog_photo_frames from "../../../../../graphql/query_sme_catalog_photo_frames";
import { TooltipWrapper } from "../../../Finance/payment-reconciliation/common/TooltipWrapper";
import { useProductsUIContext } from "../../ProductsUIContext";
import * as Yup from "yup";

const CustomToggle = ({ children, eventKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setIsOpen(!isOpen);
    });

    return (
        <div className="mt-2 d-flex justify-content-between align-items-center cursor-pointer" onClick={decoratedOnClick}>
            <div>
                {children}
            </div>
            <i style={{ fontSize: 20 }} className={`mt-1 ${(isOpen ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down ml-2')}`} />
        </div>
    );
}

function ModalChooseActions({
    show,
    onHide,
    ids,
    setSyncImg
}) {
    const { formatMessage } = useIntl()
    const location = useLocation();
    const [current, setCurrent] = useState({
        prefix_name: false,
        frame: false,
    });
    const params = queryString.parse(location.search.slice(1, 100000))
    const { setIds } = useProductsUIContext();
    const { addToast } = useToasts();
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [selectedApplyCover, setSelectedApplyCover] = useState(4);
    const [selectedApplyBgUrl, setSelectedApplyBgUrl] = useState(0);
    const [currentFrameUrl, setCurrentFrameUrl] = useState('');
    const [currentFrame, setCurrentFrame] = useState(null);
    const [totalPrefixSuccess, setTotalPrefixSuccess] = useState(0);
    const [idJobSync, setIdJobSync] = useState(null);
    const currentChannel = params?.channel || 'shopee'

    const optionApplyCover = [
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh gốc' }), value: 4 },
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh bìa' }), value: 1 },
        { title: formatMessage({ defaultMessage: 'Áp dụng cho tất cả hình ảnh' }), value: 2 },
    ];

    const optionApplyBgUrl = [
        { title: formatMessage({ defaultMessage: 'Khung đè lên ảnh' }), value: 0 },
        { title: formatMessage({ defaultMessage: 'Ảnh đè lên khung' }), value: 1 },
    ];
    let limit = 25;

    const { data, loading: loadingPhotoFrame, refetch } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            // limit,
            // offset: (page - 1) * limit,
            where: {
                sme_id: {_neq : 0},
                _or: [{ name: { _iregex: searchText.trim().replace(/%/g, '') } }],
            },
        },
        fetchPolicy: 'cache-and-network'
    });

    const refTogglePrefixName = useRef();
    const refToggleFrame = useRef();

    const { data: dataSync, loading: loadingSync } = useQuery(query_sc_composite_image_sync, {
        variables: {
            id: idJobSync
        },
        skip: !idJobSync,
        fetchPolicy: 'cache-and-network',
        pollInterval: !idJobSync ? 0 : 500
    });

    const [mutateActionMutipleProduct, { loading: loadingActionMutipleProduct, data: dataActionMutipleProduct }] = useMutation(mutate_scActionMultipleProduct, {
        refetchQueries: ['ScGetSmeProducts', 'sc_composite_image_sync', 'scListPrefixName'],
        awaitRefetchQueries: true,
    });

    const totalRecord = data?.sme_catalog_photo_frames_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit)

    useMemo(() => {
        show && setCurrent({ frame: false, prefix_name: false });
    }, [show]);

    useEffect(
        () => {
            if ((dataSync?.sc_composite_image_sync?.total_fail + dataSync?.sc_composite_image_sync?.total_success) == dataSync?.sc_composite_image_sync?.total_product) {
                setTimeout(
                    () => {
                        setIdJobSync(null);
                        setIds([]);
                        // addToast(formatMessage({ defaultMessage: "Đã cập nhật khung ảnh cho sản phẩm" }), { appearance: 'success' })
                    }, 200
                )
            }
        }, [dataSync, setIdJobSync]
    );

    useMemo(
        () => {
            if (!dataSync?.sc_composite_image_sync) {
                // setSyncImg(null);
                return;
            }

            setSyncImg({
                dataSync,
                typeSync: {
                    frame: current.frame,
                    prefix_name: current.prefix_name
                },
                current: dataSync?.sc_composite_image_sync?.total_fail + dataSync?.sc_composite_image_sync?.total_success,
                total: dataSync?.sc_composite_image_sync?.total_product,
                total_prefix_success: totalPrefixSuccess
            })
        }, [dataSync?.sc_composite_image_sync, current, totalPrefixSuccess]
    );

    const onCloseModal = () => {
        setSelectedApplyCover(4);
        setSelectedApplyBgUrl(0);
        onHide();
        setCurrentFrameUrl('');
        setCurrentFrame(null);
        setSearchText('');
    };

    console.log({ ids });

    return (
        <Formik
            enableReinitialize
            initialValues={{
                prefix_name: ''
            }}
            validationSchema={Yup.object().shape({
                prefix_name: Yup.string()
                    .required(formatMessage({ defaultMessage: 'Vui lòng nhập tiền tố' }))
                    .test(
                        'chua-ky-tu-space-o-dau-cuoi',
                        formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa dấu cách ở đầu và cuối' }),
                        (value, context) => {
                            if (!!value) {
                                return value.length == value.trim().length;
                            }
                            return false;
                        },
                    )
                    .test(
                        'chua-ky-tu-2space',
                        formatMessage({ defaultMessage: 'Tên sản phẩm kho không được chứa 2 dấu cách liên tiếp' }),
                        (value, context) => {
                            if (!!value) {
                                return !(/\s\s+/g.test(value))
                            }
                            return false;
                        },
                    )
            })}
        >
            {({ values, handleSubmit, validateForm, setFieldValue, errors, resetForm }) => {
                const productsWarning = ids?.filter(product => {
                    const maxLength = currentChannel == 'shopee' ? 120 : 255

                    return (values?.prefix_name?.length + product?.name?.length) > maxLength
                });

                return <Modal
                    show={show}
                    aria-labelledby="example-modal-sizes-title-xl"
                    onHide={() => {}}
                    centered
                    backdrop={loadingActionMutipleProduct ? 'static' : true}
                    dialogClassName={loadingActionMutipleProduct ? 'width-fit-content' : ''}
                >
                    {loadingActionMutipleProduct && <div className='text-center m-8'>
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>}
                    {!loadingActionMutipleProduct && <Fragment>
                        <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
                            <Modal.Title>
                                {formatMessage({ defaultMessage: 'Thêm tiền tố tên & khung ảnh' })}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body className="overlay overlay-block cursor-default" style={{ position: 'relative' }}>
                            <Fragment>
                                {[
                                    {
                                        label: formatMessage({ defaultMessage: 'Thêm tiền tố tên hàng loạt' }),
                                        value: 'prefix_name',
                                    },
                                    {
                                        label: formatMessage({ defaultMessage: 'Thêm khung ảnh hàng loạt' }),
                                        value: 'frame'
                                    },
                                ].map(_option => {

                                    return <Fragment>
                                        {!current?.[_option.value] && (
                                            <label key={`_option--${_option.value}`} className="mb-4 checkbox checkbox-primary">
                                                <input type="checkbox"
                                                    checked={current[_option.value]}
                                                    onChange={(e) => {
                                                        setCurrent(prev => {
                                                            return {
                                                                ...prev,
                                                                [_option.value]: !prev[_option.value],
                                                            }
                                                        })
                                                    }}
                                                />
                                                <span></span>
                                                &ensp;{_option.label}
                                            </label>
                                        )}
                                        {!!current?.[_option.value] && <Accordion className="mb-4" defaultActiveKey={_option.value}>
                                            <CustomToggle
                                                eventKey={_option.value}
                                            >
                                                <label key={`_option--${_option.value}`} className="checkbox checkbox-primary">
                                                    <input type="checkbox"
                                                        checked={current[_option.value]}
                                                        onChange={(e) => {
                                                            setCurrent(prev => {
                                                                return {
                                                                    ...prev,
                                                                    [_option.value]: !prev[_option.value],
                                                                }
                                                            })
                                                        }}
                                                    />
                                                    <span></span>
                                                    &ensp;{_option.label}
                                                </label>
                                            </CustomToggle>
                                            {_option?.value == 'prefix_name' && <Accordion.Collapse eventKey={_option.value}>
                                                <div className="mt-4">
                                                    <div className="mb-2 d-flex align-items-center">
                                                        <div className="d-flex align-items-center mr-2" style={{ minWidth: 'fit-content' }}>
                                                            <span className="mr-1">{formatMessage({ defaultMessage: "Tiền tố" })}</span>
                                                            <span className="text-primary">*</span>
                                                            <TooltipWrapper
                                                                note={formatMessage({ defaultMessage: "Tiền tố sẽ được thêm vào trước tên sản phẩm và đồng bộ lên sàn" })}
                                                            >
                                                                <i className="fas fa-info-circle fs-14 ml-2"></i>
                                                            </TooltipWrapper>
                                                        </div>
                                                        <Field
                                                            name='prefix_name'
                                                            component={InputVertical}
                                                            placeholder={formatMessage({ defaultMessage: "Nhập tiền tố cho tên sản phẩm" })}
                                                            label={""}
                                                            customFeedbackLabel={" "}
                                                            cols={["col-0", "col-12"]}
                                                            countChar
                                                            rows={2}
                                                            maxChar={30}
                                                            maxLength={30}
                                                        />
                                                    </div>
                                                    {productsWarning?.length > 0 && <Fragment>
                                                        <div className="mt-4 mb-2 d-flex align-items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger bi bi-exclamation-triangle" viewBox="0 0 16 16">
                                                                <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z" />
                                                                <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
                                                            </svg>
                                                            <span className="text-danger ml-2">
                                                                {formatMessage({ defaultMessage: 'Cảnh báo các sản phẩm có tên quá {count} ký tự' }, { count: currentChannel == 'shopee' ? 120 : 255 })}
                                                            </span>
                                                        </div>
                                                        <ul style={{ maxHeight: 120, overflowY: 'auto', listStyle: 'inside' }}>
                                                            {productsWarning?.map(product => (
                                                                <li className="mb-2" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                    {product?.name}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Fragment>}
                                                </div>
                                            </Accordion.Collapse>}
                                            {_option?.value == 'frame' && <Accordion.Collapse eventKey={_option.value}>
                                                <div className="mt-4">
                                                    <div className="input-icon my-4">
                                                        <input
                                                            type="text"
                                                            style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)', borderRadius: 20 }}
                                                            className="form-control"
                                                            placeholder={formatMessage({ defaultMessage: "Nhập tên khung ảnh mẫu" })}
                                                            onChange={e => {
                                                                setSearchText(e.target.value)
                                                            }}
                                                        />
                                                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                                    </div>
                                                    <div className='row my-2 d-flex align-items-center'>
                                                        <div className="col-5">
                                                            <select
                                                                className="form-control"
                                                                onChange={e => {
                                                                    setCurrentFrameUrl('');
                                                                    setCurrentFrame('');
                                                                    setSelectedApplyCover(e.target.value);
                                                                }}
                                                            >
                                                                {optionApplyCover?.map(
                                                                    (_option, index) => <option
                                                                        key={`option-${index}`}
                                                                        value={_option.value}
                                                                    >
                                                                        {_option?.title}
                                                                    </option>
                                                                )}
                                                            </select>
                                                        </div>
                                                        <div className="col-5">
                                                            <select
                                                                className="form-control"
                                                                onChange={e => {
                                                                    setSelectedApplyBgUrl(e.target.value);
                                                                }}
                                                            >
                                                                {optionApplyBgUrl?.map(
                                                                    (_option, index) => <option
                                                                        key={`option-${index}`}
                                                                        value={_option.value}
                                                                    >
                                                                        {_option?.title}
                                                                    </option>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="my-4 mb-8 d-flex justify-content-between align-items-center">
                                                        <div className='d-flex align-items-center'>
                                                            <span className="mr-2">{formatMessage({ defaultMessage: 'Chọn khung ảnh' })}</span>
                                                            <i
                                                                className="fas fa-sync ml-6 mt-1"
                                                                style={{ cursor: "pointer", fontSize: 14 }}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    refetch();
                                                                }}
                                                            />
                                                        </div>
                                                        <Link to={'/frame-image/new'} target="_blank">
                                                            <span
                                                                className='text-primary'
                                                            >
                                                                +&ensp;{formatMessage({ defaultMessage: 'Thêm mẫu' })}
                                                            </span>
                                                        </Link>
                                                    </div>
                                                    {
                                                        loadingPhotoFrame ? <div className='mt-10 text-center' style={{ height: 250 }}>
                                                            <span className="spinner spinner-primary mb-8"></span>
                                                        </div> : (
                                                            <>
                                                                {data?.sme_catalog_photo_frames?.length > 0 ? (
                                                                    <div
                                                                        className="d-flex flex-wrap"
                                                                        style={{ height: 220, overflowY: 'auto' }}
                                                                    >
                                                                        {
                                                                            data?.sme_catalog_photo_frames?.map(
                                                                                (item, index) => (
                                                                                    <div
                                                                                        key={`indexindex-${index}`}
                                                                                        className="d-flex mr-8 mb-5"
                                                                                        style={{ flexDirection: 'column', maxWidth: 80 }}
                                                                                    >
                                                                                        <div
                                                                                            key={`catalog-frame-img-${index}`}
                                                                                            className="mb-1"
                                                                                            style={{ position: 'relative', border: currentFrame?.id == item?.id ? '1px solid #ff5629' : '', borderRadius: 4 }}
                                                                                            onClick={() => {
                                                                                                setCurrentFrameUrl(item?.asset_url)
                                                                                                setCurrentFrame(item)
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                style={{ width: 75, height: 75, objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }}
                                                                                                src={item?.asset_url}
                                                                                            />
                                                                                            {currentFrame?.id == item?.id && (
                                                                                                <i
                                                                                                    className='fas fa-check-circle text-primary'
                                                                                                    style={{ fontSize: 18, marginBottom: 8, position: 'absolute', top: 8, right: 6 }}
                                                                                                ></i>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="frame-image-name">{item.name || ''}</p>
                                                                                    </div>
                                                                                )
                                                                            )
                                                                        }
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className='text-center py-16'
                                                                        style={{ height: 250 }}
                                                                    >
                                                                        {formatMessage({ defaultMessage: 'Chưa có khung ảnh mẫu nào' })}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )
                                                    }
                                                </div>
                                            </Accordion.Collapse>}
                                        </Accordion>}
                                    </Fragment>
                                })}
                            </Fragment>
                        </Modal.Body>
                        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                            <div className="form-group">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-elevate mr-4"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault()
                                        setCurrent({
                                            prefix_name: false,
                                            frame: false,
                                        });
                                        resetForm();
                                        onCloseModal();
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'ĐỂ SAU' })}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ width: 100 }}
                                    disabled={Object.values(current).every(v => !v)}
                                    onClick={async e => {
                                        e.preventDefault();

                                        if (current.prefix_name) {
                                            let error = await validateForm(values);

                                            if (Object.values(error).length > 0) {
                                                handleSubmit();
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }
                                        }

                                        if (current.frame) {
                                            if (!currentFrameUrl) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh để thực hiện áp khung' }), { appearance: 'error' })
                                                return;
                                            }
                                        }

                                        let { data } = await mutateActionMutipleProduct({
                                            variables: {
                                                action_type: 'apply',
                                                check_frame: 0,
                                                check_prefix: 0,
                                                products: ids?.map(item => item?.id),
                                                ...(!!current?.prefix_name ? {
                                                    check_prefix: 1,
                                                    prefix_name: values?.prefix_name
                                                } : {}),
                                                ...(!!current?.frame ? {
                                                    check_frame: 1,
                                                    frame_options: {
                                                        apply_type: Number(selectedApplyCover),
                                                        option: Number(selectedApplyBgUrl),
                                                        frame_url: currentFrameUrl,
                                                        frame_static: currentFrame?.is_static,
                                                        frame_shape: currentFrame?.shape
                                                    }
                                                } : {})
                                            }
                                        })

                                        onCloseModal();
                                        resetForm();
                                        if (!!data?.scActionMultipleProduct?.success) {
                                            if (!!current.prefix_name && !current.frame) {
                                                setSyncImg({
                                                    dataSync: null,
                                                    typeSync: {
                                                        frame: current.frame,
                                                        prefix_name: current.prefix_name
                                                    },
                                                    current: ids?.length,
                                                    total: ids?.length,
                                                    total_prefix_success: data?.scActionMultipleProduct?.total_prefix_success
                                                })
                                            } else {
                                                setTotalPrefixSuccess(data?.scActionMultipleProduct?.total_prefix_success);
                                                setIdJobSync(data?.scActionMultipleProduct?.job_id);
                                            }
                                        } else {
                                            addToast(data?.scActionMultipleProduct?.message || formatMessage({ defaultMessage: 'Thêm khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'ÁP DỤNG' })}
                                </button>
                            </div>
                        </Modal.Footer>
                    </Fragment>}
                </Modal >
            }}
        </Formik>
    );
}

export default injectIntl(ModalChooseActions);