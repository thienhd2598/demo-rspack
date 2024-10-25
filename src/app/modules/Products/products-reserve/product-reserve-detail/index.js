import React, { memo, useMemo, useCallback, useState, useLayoutEffect, Fragment, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useSubheader } from '../../../../../_metronic/layout';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import { Card, CardBody } from '../../../../../_metronic/_partials/controls';
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { Formik } from "formik";
import * as Yup from "yup";
import InfoReserve from './InfoReserve';
import queryString from "querystring";
import VariantReserve from './VariantReserve';
import ModalAddVariants from '../dialogs/ModalAddVariants';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import ModalInfoVariant from '../dialogs/ModalInfoVariant';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import ModalConfigReserve from '../dialogs/ModalConfigReserve';
import query_warehouse_reserve_ticket_items from '../../../../../graphql/query_warehouse_reserve_ticket_items';
import dayjs from 'dayjs';
import mutate_userFinishReserveTicket from '../../../../../graphql/mutate_userFinishReserveTicket';
import { ProductsReserveDetailProvider } from './ProductReserveDetailContext';
import mutate_userReverseAddItem from "../../../../../graphql/mutate_userReserveAddItem";
import query_scGetProductVariants from '../../../../../graphql/query_scGetProductVariants';
import { createApolloClientSSR } from '../../../../../apollo';
import ModalAlert from '../dialogs/ModalAlert';
import ModalWarning from '../dialogs/ModalWarning';
import { groupBy, sum } from 'lodash';
import ModalError from '../dialogs/ModalError';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';
import query_warehouse_reserve_tickets from '../../../../../graphql/query_warehouse_reserve_tickets';

let client = createApolloClientSSR()

const LIMIT_RESERVE_TICKET_ITEMS = 1000;
const PAGE_RESERVE_TICKET_ITEMS = 1;

const queryGetScVariantsByIds = async (ids) => {
    if (ids?.length == 0) return [];
  
    const { data } = await client.query({
        query: query_scGetProductVariants,
        variables: {
            variant_ids: ids
        },
        fetchPolicy: "network-only",
    });
    return data || {};
}

