import React, { Fragment, memo, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { Formik } from "formik";
import * as Yup from "yup";
import { useSubheader } from '../../../../_metronic/layout';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import mutate_scheduledAssetFrameSave from '../../../../graphql/mutate_scheduledAssetFrameSave';
import ScheduledFrameInfo from './ScheduledFrameInfo';
import ModalConfirm from '../dialogs/ModalConfirm';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import { APPLY_TYPE_FRAME, OPTIONS_FRAME } from '../FrameImageHelper';
import ScheduledFrameProducts from './ScheduledFrameProducts';
import ModalAddProducts from '../dialogs/ModalAddProducts';
import gql from 'graphql-tag';
import dayjs from 'dayjs';
import client from '../../../../apollo';
import query_sme_catalog_photo_frames_by_pk from '../../../../graphql/query_sme_catalog_photo_frames_by_pk';
import ModalAlert from '../dialogs/ModalAlert';
import ModalWarning from '../dialogs/ModalWarning';

const queryProducts = gql`
    query scGetSmeProductByListId($list_product_id: [Int]) {
        scGetSmeProductByListId(list_product_id: $list_product_id) {
            connector_channel_code
            created_at
            updated_at
            id
            name
            sku      
            platform_status
            platform_text_status      
            status
            store_id
            productAssets {
                id
                origin_image_url
                position
                ref_id
                ref_url
                sc_product_id
                sme_asset_id
                sme_url
                template_image_url
                type
            }
        }
    }
`;

const MAX_PRODUCTS_SHCEDULED_PER_ONE_HOUUR = 12;

const ScheduledFrameCreate = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();

    const [currentDataError, setCurrentDataError] = useState(null);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [showConfirmBack, setShowConfirmBack] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [productsScheduled, setProductsScheduled] = useState([]);
    const [productsWarning, setProductsWarning] = useState(null);
    const [initialValues, setInitialValues] = useState({
        ['__changed__']: false,
        apply_type: APPLY_TYPE_FRAME[0],
        option: OPTIONS_FRAME[1],

    });

    const [mutateScheduledAssetFrameSave, { loading: loadingScheduledAssetFrameSave }] = useMutation(mutate_scheduledAssetFrameSave);

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Lập lịch áp khung' }) },
            { title: formatMessage({ defaultMessage: 'Tạo lịch' }) },
        ])
    }, []);

    const [validateSchema, setValidateSchema] = useState({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên lịch" }).toLowerCase() }))
            .min(5, formatMessage({ defaultMessage: "{name} tối thiểu {length} ký tự" }, { length: 5, name: formatMessage({ defaultMessage: "Tên lịch" }) }))
            .max(120, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 120, name: formatMessage({ defaultMessage: "Tên lịch" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên lịch không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên lịch không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return false;
                },
            )
            .when(`name_boolean`, {
                is: values => {
                    return !!values && !!values[`name`];
                },
                then: Yup.string().oneOf([`name`], formatMessage({ defaultMessage: 'Tên lịch đã tồn tại' }))
            }),
        [`name_boolean`]: Yup.object().notRequired(),
        store: Yup.object().required(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' })),

    });

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const optionsStore = useMemo(() => {
        const stores = dataStores?.sc_stores?.filter(store => store?.status == 1)?.map(store => {
            let findedChannel = dataStores?.op_connector_channels?.find(_ccc => _ccc.code == store.connector_channel_code);

            return {
                label: store?.name,
                value: store?.id,
                logo: findedChannel?.logo_asset_url,
                connector_channel_code: store?.connector_channel_code
            };
        });

        return stores;
    }, [dataStores]);

    useMemo(async () => {
        try {
            if (!history?.location?.state?.scheduled) return;
            const scheduledFrameClone = history?.location?.state?.scheduled;

            const { data: dataFrameByPk } = await client.query({
                query: query_sme_catalog_photo_frames_by_pk,
                variables: { id: scheduledFrameClone?.frame_id },
                fetchPolicy: 'network-only'
            });

            const frameByPk = {
                id: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.id,
                url: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.asset_url,
                name: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.name
            };

            setInitialValues(prev => {
                const scheduledFrame = scheduledFrameClone || {};
                const storeScheduledFrame = optionsStore?.find(st => st?.value == scheduledFrame?.store_id);
                const applyType = APPLY_TYPE_FRAME?.find(type => type?.value == scheduledFrame?.apply_type);
                const option = OPTIONS_FRAME?.find(op => op?.value == scheduledFrame?.option);

                return {
                    ...prev,
                    id: scheduledFrame?.id,
                    name: `Sao chép ${scheduledFrame?.title}`,
                    store: storeScheduledFrame,
                    status: scheduledFrame?.status,
                    apply_type: applyType,
                    option: option,
                    frame: !!dataFrameByPk?.sme_catalog_photo_frames_by_pk ? frameByPk : null,
                    time: [
                        dayjs(scheduledFrame?.apply_from_time).unix(),
                        dayjs(scheduledFrame?.apply_to_time).unix()
                    ]
                }
            });

            const listIdProduct = scheduledFrameClone?.scheduledProducts?.map(product => product?.product_id);
            setLoadingProduct(true);

            const { data: dataScheduledProducts } = await client.query({
                query: queryProducts,
                variables: {
                    list_product_id: listIdProduct
                }
            });

            setLoadingProduct(false);
            setProductsScheduled(dataScheduledProducts?.scGetSmeProductByListId?.map(product => {
                const schedledFrame = scheduledFrameClone?.scheduledProducts?.find(item => item?.product_id == product?.id);
                return {
                    ...product,
                    statusScheduled: schedledFrame?.status
                }
            }));
        } catch (error) {
            setProductsScheduled([]);
            setLoadingProduct(false);
        }
    }, [history?.location?.state, optionsStore]);

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Tạo lịch" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Tạo lịch" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Tạo lịch" }) + " - UpBase"} />
            </Helmet>
            <Formik
                initialValues={initialValues}
                validationSchema={Yup.object().shape(validateSchema)}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    setFieldValue,
                    validateForm
                }) => {
                    return (
                        <Fragment>
                            <LoadingDialog show={loadingScheduledAssetFrameSave} />
                            {showConfirmBack && <ModalConfirm
                                show={showConfirmBack}
                                title={formatMessage({ defaultMessage: 'Lịch áp khung sẽ không được lưu lại nếu bạn nhấn Huỷ. Bạn có đồng ý tiếp tục ?' })}
                                onConfirm={() => history.push(`/frame-image/scheduled-frame`)}
                                onHide={() => setShowConfirmBack(false)}
                            />}
                            {!!currentDataError && <ModalAlert
                                type="create"
                                dataError={currentDataError}
                                onHide={(id, type) => {
                                    if (type == 'error') {
                                        history.push('/frame-image/scheduled-frame');
                                        addToast(formatMessage({ defaultMessage: 'Tạo lịch áp khung thất bại' }), { appearance: "error" });
                                    } else {
                                        history.push(`/frame-image/scheduled-frame/${id}`);
                                        setCurrentDataError(null);
                                    }
                                }}
                            />}
                            {showAddProduct && <ModalAddProducts
                                show={showAddProduct}
                                currentStore={values?.store}
                                onHide={() => setShowAddProduct(false)}
                                productsScheduled={productsScheduled}
                                onAddProductsScheduled={products => setProductsScheduled(prev => prev.concat(products))}
                                optionsStore={optionsStore}
                            />}
                            {productsWarning && <ModalWarning 
                                productsWarning={productsWarning}
                                onHide={() => setProductsWarning(null)}
                            />}
                            <ScheduledFrameInfo
                                onResetProductsScheduled={() => setProductsScheduled([])}
                                optionsStore={optionsStore}
                            />
                            <ScheduledFrameProducts
                                optionsStore={optionsStore}
                                loadingProduct={loadingProduct}
                                productsScheduled={productsScheduled}
                                onShowModalAddProduct={() => setShowAddProduct(true)}
                                onRemoveProduct={id => setProductsScheduled(prev => prev.filter(item => item?.id != id))}
                            />
                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    className="btn btn-secondary mr-2"
                                    role="button"
                                    type="submit"
                                    style={{ width: 150 }}
                                    onClick={() => setShowConfirmBack(true)}
                                >
                                    {formatMessage({ defaultMessage: 'Hủy' })}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    type="submit"
                                    style={{ width: 150, cursor: false ? 'not-allowed' : 'pointer' }}
                                    disabled={productsScheduled?.length == 0}
                                    onClick={async () => {
                                        try {
                                            let error = await validateForm(values);

                                            if (Object.values(error).length > 0) {
                                                handleSubmit();
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (!values?.time) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn thời gian áp khung' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (!values?.frame) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh mẫu' }), { appearance: 'error' })
                                                return;
                                            }

                                            const [from, to] = [
                                                dayjs.unix(values?.time[0]).format('YYYY-MM-DD HH:mm'),
                                                dayjs.unix(values?.time[1]).format('YYYY-MM-DD HH:mm'),
                                            ];
                                            const diffTimeApply = dayjs(to).diff(from, 'hours');
                                            if (diffTimeApply < 25 && diffTimeApply * MAX_PRODUCTS_SHCEDULED_PER_ONE_HOUUR < productsScheduled?.length) {
                                                setProductsWarning({
                                                    time: diffTimeApply,
                                                    count: diffTimeApply * MAX_PRODUCTS_SHCEDULED_PER_ONE_HOUUR
                                                })
                                                return;
                                            }                                            

                                            const bodySave = {
                                                title: values?.name,
                                                apply_from_time: dayjs.unix(values?.time[0]).format('YYYY-MM-DD HH:mm:ss'),
                                                apply_to_time: dayjs.unix(values?.time[1]).format('YYYY-MM-DD HH:mm:ss'),
                                                apply_type: values?.apply_type?.value,
                                                frame_id: values?.frame?.id,
                                                list_product_add: productsScheduled?.map(product => product?.id),
                                                connector_channel_code: values?.store?.connector_channel_code,
                                                store_id: values?.store?.value,
                                                option: values?.option?.value
                                            };

                                            console.log({ bodySave });

                                            const { data } = await mutateScheduledAssetFrameSave({
                                                variables: { ...bodySave }
                                            });

                                            if (data?.scheduledAssetFrameSave?.product_errors?.length > 0) {
                                                setCurrentDataError({
                                                    idScheduleFrame: data?.scheduledAssetFrameSave?.data?.id,
                                                    type: data?.scheduledAssetFrameSave?.product_errors?.length == productsScheduled?.length ? 'error' : 'success',
                                                    total: productsScheduled?.length,
                                                    total_success: productsScheduled?.length - data?.scheduledAssetFrameSave?.product_errors?.length ?? 0,
                                                    total_error: data?.scheduledAssetFrameSave?.product_errors?.length ?? 0,
                                                    product_errors: data?.scheduledAssetFrameSave?.product_errors?.map(product => {
                                                        const findProduct = productsScheduled?.find(item => item?.id == product?.id);
                                                        return {
                                                            ...product,
                                                            name: findProduct?.name
                                                        }
                                                    })
                                                });
                                            } else {
                                                if (!!data?.scheduledAssetFrameSave?.success) {
                                                    history.push(`/frame-image/scheduled-frame/${data?.scheduledAssetFrameSave?.data?.id}`)
                                                    addToast(formatMessage({ defaultMessage: 'Tạo lịch áp khung thành công' }), { appearance: "success" });
                                                } else {
                                                    history.push('/frame-image/scheduled-frame');
                                                    addToast(formatMessage({ defaultMessage: 'Tạo lịch áp khung thất bại' }), { appearance: "error" });
                                                }
                                            }
                                        } catch (err) {
                                            console.log({ err })
                                            addToast(formatMessage({ defaultMessage: 'Tạo lịch áp khung thất bại' }), { appearance: "error" });
                                            history.push('/frame-image/scheduled-frame');
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tạo lịch áp khung' })}
                                </button>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik>
        </Fragment>
    )
};

export default memo(ScheduledFrameCreate);

export const actionKeys = {
    "frame_schedule_create": {
        router: '/frame-image/scheduled-frame-create',
        actions: [
            "sc_stores", "op_connector_channels", "scheduledAssetFrameSave",
            "scheduledAssetFrameCheckDuplicate", "ScGetSmeProducts", "ScTags", "sme_catalog_photo_frames_by_pk"
        ],
        name: "Thêm khung ảnh sản phẩm",
        group_code: 'frame_image',
        group_name: 'Quản lý khung ảnh sản phẩm',
        cate_code: 'frame_image__service',
        cate_name: 'Quản lý khung ảnh mẫu',
    },
};