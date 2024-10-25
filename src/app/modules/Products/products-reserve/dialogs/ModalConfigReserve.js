import React, { useMemo, useCallback, memo, useState } from 'react';
import { useIntl } from "react-intl";
import * as Yup from "yup";
import { Field, useFormikContext, Form, Formik } from "formik";
import { InputVertical } from '../../../../../_metronic/_partials/controls';
import { Modal } from 'react-bootstrap';
import Table from 'rc-table';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { sum } from 'lodash';
import InfoProduct from '../../../../../components/InfoProduct';
import ModalCombo from '../../products-list/dialog/ModalCombo';

const ModalConfigReserve = ({ currentSmeVariant, onHide, smeWarehouses, isReadOnly = false, currentComboId }) => {
    console.log(smeWarehouses)
    const { formatMessage } = useIntl();
    const { values: valuesProduct, setFieldValue } = useFormikContext();
    const [dataCombo, setDataCombo] = useState(null);

    const initialValues = useMemo(() => {
        const init = smeWarehouses?.reduce(
            (result, wh) => {
                const reserveWarehouse = currentSmeVariant?.inventories?.find(iv => iv?.sme_store_id == wh?.id)?.stock_reserve;

                result[`variant-${currentSmeVariant?.id}-${wh?.id}-reserve`] = reserveWarehouse || 0;
                result[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] = valuesProduct[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] || 0;
                return result;
            }, {}
        );

        return init;
    }, [smeWarehouses, valuesProduct, currentSmeVariant]);

    const validateSchema = useMemo(() => {
        return Yup.object().shape(smeWarehouses.reduce(
            (result, wh) => {
                let stockReady = 0;
                const ivWarehouse = currentSmeVariant?.inventories?.find(
                    iv => iv?.sme_store_id == wh?.id
                );
                if (!!currentSmeVariant?.is_combo) {
                    stockReady = Math.min(...currentSmeVariant?.combo_items?.map(item => {
                        const ivWarehouseComboItem = item?.combo_item?.inventories?.find(
                            iv => iv?.sme_store_id == wh?.id
                        );
                        const stockReadyComboItem = ivWarehouseComboItem?.stock_available;

                        return Math.floor(stockReadyComboItem / item?.quantity)
                    }))
                } else {
                    stockReady = ivWarehouse?.stock_available;
                }

                const isCheckStockReady = stockReady < 999999;

                result[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] = Yup.number()
                    .required(formatMessage({ defaultMessage: "Vui lòng nhập {name}" }, { name: formatMessage({ defaultMessage: 'số lượng dự trữ' }) }))
                    .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                    .max(
                        isCheckStockReady ? stockReady : 999999,
                        isCheckStockReady ? formatMessage({ defaultMessage: "Số lượng dự trữ phải nhỏ hơn hoặc bằng sẵn sàng bán" }, { min: 0, max: '999.999' }) : formatMessage({ defaultMessage: 'Số lượng sản phẩm tối đa {max}' }, { max: '999.999' })
                    )

                return result;
            }, {}
        ))
    }, [smeWarehouses, currentSmeVariant]);

    console.log({ currentSmeVariant, currentComboId })

    return (
        <Modal
            show={!!currentSmeVariant}
            size={currentSmeVariant?.is_combo && !isReadOnly ? 'xl' : ''}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={'body-dialog-connect modal-info-variant'}
            centered
            backdrop={true}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={validateSchema}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    validateForm
                }) => {
                    let total = 0;

                    if (isReadOnly) {
                        total = sum(smeWarehouses?.map(wh => values[`variant-${currentSmeVariant?.id}-${wh?.id}-reserve`] || 0));
                    } else {
                        if (!!currentComboId) {
                            total = sum(smeWarehouses?.map(wh => valuesProduct[`variant-${currentSmeVariant?.id}-${currentComboId}-${wh?.id}-quantity`] || 0));
                        } else {
                            total = sum(smeWarehouses?.map(wh => values[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] || 0));
                        }
                    }

                    const columns = [
                        {
                            title: formatMessage({ defaultMessage: 'Kho vật lý' }),
                            dataIndex: 'name',
                            key: 'name',
                            align: 'left',
                            width: currentSmeVariant?.is_combo ? '25%' : '35%',
                            render: (_item, record) => {
                                return (
                                    <span>{record?.name}</span>
                                )
                            }
                        },
                        (currentSmeVariant?.is_combo && !isReadOnly) ? {
                            title: formatMessage({ defaultMessage: 'SKU hàng hóa' }),
                            dataIndex: 'id',
                            key: 'id',
                            align: 'left',
                            width: '25%',
                            render: (_item, record) => {
                                return (
                                    <div className="d-flex flex-column">
                                        <div className='d-flex align-items-center'>
                                            <InfoProduct
                                                sku={currentSmeVariant?.sku}
                                                isSingle
                                            />
                                            {
                                                currentSmeVariant?.combo_items?.length > 0 && (
                                                    <span
                                                        className='text-primary cursor-pointer ml-2'
                                                        style={{ minWidth: 'fit-content' }}
                                                        onClick={() => setDataCombo(currentSmeVariant?.combo_items)}
                                                    >
                                                        Combo
                                                    </span>
                                                )
                                            }
                                        </div>
                                        {!!currentSmeVariant?.is_combo && (
                                            <div className="mt-6 d-flex flex-column" style={{ gap: 6 }}>
                                                {currentSmeVariant?.combo_items?.map(item => (
                                                    <div key={`sku-reserve-${item?.id}`} className='d-flex align-items-center'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1 bi bi-arrow-return-right" viewBox="0 0 16 16">
                                                            <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5z" />
                                                        </svg>
                                                        <InfoProduct
                                                            sku={item?.combo_item?.sku}
                                                            isSingle
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        } : null,
                        {
                            title: formatMessage({ defaultMessage: 'Sẵn sàng bán' }),
                            dataIndex: 'id',
                            key: 'id',
                            align: 'center',
                            width: currentSmeVariant?.is_combo ? '20%' : '25%',
                            render: (_item, record) => {
                                console.log(record)
                                const ivWarehouse = currentSmeVariant?.inventories?.find(
                                    iv => iv?.sme_store_id == record?.id
                                );
                                const stockReady = ivWarehouse?.stock_available;

                                if (currentSmeVariant?.is_combo && !isReadOnly) {
                                    const stockReadyCombo = Math.min(...currentSmeVariant?.combo_items?.map(item => {
                                        const ivWarehouseComboItem = item?.combo_item?.inventories?.find(
                                            iv => iv?.sme_store_id == record?.id
                                        );
                                        const stockReadyComboItem = ivWarehouseComboItem?.stock_available;

                                        return Math.floor(stockReadyComboItem / item?.quantity)
                                    }))

                                    return (
                                        <div className="d-flex flex-column">
                                            <span>{formatNumberToCurrency(stockReadyCombo)}</span>
                                            <div className="mt-6 d-flex flex-column" style={{ gap: 6 }}>
                                                {currentSmeVariant?.combo_items?.map(item => {
                                                    const ivWarehouseComboItem = item?.combo_item?.inventories?.find(
                                                        iv => iv?.sme_store_id == record?.id
                                                    );
                                                    const stockReadyComboItem = ivWarehouseComboItem?.stock_available;

                                                    return (
                                                        <span>{formatNumberToCurrency(stockReadyComboItem)}</span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <span>{formatNumberToCurrency(stockReady)}</span>
                                    )
                                }
                            }
                        },
                        {
                            title: isReadOnly ? formatMessage({ defaultMessage: 'Tồn dự trữ' }) : formatMessage({ defaultMessage: 'Số lượng dự trữ' }),
                            dataIndex: 'id',
                            key: 'id',
                            align: 'center',
                            width: currentSmeVariant?.is_combo ? '30%' : '40%',
                            render: (_item, record) => {
                                if (currentSmeVariant?.is_combo && !isReadOnly) {
                                    return (
                                        <div className="d-flex flex-column">
                                            <Field
                                                name={`variant-${currentSmeVariant?.id}-${record?.id}-quantity`}
                                                component={InputVertical}
                                                style={{ background: '#F7F7FA', border: 'none', textAlign: 'center' }}
                                                placeholder=""
                                                label={false}
                                                type='number'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                            />
                                            <div className="mt-4 d-flex flex-column" style={{ gap: 6 }}>
                                                {currentSmeVariant?.combo_items?.map(item => (
                                                    <span>{formatNumberToCurrency(values[`variant-${currentSmeVariant?.id}-${record?.id}-quantity`] * item?.quantity)}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                } else {
                                    return (
                                        <>
                                            {isReadOnly && !!currentComboId && <span className='text-center'>
                                                {formatNumberToCurrency(values[`variant-${currentSmeVariant?.sc_variant_id}-${record?.id}-reserve`])}
                                            </span>}
                                            {isReadOnly && !currentComboId && <span className='text-center'>
                                                {formatNumberToCurrency(valuesProduct[`variant-${currentSmeVariant?.sc_variant_id}-${record?.id}-reserve`])}
                                            </span>}
                                            {!isReadOnly && (
                                                <Field
                                                    name={`variant-${currentSmeVariant?.id}-${record?.id}-quantity`}
                                                    component={InputVertical}
                                                    style={{ background: '#F7F7FA', border: 'none', textAlign: 'center' }}
                                                    placeholder=""
                                                    label={false}
                                                    type='number'
                                                    customFeedbackLabel={' '}
                                                    absolute={true}
                                                />
                                            )}
                                        </>
                                    )
                                }
                            }
                        },
                    ];

                    const isDisabled = sum(smeWarehouses?.map(wh => values[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`])) == 0

                    return (
                        <Form>
                            {!!dataCombo && <ModalCombo
                                dataCombo={dataCombo}
                                onHide={() => setDataCombo(null)}
                            />}
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {isReadOnly ? formatMessage({ defaultMessage: 'Thông tin tồn dự trữ' }) : formatMessage({ defaultMessage: 'Thiết lập số lượng dự trữ' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                                <div style={{ padding: '0rem 1rem' }}>
                                    <div className="d-flex align-items-center mt-4 mb-2">
                                        <span style={{ width: '50%' }}>
                                            <div className='d-flex align-items-center'>
                                                <span>{formatMessage({ defaultMessage: 'Tổng {name} dự trữ: ' }, { name: isReadOnly ? 'tồn' : 'số lượng' })}</span>
                                                <span className='font-weight-bolder ml-1'>{formatNumberToCurrency(total)}</span>
                                            </div>
                                        </span>
                                        <span style={{ width: '50%' }}>
                                            {formatMessage({ defaultMessage: 'Mã SKU hàng hóa: {sku}' }, { sku: currentSmeVariant?.sme_sku || currentSmeVariant?.sku || '--' })}
                                            {
                                                currentSmeVariant?.combo_items?.length > 0 && isReadOnly && (
                                                    <span
                                                        className='text-primary cursor-pointer ml-2'
                                                        style={{ minWidth: 'fit-content' }}
                                                        onClick={() => setDataCombo(currentSmeVariant?.combo_items)}
                                                    >
                                                        Combo
                                                    </span>
                                                )
                                            }
                                        </span>
                                    </div>
                                    <Table
                                        className="upbase-table mb-4"
                                        columns={columns?.filter(cl => Boolean(cl))}
                                        data={smeWarehouses || []}
                                        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có kho vật lý nào' })}</span>
                                        </div>}
                                        tableLayout="auto"
                                        scroll={{ y: 450 }}
                                        sticky={{ offsetHeader: 0 }}
                                    />
                                </div>
                            </Modal.Body>
                            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                                {isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={onHide}
                                        className="btn btn-primary mr-2"
                                        style={{ width: 100 }}
                                    >
                                        {formatMessage({ defaultMessage: 'Đóng' })}
                                    </button>
                                )}
                                {!isReadOnly && (
                                    <div className="form-group">
                                        <button
                                            type="button"
                                            onClick={onHide}
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 100 }}
                                        >
                                            {formatMessage({ defaultMessage: 'Hủy' })}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={async () => {
                                                let error = await validateForm(values);
                                                const isErrorForm = Object.keys(error)?.length > 0;

                                                if (isErrorForm) {
                                                    handleSubmit();
                                                } else {
                                                    smeWarehouses.forEach(wh => {
                                                        if (currentSmeVariant?.is_combo) {
                                                            (currentSmeVariant?.combo_items || []).forEach(item => {
                                                                setFieldValue(
                                                                    `variant-${item?.combo_item?.id}-${currentSmeVariant?.id}-${wh?.id}-quantity`,
                                                                    values[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] * item?.quantity
                                                                );
                                                            });
                                                        };

                                                        setFieldValue(
                                                            `variant-${currentSmeVariant?.id}-${wh?.id}-quantity`,
                                                            values[`variant-${currentSmeVariant?.id}-${wh?.id}-quantity`] || 0
                                                        );
                                                    })
                                                    onHide();
                                                }
                                            }}
                                            className="btn btn-primary"
                                            style={{ width: 100 }}
                                        >
                                            {formatMessage({ defaultMessage: 'Đồng ý' })}
                                        </button>
                                    </div>
                                )}
                            </Modal.Footer>
                        </Form>
                    )
                }}
            </Formik>
        </Modal>
    )
};

export default memo(ModalConfigReserve);