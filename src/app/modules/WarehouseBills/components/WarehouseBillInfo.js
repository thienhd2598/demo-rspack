import React, { memo, useMemo } from 'react';
import { Card, CardBody, CardHeader, InputVertical, TextArea } from '../../../../_metronic/_partials/controls';
import { Field, useFormikContext } from 'formik';
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { useIntl } from 'react-intl';
import DatePicker from 'rsuite/DatePicker';

const WarehouseBillInfo = ({ type, status, order_code, order_id, product_type }) => {
    const { formatMessage } = useIntl();
    const {values} = useFormikContext()
    const [statusTitle, statusColor] = useMemo(() => {
        let title = formatMessage({ defaultMessage: 'Đã hủy' })
        if (status == 'complete') {
            title = type == 'in' ? formatMessage({ defaultMessage: 'Đã nhập' }) : formatMessage({ defaultMessage: 'Đã duyệt' })
        } else if (status == 'new') {
            title = formatMessage({ defaultMessage: 'Chờ duyệt' })
        } else if (status == 'waiting') {
            title = formatMessage({ defaultMessage: 'Chờ nhập' })
        }
        return [
            title,
            status == 'new' ||status == 'cancel' || status == 'waiting' ? '#888484' : '#ff5629',
        ]
    }, [status]);

    return (
        <Card>
            <CardHeader
                title={
                    <span>
                        {type == 'in'
                            ? formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU NHẬP KHO' })
                            : formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU XUẤT KHO' })}
                        &ensp;&ensp;<span style={{ color: statusColor, fontWeight: 'bold', fontSize: 10 }}>{statusTitle}</span></span>
                }
            />
            <CardBody className='px-15 py-5'>
                <div className='row d-flex justify-content-between'>
                    <div className={`col-md-5`}>
                        <Field
                            name="warehouseId"
                            component={ReSelectVertical}
                            onChange={() => { }}
                            required
                            isDisabled={true}
                            placeholder=""
                            label={formatMessage({ defaultMessage: 'Kho' })}
                            customFeedbackLabel={' '}
                            options={[]}
                        />
                    </div>
                    <div className={`col-md-5`} >
                        <Field
                            name="code"
                            component={InputVertical}
                            placeholder=""
                            disabled={true}
                            onChange={() => { }}
                            label={type == 'in' ? formatMessage({ defaultMessage: 'Mã phiếu nhập kho' }) : formatMessage({ defaultMessage: 'Mã phiếu xuất kho' })}
                            customFeedbackLabel={' '}
                        />
                    </div>
                    <div className={`col-md-5`} >
                        <Field
                            name="protocol"
                            required
                            component={ReSelectVertical}
                            onChange={() => { }}
                            placeholder=""
                            label={type == 'in' ? formatMessage({ defaultMessage: 'Hình thức nhập kho' }) : formatMessage({ defaultMessage: 'Hình thức xuất kho' })}
                            customFeedbackLabel={' '}
                            isDisabled={true}
                            options={[]}
                            isClearable={false}
                        />
                        {order_code && (
                            <div className='mt-4'>
                                <span>{formatMessage({ defaultMessage: 'Mã đơn hàng' })}</span>: <a href={`/orders/${order_id}`} style={{ textDecoration: 'underline' }}>{order_code}</a>
                            </div>
                        )}
                    </div>
                    <div className={`col-md-5`}>
                        <Field
                            name="productType"
                            component={ReSelectVertical}
                            onChange={() => { }}
                            required
                            isDisabled={true}
                            placeholder=""
                            label={formatMessage({ defaultMessage: 'Loại sản phẩm' })}
                            customFeedbackLabel={' '}
                            options={[]}
                        />
                    </div>
                    <div className={`col-md-5`} >
                        <Field
                            name="note"
                            component={TextArea}
                            placeholder={formatMessage({ defaultMessage: 'Nhập ghi chú' })}
                            label={formatMessage({ defaultMessage: 'Ghi chú' })}
                            required={false}
                            disabled={true}
                            customFeedbackLabel={' '}
                            cols={['col-3', 'col-12']}
                            countChar
                            rows={4}
                            maxChar={'255'}
                        />
                    </div>

                    {type == 'in' && <div className={`col-md-5`} >
                        <p>Thời gian nhận hàng dự kiến</p>
                        <DatePicker 
                            format={"dd/MM/yyyy hh:00"}
                            placeholder="Chọn thời gian nhận hàng dự kiến"
                            value={values[`expectReceiveTime`] ? new Date(values[`expectReceiveTime`]*1000): null}
                            className="w-100"
                            disabled={true}
                        />
                    </div>}
                </div>
            </CardBody>
        </Card >
    )
};

export default memo(WarehouseBillInfo);