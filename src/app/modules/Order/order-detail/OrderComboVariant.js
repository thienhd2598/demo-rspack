import { gql, useMutation, useQuery } from '@apollo/client';
import React, { memo, useMemo, useCallback, Fragment } from 'react';
import query_sme_catalog_product_variant_by_pk from '../../../../graphql/query_sme_catalog_product_variant_by_pk';
import InfoProduct from '../../../../components/InfoProduct';
import WarningTwoToneIcon from "@material-ui/icons/WarningTwoTone";
import CheckCircleOutlineTwoToneIcon from '@material-ui/icons/CheckCircleOutlineTwoTone';
import { useToasts } from 'react-toast-notifications';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import mutate_coRetryWarehouseComboAction from '../../../../graphql/mutate_coRetryWarehouseComboAction';
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const [STEP_ALLOCATED, STEP_EXPORT_WAREHOUSE] = [1, 2];

const OrderComboVariant = ({ 
     sme_variant_id, key, 
    combo, order_item_id, provider,disabledAction,
    onChangeConnect, isOldOrder, smeWarehouseOrder, 
    isOrderManual,
    is_gift }) => {

    const { addToast } = useToasts();
    const { formatMessage } = useIntl()
    const { loading: loadingSmeProductVariant, data: dataSmeProductVariant, } = useQuery(query_sme_catalog_product_variant_by_pk, {
        variables: { id: sme_variant_id },
        fetchPolicy: "network-only",
        skip: !sme_variant_id
    });
    const linkProduct = useMemo(() => {
            if (dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0) {
                return `/products/stocks/detail/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.id}`
            } else {
                return `/products/edit/${dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product?.id}`
            }
        }, [dataSmeProductVariant]
    );

    const [retryWarehouseCombo, { loading: loadingRetryWarehouseCombo }] = useMutation(mutate_coRetryWarehouseComboAction, {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail']
    });

    const orderSteps = useMemo(() => {
            const stepOrder = Number(combo?.warehouse_step);
            // Step 1
            if (stepOrder == STEP_ALLOCATED) {
                if (combo?.warehouse_error_code === "E000") {
                    return [{
                        id: 1,
                        name: formatMessage({ defaultMessage: 'Tạm giữ' }),
                        isError: false,
                        mssError: null
                    }];
                } else {
                    return [{
                        id: 1,
                        name: formatMessage({ defaultMessage: 'Tạm giữ' }),
                        isError: true,
                        mssError: combo?.warehouse_error_message
                    }];
                }
            }

            // Step 2
            if (stepOrder == STEP_EXPORT_WAREHOUSE) {
                if (combo?.warehouse_error_code === "E000") {
                    return [
                        { id: 1, name: formatMessage({ defaultMessage: 'Tạm giữ' }), isError: false, mssError: null },
                        { id: 2, name: formatMessage({ defaultMessage: 'Xuất kho' }), isError: false, mssError: null },
                    ];
                } else {
                    return [
                        { id: 1, name: formatMessage({ defaultMessage: 'Tạm giữ' }), isError: false, mssError: null },
                        { id: 2, name: formatMessage({ defaultMessage: 'Xuất kho' }), isError: true, mssError: combo?.warehouse_error_message },
                    ];
                }
            }

            // Step > 2
            if (!!stepOrder && stepOrder != STEP_EXPORT_WAREHOUSE && stepOrder != STEP_ALLOCATED) {
                return [
                    { id: 1, name: 'Tạm giữ', isError: false, mssError: null },
                    { id: 2, name: 'Xuất kho', isError: false, mssError: null },
                ];
            }
        }, [combo]
    );

    const onRetryWarehouse = useCallback(
        async () => {
            try {
                const { data } = await retryWarehouseCombo({
                    variables: {
                        combo_item_id: combo?.id,
                    }
                });

                if (!!data?.coRetryWarehouseComboAction.success) {
                    addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thành công" }), { appearance: "success" });
                } else {
                    addToast(`${data?.coRetryWarehouseComboAction?.message || formatMessage({ defaultMessage: 'Load lại dữ liệu thất bại' })}`, { appearance: "error" });
                }
            } catch (err) {
                addToast(formatMessage({ defaultMessage: "Load lại dữ liệu thất bại" }), { appearance: "error" });
            }
        }, [combo]
    );

    return (
        <tr key={key}>
            <td className='d-flex' style={{ border: 'none' }}>
                {loadingSmeProductVariant ? (
                    <span className='spinner spinner-primary' />
                ) : (
                    <>
                        <div
                            style={{
                                backgroundColor: "#F7F7FA",
                                width: 64,
                                height: 64,
                                borderRadius: 8,
                                overflow: "hidden",
                                minWidth: 64,
                                cursor: "pointer",
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                window.open(linkProduct, "_blank");
                            }}
                            className="mr-6"
                        >
                            {!!dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets?.[0]?.asset_url ? (
                                <img src={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sme_catalog_product_variant_assets?.[0]?.asset_url} style={{ width: 64, height: 64, objectFit: "contain" }}/>
                            ) : null}
                        </div>
                        <div className='d-flex flex-column'>
                            <div className="d-flex">
                                <InfoProduct name={''} sku={dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sku}/>
                            </div>
                            {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.attributes?.length > 0 && (
                                <span className="font-weight-normal my-1 text-secondary-custom fs-12">
                                    {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.name?.replaceAll(" + ", " - ")}
                                </span>
                            )}
                            <span className="font-weight-normal text-secondary-custom fs-12">
                                {formatMessage({ defaultMessage: 'Sẵn sàng bán' })}:{" "}
                                {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.inventories?.find(iv => iv?.sme_store_id == smeWarehouseOrder?.id)?.stock_available}
                            </span>
                        </div>
                    </>
                )}
            </td>
            <td className='text-center' style={{ verticalAlign: 'top', borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}>
                {dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.unit || '--'}
            </td>
            <td className='text-center' style={{ verticalAlign: 'top', borderTop: 'none', borderBottom: 'none', borderRight: '0.5px solid #cbced4' }}>
                {combo?.purchased_quantity || 0}
            </td>
            <>
            {!provider && (
                <td style={{ verticalAlign: 'top', borderTop: 'none', borderBottom: 'none', borderRight: '0.5px solid #cbced4' }}>
                <div className="d-flex flex-column align-items-center">
                    <ul className='order-step-wrapper'>
                        {orderSteps?.map(_order => {
                            const isActivePoint = _order?.id == 2 || (_order?.id == 1 && _order?.isError)
                            return (
                                <li className={`order-step ${isActivePoint ? 'active' : ''}`} key={`order-step-${_order?.id}`}>
                                    <div className='order-step-block d-flex flex-column gap-4'>
                                        <div className="d-flex align-items-center">
                                            <span className='order-step-title'>{`${_order?.name}: ${_order?.isError ? 0 : combo?.purchased_quantity}`}</span>
                                            {_order?.isError ? <OverlayTrigger
                                                overlay={
                                                    <Tooltip>
                                                        <span>{_order?.mssError}</span>
                                                    </Tooltip>
                                                }
                                            >
                                                <WarningTwoToneIcon
                                                    className="ml-2"
                                                    style={{ color: "#ff5629" }}
                                                />
                                            </OverlayTrigger> : <CheckCircleOutlineTwoToneIcon
                                                className="ml-2"
                                                style={{ color: "#00e676" }}
                                            />}
                                        </div>
                                        {!!_order?.isError && !isOldOrder && (
                                            <>
                                                {loadingRetryWarehouseCombo && <span className="spinner spinner-primary mt-4" />}
                                                {!loadingRetryWarehouseCombo && (
                                                    <span
                                                        className="text-primary mt-2"
                                                        onClick={onRetryWarehouse}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        {formatMessage({ defaultMessage: 'Thử lại' })}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </td>  
            )}
            {/* [Note 29/07]: Bỏ action https://jira.upbase.vn/browse/UT02-484 */}
            {/* <AuthorizationWrapper keys={['order_detail_product_connect_to_order']}> 
                {!isOrderManual && !is_gift && <td className='text-center' style={{ verticalAlign: 'top', borderTop: 'none', borderBottom: 'none', borderRight: 'none' }}>
                    {<a
                        style={{
                            fontSize: 14,
                            color: "#ff5629",
                            cursor: disabledAction ? "not-allowed" : "pointer",
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            if (disabledAction) return;

                            onChangeConnect(dataSmeProductVariant?.sme_catalog_product_variant_by_pk?.sku, order_item_id)
                        }}
                    >
                        {formatMessage({ defaultMessage: 'Đổi liên kết' })}
                    </a>}
                </td>}
            </AuthorizationWrapper> */}
            </>
                  
        </tr>
    )
};

export default memo(OrderComboVariant);