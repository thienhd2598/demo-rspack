import React, { memo, useMemo, useCallback, useState, useLayoutEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useSubheader } from '../../../../../_metronic/layout';
import { useHistory, useLocation } from 'react-router-dom';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { Formik } from "formik";
import * as Yup from "yup";
import InfoReserve from './InfoReserve';
import VariantReserve from './VariantReserve';
import ModalAddVariants from '../dialogs/ModalAddVariants';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import mutate_userCreateReserveTicket from '../../../../../graphql/mutate_userCreateReserveTicket';
import ModalInfoVariant from '../dialogs/ModalInfoVariant';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import ModalConfigReserve from '../dialogs/ModalConfigReserve';
import ModalConfirm from '../dialogs/ModalConfirm';
import { groupBy, sum } from 'lodash';
import client from '../../../../../apollo';
import query_warehouse_reserve_ticket_items from '../../../../../graphql/query_warehouse_reserve_ticket_items';
import ModalAlert from '../dialogs/ModalAlert';
import ModalWarning from '../dialogs/ModalWarning';
import dayjs from "dayjs";
import query_scGetProductVariants from '../../../../../graphql/query_scGetProductVariants';

const queryGetScVariantsByIds = async (ids) => {
    if (ids?.length == 0) return [];
  
    const { data } = await client.query({
        query: query_scGetProductVariants,
        variables: {
            variant_ids: ids
        },
        fetchPolicy: "network-only",
    });
    return data?.scGetProductVariants?.variants || {};
}