const ProductReserveDetail = () => {
    const { formatMessage } = useIntl();
    const refArea = useRef(null);
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const { id } = useParams();

    const [showAddVariant, setShowAddVariant] = useState(false);
    const [variantsReserve, setVariantsReserve] = useState([]);
    const [currentSmeVariantId, setCurrentSmeVariantId] = useState(null);
    const [scVariants, setScVariants] = useState([])
    const [currentDataErrors, setCurrentDataErrors] = useState(null);
    const [currentStatus, setCurrentStatus] = useState('success');
    const [showWarning, setShowWarning] = useState(false);
    const [errorItems, setErrorItems] = useState([])
    const [smeWarehousesFilter, setSmeWarehousesFilter] = useState([])

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
            ),

    });

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tồn dự trữ' }) },
        ])
    }, []);

    const { data: dataReserveTicketItems, loading: loadingReserveTicketItems } = useQuery(query_warehouse_reserve_ticket_items, {
        variables: {
            limit: LIMIT_RESERVE_TICKET_ITEMS,
            offset: (PAGE_RESERVE_TICKET_ITEMS - 1) * LIMIT_RESERVE_TICKET_ITEMS,
            where: {
                warehouse_reserve_ticket_id: { _eq: id },
                parrent_variant_id: {_is_null: true}
            }
        },
        onCompleted: async (data) =>  {
           const listIds = data?.warehouse_reserve_ticket_items?.map(item => item?.sc_variant_id)
           const listScVariants = await queryGetScVariantsByIds(listIds)
           setScVariants(listScVariants)
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataTicket } = useQuery(query_warehouse_reserve_tickets, {
        variables: {
            limit: 1,
            offset: 0,
            where:  {id: {_eq: id}}
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log(dataTicket)

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataSmeWarehouses } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    });

    const [userFinishReserveTicket, { loading: loadingUserFinishReserveTicket }] = useMutation(mutate_userFinishReserveTicket, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_ticket_items'],
    });

    const [userReserveAddItem, { loading: loadingUserReverseAddItem }] = useMutation(mutate_userReverseAddItem, {
        awaitRefetchQueries: true,
        refetchQueries: ['warehouse_reserve_ticket_items']
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

    useMemo(() => {
        if (!dataTicket || dataTicket?.warehouse_reserve_tickets?.length == 0) return;

        let valuesQuantity = {};
        const groupReserveTicketItems = groupBy(dataReserveTicketItems?.warehouse_reserve_ticket_items, 'sc_variant_id');
        const formartNewReserve = Object.keys(groupReserveTicketItems)?.map(item => {
            const { id, is_combo, product_id, variant, warehouse_reserve_ticket, sc_variant_id } = groupReserveTicketItems[item]?.[0] || {};
            (groupReserveTicketItems[item] || []).forEach(ticket => {
                const reserveWarehouse = ticket?.variant?.inventories?.find(iv => iv?.sme_store_id == ticket?.warehouse_id)?.stock_reserve;

                valuesQuantity[`variant-${ticket?.sc_variant_id}-${ticket?.warehouse_id}-quantity`] = ticket?.quantity || 0;
                valuesQuantity[`variant-${ticket?.sc_variant_id}-${ticket?.warehouse_id}-reserve`] = reserveWarehouse || 0;

                if (!!ticket?.is_combo) {
                    (ticket?.variant?.combo_items || []).forEach(item => {
                        const reserveWarehouseComboItem = item?.combo_item?.inventories?.find(iv => iv?.sme_store_id == ticket?.warehouse_id)?.stock_reserve;

                        valuesQuantity[`variant-${item?.combo_item?.id}-${ticket?.warehouse_id}-reserve`] = reserveWarehouseComboItem || 0;
                        valuesQuantity[`variant-${item?.combo_item?.id}-${ticket?.variant_id}-${ticket?.warehouse_id}-quantity`] = ticket?.quantity * item?.quantity;
                    })
                }
            });

            const status_ticket_item = groupReserveTicketItems[item]?.some(ti => !!ti?.error_message) ? 'error' : 'success';
            const error_message_ticket_item = status_ticket_item == 'error' ? (groupReserveTicketItems[item]?.find(ti => !!ti?.error_message)?.error_message || '') : '';
            return {
                is_combo, product_id, warehouse_reserve_ticket,
                status_ticket_item,
                error_message_ticket_item,
                sc_variant_id,
                ...variant,
                reserve_item_id: id,
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
            return {
                ...prev,
                ...valuesQuantity,
                id: dataTicket?.warehouse_reserve_tickets?.[0]?.id,
                name: dataTicket?.warehouse_reserve_tickets?.[0]?.name,
                status: dataTicket?.warehouse_reserve_tickets?.[0]?.status,
                store: optionsStore?.find(store => store?.value == dataTicket?.warehouse_reserve_tickets?.[0]?.sc_store_id),
                created_at: dayjs(dataTicket?.warehouse_reserve_tickets?.[0]?.created_at).unix(),
                start_date: dataTicket?.warehouse_reserve_tickets?.[0]?.start_date,
                end_date: dataTicket?.warehouse_reserve_tickets?.[0]?.end_date
            }
        })
        setVariantsReserve(formartNewReserve);
    }, [dataReserveTicketItems, optionsStore, dataTicket]);
    return (
        <Fragment>
            <ProductsReserveDetailProvider>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Tồn dự trữ" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Tồn dự trữ" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Tồn dự trữ" }) + " - UpBase"} />
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
                                    setCurrentStatus('pending')
                                    setVariantsReserve(prev => prev.concat(newVariantAdd))
                                }}
                                onHide={() => setShowAddVariant(false)}
                            />}
                            {!!errorItems?.length && <ModalError 
                                dataErrors={errorItems}
                                onHide={() => setErrorItems([])}
                            />}
                            {showWarning && <ModalWarning
                                show={showWarning}
                                onHide={() => setShowWarning(false)}
                            />}
                            {!!currentDataErrors && <ModalAlert
                                dataErrors={currentDataErrors}
                                onHide={() => setCurrentDataErrors(null)}
                            />}
                            {!!currentSmeVariantId && <ModalInfoVariant
                                optionsStore={optionsStore}
                                smeVariantId={currentSmeVariantId}
                                onHide={() => setCurrentSmeVariantId(null)}
                            />}
                            <LoadingDialog show={loadingUserFinishReserveTicket} />
                            <InfoReserve
                                loadingReserveTicketItems={loadingReserveTicketItems}
                                optionsStore={optionsStore}
                            />
                            <VariantReserve
                                id={id}
                                currentStatus={currentStatus}
                                setCurrentStatus={setCurrentStatus}
                                scVariants={scVariants?.scGetProductVariants?.variants}
                                onShowModalAddVariant={() => setShowAddVariant(true)}
                                onShowModalWarning={() => setShowWarning(true)}
                                onRemoveVariant={(variantId) => setVariantsReserve(prev => prev.filter(item => item?.id != variantId))}
                                variantsReserve={variantsReserve}
                                loadingReserveTicketItems={loadingReserveTicketItems}
                                onShowModalVariant={smeVariantId => setCurrentSmeVariantId(smeVariantId)}
                                smeWarehousesFilter={smeWarehousesFilter}
                                setSmeWarehousesFilter={setSmeWarehousesFilter}
                            />
                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    className="btn btn-secondary"
                                    role="button"
                                    type="submit"
                                    style={{ width: 150 }}
                                    onClick={() => {
                                        history.push('/products/reserve');
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Quay lại' })}
                                </button>
                                <AuthorizationWrapper keys={['product_reserve_finish']}>
                                    {values?.status == 'processing' && (
                                        <button
                                            className="btn btn-primary ml-2"
                                            type="submit"
                                            style={{ width: 150, cursor: false ? 'not-allowed' : 'pointer' }}
                                            disabled={false}
                                            onClick={async () => {
                                                try {
                                                    let error = await validateForm(values);

                                                    if (Object.values(error).length > 0) {
                                                        handleSubmit();
                                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                        return;
                                                    }

                                                    const { data } = await userFinishReserveTicket({
                                                        variables: {
                                                            ids: [values?.id]
                                                        }
                                                    });

                                                    if (!!data?.userFinishReserveTicket?.[0]?.success) {
                                                        addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thành công' }), { appearance: "success" });
                                                    } else {
                                                        addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thất bại' }), { appearance: "error" });
                                                    }
                                                } catch (err) {
                                                    addToast(formatMessage({ defaultMessage: 'Dừng dự trữ thất bại' }), { appearance: "error" });
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Kết thúc' })}
                                        </button>
                                    )}
                                </AuthorizationWrapper>
                                <AuthorizationWrapper keys={['product_reserve_action']}>
                                    {values?.status == 'processing' && <button
                                        className="btn btn-primary ml-2"
                                        type="submit"
                                        style={{ width: 150, cursor: false ? 'not-allowed' : 'pointer' }}
                                        disabled={false}
                                        onClick={async () => {
                                            try {
                                                let error = await validateForm(values);
                                                if (Object.values(error).length > 0) {
                                                    handleSubmit();
                                                    addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                    return;
                                                }
                                                const dataErrors = variantsReserve?.filter(item => item?.status_ticket_item == 'pending' )?.filter(variant => {
                                                    return sum(dataSmeWarehouses?.sme_warehouses?.map(warehouse => {
                                                        return values[`variant-${variant?.id}-${warehouse?.id}-quantity`]
                                                })) == 0;
                                                });

                                                if (dataErrors?.length > 0) {
                                                    setCurrentDataErrors(dataErrors)
                                                    return;
                                                }

                                                const newVariantReserve = variantsReserve?.filter(item => item?.status_ticket_item == 'pending')
                                                const reserveItems = newVariantReserve?.map(variant => {
                                                    return smeWarehousesFilter?.map(warehouse => ({
                                                        variant_id: variant?.sme_product_variant_id,
                                                        sc_variant_id: variant?.id,
                                                        warehouse_id: warehouse?.id,
                                                        quantity: values[`variant-${variant?.id}-${warehouse?.id}-quantity`],
                                                    }))
                                                })?.flat()
                                                const {data} = await userReserveAddItem({
                                                    variables: {
                                                        ticket_id: +id,
                                                        reserve_items : reserveItems
                                                    }
                                                })
                                                if (!!data?.userReserveAddItem?.every(item => item?.success)) {
                                                    addToast(formatMessage({defaultMessage: "Thêm hàng hóa dự trữ thành công"}), {appearance: 'success'})
                                                } else {
                                                    const errorItem = data?.userReserveAddItem?.filter(item => !item?.success)?.map(item => {
                                                        const scVariant = variantsReserve?.find(_v => _v?.sc_variant_id == item?.sc_variant_id || _v?.id == item?.sc_variant_id)
                                                        const warehouse = smeWarehousesFilter?.find(wh => wh?.id == item?.warehouse_id)
                                                        return {
                                                            error_message: item?.error_message,
                                                            warehouse: warehouse,
                                                            ...scVariant
                                                        }
                                                    })
                                                    setErrorItems(errorItem)
                                                }
                                            } catch (err) {
                                                addToast(formatMessage({ defaultMessage: 'Cập nhật dự trữ thất bại' }), { appearance: "error" });
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Cập nhật' })}
                                    </button>}
                                </AuthorizationWrapper>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik>
            </ProductsReserveDetailProvider>
        </Fragment>
    )
}

export default memo(ProductReserveDetail);

export const actionKeys = {
    "product_reserve_detail": {
        router: '/products/reserve/:id',
        actions: [
            "sc_stores", "op_connector_channels", "sme_warehouses",
            "warehouse_reserve_ticket_items", "warehouse_reserve_ticket_items_aggregate", "sme_catalog_product_variant", "sme_catalog_product_variant_aggregate",
            "scGetWarehouseMapping",
            "scGetProductVariants",
            "sme_catalog_product_tags"
        ], 
        name: "Chi tiết phiếu dự trữ",
        group_code: 'product_reserve',
        group_name: 'Dự trữ',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "product_reserve_finish": {
        router: '/products/reserve/:id',
        actions: [
            "warehouse_reserve_ticket_items",
            "userFinishReserveTicket"
        ], 
        name: "Kết thúc phiếu dự trữ",
        group_code: 'product_reserve',
        group_name: 'Dự trữ',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    }
};