const ProductReserveCreate = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();

    const [showConfirmBack, setShowConfirmBack] = useState(false);
    const [showAddVariant, setShowAddVariant] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [variantsReserve, setVariantsReserve] = useState([]);
    const [currentSmeVariantId, setCurrentSmeVariantId] = useState(null);
    const [currentDataErrors, setCurrentDataErrors] = useState(null);
    const [smeWarehousesFilter, setSmeWarehousesFilter] = useState([])
    const [scVariants, setScVariants] = useState([])

    const [initialValues, setInitialValues] = useState({
        ['__changed__']: false
    });
    const [validateSchema, setValidateSchema] = useState({
        name: Yup.string()
            .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: "Tên phiếu dự trữ" }).toLowerCase() }))
            .max(35, formatMessage({ defaultMessage: "{name} tối đa {length} ký tự" }, { length: 35, name: formatMessage({ defaultMessage: "Tên phiếu dự trữ" }) }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Tên phiếu dự trữ không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return false;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Tên phiếu dự trữ không được chứa 2 dấu cách liên tiếp' }),
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
                then: Yup.string().oneOf([`name`], formatMessage({ defaultMessage: 'Tên phiếu dự trữ đã tồn tại' }))
            }),
        [`name_boolean`]: Yup.object().notRequired(),

    });

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo dự trữ' }) },
        ])
    }, []);

    const { data: dataSmeWarehouses } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [userCreateReserveTicket, { loading: loadingUserCreateReserveTicket }] = useMutation(mutate_userCreateReserveTicket, {
        awaitRefetchQueries: true,
    });

    const optionsStore = useMemo(() => {
        const stores = dataStores?.sc_stores?.map(store => {
            let findedChannel = dataStores?.op_connector_channels?.find(_ccc => _ccc.code == store.connector_channel_code);

            return {
                label: store?.name,
                value: store?.id,
                logo: findedChannel?.logo_asset_url
            };
        });

        return stores;
    }, [dataStores]);

    useMemo(async () => {
        if (!history?.location?.state?.id) return;

        const { data } = await client.query({
            query: query_warehouse_reserve_ticket_items,
            variables: {
                limit: 1000,
                offset: 0,
                where: {
                    warehouse_reserve_ticket_id: { _eq: history?.location?.state?.id }
                }
            },
            fetchPolicy: 'network-only'
        }).then(async (data) =>  {
            const listIds = data?.data?.warehouse_reserve_ticket_items?.map(item => item?.sc_variant_id)
            const listScVariants = await queryGetScVariantsByIds(listIds)
            setScVariants(listScVariants)
            return data
        })
        
        if (!data || data?.warehouse_reserve_ticket_items?.length == 0) return;

        let valuesQuantity = {};
        const groupReserveTicketItems = groupBy(data?.warehouse_reserve_ticket_items, 'sc_variant_id');
        const formartNewReserve = Object.keys(groupReserveTicketItems)?.map(item => {
            const { is_combo, product_id, variant, warehouse_reserve_ticket, sc_variant_id } = groupReserveTicketItems[item]?.[0] || {};

            (groupReserveTicketItems[item] || []).forEach(ticket => {
                valuesQuantity[`variant-${ticket?.variant_id}-${ticket?.warehouse_id}-quantity`] =  0;

                if (!!ticket?.is_combo) {
                    (ticket?.variant?.combo_items || []).forEach(item => {
                        valuesQuantity[`variant-${item?.combo_item?.id}-${ticket?.variant_id}-${ticket?.warehouse_id}-quantity`] = 0;
                    })
                }
            });

            const status_ticket_item = groupReserveTicketItems[item]?.some(ti => !!ti?.error_message) ? 'error' : 'success';
            const error_message_ticket_item = status_ticket_item == 'error' ? (groupReserveTicketItems[item]?.find(ti => !!ti?.error_message)?.error_message || '') : '';

            return {
                sc_variant_id,
                is_combo, product_id, warehouse_reserve_ticket,
                status_ticket_item,
                error_message_ticket_item,
                ...variant,
                warehouse_reserve: groupReserveTicketItems[item]?.map(wr => ({
                    warehouse_id: wr?.warehouse_id,
                    error_message: wr?.error_message,
                    status: wr?.status,
                    quantity: wr?.quantity,
                    ...(wr?.warehouse_reserve_ticket || {})
                }))
            }
        });

        setInitialValues(prev => {
            const ticket = formartNewReserve[0]?.warehouse_reserve_ticket || {};

            return {
                ...prev,
                ...valuesQuantity,
                store: optionsStore?.find(store => store?.value == ticket?.sc_store_id),
            }
        })
        setVariantsReserve(formartNewReserve);
    }, [history?.location?.state, optionsStore]);

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Tạo dự trữ" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Tạo dự trữ" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Tạo dự trữ" }) + " - UpBase"} />
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
                    console.log(values?.start_date_campaign)
                    return (
                        <Fragment>
                            {showConfirmBack && <ModalConfirm
                                show={showConfirmBack}
                                title={formatMessage({ defaultMessage: 'Phiếu dự trữ sẽ không được lưu lại. Bạn có đồng ý huỷ ?' })}
                                onConfirm={() => history.push(`/products/reserve`)}
                                onHide={() => setShowConfirmBack(false)}
                            />}
                            {!!currentDataErrors && <ModalAlert
                                dataErrors={currentDataErrors.map(item => {
                                    if(item?.status_ticket_item == 'pending') {
                                        return item
                                    } else {
                                        const scVariant = scVariants?.find(variant => variant?.id == item?.sc_variant_id)
                                        return {
                                            ...scVariant,
                                            sme_sku: item?.sku
                                        }
                                    }
                                })}
                                onHide={() => setCurrentDataErrors(null)}
                            />}
                            {showAddVariant && <ModalAddVariants
                                show={showAddVariant}
                                variantsReserve={variantsReserve}
                                onAddVariantsReserve={(variantsAdd) => {
                                    const newVariantAdd = variantsAdd?.map(item => {
                                        return {
                                            ...item, 
                                            status_ticket_item: 'pending'
                                        }
                                    })
                                    newVariantAdd.forEach(variant => {
                                        (dataSmeWarehouses?.sme_warehouses || []).forEach(warehouse => {
                                            setFieldValue(`variant-${variant?.id}-${warehouse?.id}-quantity`, 0);
                                        })
                                    });
                                    setVariantsReserve(prev => prev.concat(newVariantAdd))
                                }}
                                onHide={() => setShowAddVariant(false)}
                            />}
                            {showWarning && <ModalWarning
                                show={showWarning}
                                onHide={() => setShowWarning(false)}
                            />}
                            {!!currentSmeVariantId && <ModalInfoVariant
                                optionsStore={optionsStore}
                                smeVariantId={currentSmeVariantId}
                                onHide={() => setCurrentSmeVariantId(null)}
                            />}
                            <LoadingDialog show={loadingUserCreateReserveTicket} />
                            <InfoReserve
                                optionsStore={optionsStore}
                                onClearVariants={() => setVariantsReserve([])}
                            />
                            <div className='d-flex align-items-center mb-6'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger bi bi-exclamation-triangle" viewBox="0 0 16 16">
                                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z" />
                                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z" />
                                </svg>
                                <span className='ml-2 text-danger'>
                                    {formatMessage({ defaultMessage: 'Hệ thống sẽ bắt đầu dự trữ tồn ngay sau khi tạo phiếu dự trữ thành công.' })}
                                </span>
                            </div>
                            <VariantReserve
                                scVariants={scVariants}
                                onShowModalAddVariant={() => setShowAddVariant(true)}
                                onShowModalWarning={() => setShowWarning(true)}
                                onRemoveVariant={(variantId) => setVariantsReserve(prev => prev.filter(item => item?.id != variantId))}
                                variantsReserve={variantsReserve}
                                dataSmeWarehouses={dataSmeWarehouses}
                                onShowModalVariant={smeVariantId => setCurrentSmeVariantId(smeVariantId)}
                                smeWarehousesFilter={smeWarehousesFilter}
                                setSmeWarehousesFilter={setSmeWarehousesFilter}
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
                                    disabled={variantsReserve?.length == 0}
                                    onClick={async () => {
                                        try {
                                            let error = await validateForm(values);

                                            if (Object.values(error).length > 0) {
                                                handleSubmit();
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }
                                            
                                            if (!values?.store?.value) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (!values?.end_date) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn thời gian kết thúc' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (!values?.start_date_campaign) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn thời gian kết thúc CTKM' }), { appearance: 'error' })
                                                return;
                                            }
                                            if (dayjs(new Date()).unix() > values?.start_date_campaign || values?.start_date_campaign> values?.end_date) {
                                                addToast(formatMessage({ defaultMessage: 'Thời gian không hợp lệ' }), { appearance: 'error' })
                                                return;
                                            }

                                            const dataErrors = variantsReserve?.filter(variant => {
                                                return sum(dataSmeWarehouses?.sme_warehouses?.map(warehouse =>
                                                    values[`variant-${variant?.id}-${warehouse?.id}-quantity`]
                                                )) == 0;
                                            });
                                            console.log(dataErrors)
                                            if (smeWarehousesFilter?.length == 0) {
                                                addToast(formatMessage({defaultMessage: "Gian hàng không liên kết kho"}), {appearance: 'error'})
                                                return;
                                            }

                                            if (dataErrors?.length > 0) {
                                                setCurrentDataErrors(dataErrors)
                                                return;
                                            }
                                            console.log(variantsReserve)
                                            const bodyUserCreateReserveTicket = {
                                                name: values?.name,
                                                end_date: values?.end_date,
                                                start_date: values?.start_date_campaign,
                                                sc_store_id: values?.store?.value,
                                                products: variantsReserve?.map(variant => {
                                                    return smeWarehousesFilter?.map(warehouse => ({
                                                        variant_id: variant?.__typename == 'ProductVariant' ? variant?.sme_product_variant_id : variant?.id,
                                                        sc_variant_id: variant?.__typename == 'ProductVariant' ? variant?.id : variant?.sc_variant_id,
                                                        warehouse_id: warehouse?.id,
                                                        quantity: values[`variant-${variant?.id}-${warehouse?.id}-quantity`],
                                                    }))
                                                }).flat()
                                            };

                                            const { data } = await userCreateReserveTicket({
                                                variables: {
                                                    userCreateReserveTicketInput: bodyUserCreateReserveTicket
                                                }
                                            });

                                            if (!!data?.userCreateReserveTicket?.success) {
                                                addToast(formatMessage({ defaultMessage: 'Thêm dự trữ thành công' }), { appearance: "success" });
                                            } else {
                                                addToast(formatMessage({ defaultMessage: 'Thêm dự trữ thất bại' }), { appearance: "error" });
                                            }
                                            history.push('/products/reserve');
                                        } catch (err) {
                                            addToast(formatMessage({ defaultMessage: 'Thêm dự trữ thất bại' }), { appearance: "error" });
                                            history.push('/products/reserve');
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tạo dự trữ' })}
                                </button>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

export default memo(ProductReserveCreate);
