import React, { memo, useMemo, useCallback, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Field } from "formik";
import { Switch } from '../../../../../_metronic/_partials/controls/forms/Switch';
import query_scGetLogisticChannelByChannel from '../../../../../graphql/query_scGetLogisticChannelByChannel';
import { formatNumberToCurrency } from '../../../../../utils';
import { useQuery } from '@apollo/client';
import { useFormikContext } from "formik";
import _ from 'lodash';
import { useCreateMultiContext } from '../CreateMultiContext';
import { Link } from 'react-router-dom';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';

const ShippingDialog = memo(({
    isShow, onHide, channel, indexShipping
}) => {
    const {formatMessage} = useIntl()
    const [applyAll, setApplyAll] = useState(false)
    const { values, setFieldValue } = useFormikContext();
    const { products, setProducts } = useCreateMultiContext();
    const { data, loading, error } = useQuery(query_scGetLogisticChannelByChannel, {
        variables: {
            connector_channel_code: channel?.connector_channel_code,
            store_id: channel?.value
        },
        fetchPolicy: 'cache-and-network',
        skip: !isShow
    });

    let needSetup = !loading && (!data?.scGetLogisticChannel?.logistics || data?.scGetLogisticChannel?.logistics.length == 0 || !data?.scGetLogisticChannel?.logistics?.some(_logisticGroup => !!_logisticGroup.shop_enabled))
    let _logisticChannels = (data?.scGetLogisticChannel?.logistics || []).filter(_logisticGroup => !!values[`channel-logistic-${_logisticGroup.ref_channel_id}_${indexShipping}`]).map(_logisticGroup => String(_logisticGroup.ref_channel_id))

    useMemo(() => {
        if (isShow) {
            setApplyAll(false)
        }
    }, [isShow])

    return (
        <Modal
            show={isShow}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            backdrop={'true'}
            dialogClassName=''
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div>
                    <p className="text-center mb-4" style={{ fontSize: 16 }}>{formatMessage({defaultMessage:'Đơn vị vận chuyển'})}</p>
                    {loading && (
                        <div
                            className="pb-4 pt-4 text-center"
                        // style={{ Top: 20, marginBottom: 20 }}
                        >
                            <span className="spinner spinner-primary mb-8"></span>
                        </div>
                    )}
                    {
                        needSetup && (
                            <>{loading ? null : (
                                <span>{data?.scGetLogisticChannel?.message || formatMessage({defaultMessage:"Bạn chưa cài đặt phương thức vận chuyển"})}. {formatMessage({defaultMessage:'Kết nối'})}  <Link to="/setting/channels"><a href="/setting/channels">{formatMessage({defaultMessage:'tại đây'})}</a></Link>.</span>
                            )}</>
                        )
                    }
                    {
                        data?.scGetLogisticChannel?.logistics?.length > 0 && (
                            <>
                                {_.sortBy(data?.scGetLogisticChannel?.logistics || [], 'ref_channel_id').map((_logisticGroup, index) => {
                                    let _volume = (values[`width_${indexShipping}`] || 0) * (values[`length_${indexShipping}`] || 0) * (values[`height_${indexShipping}`] || 0) / (_logisticGroup.ref_channel_id == 5002 ? 4 : 6)
                                    let isAccept = _logisticGroup.items?.filter(_logistic => !!_logistic.shop_enabled).some(_logistic => {
                                        return (!_logistic.max_weight || values[`weight_${indexShipping}`] <= _logistic.max_weight)
                                            && (values[`weight_${indexShipping}`] >= (_logistic.min_weight || 0))
                                            && (!_volume || (
                                                _volume <= _logistic.max_weight
                                                && _volume >= 0
                                                && (_logistic.max_width == 0 || values[`width_${indexShipping}`] <= _logistic.max_width)
                                                && (_logistic.max_length == 0 || values[`length_${indexShipping}`] <= _logistic.max_length)
                                                && (_logistic.max_height == 0 || values[`height_${indexShipping}`] <= _logistic.max_height)
                                            ))
                                    });

                                    if (_logisticGroup.items?.length == 0) {
                                        isAccept = (!_logisticGroup.max_weight || values[`weight_${indexShipping}`] <= _logisticGroup.max_weight)
                                            && (values[`weight_${indexShipping}`] >= (_logisticGroup.min_weight || 0))
                                            && (!_volume || (
                                                (_logisticGroup.max_weight == 0 || _volume <= _logisticGroup.max_weight)
                                                && _volume >= 0
                                                && (_logisticGroup.max_width == 0 || values[`width_${indexShipping}`] <= _logisticGroup.max_width)
                                                && (_logisticGroup.max_length == 0 || values[`length_${indexShipping}`] <= _logisticGroup.max_length)
                                                && (_logisticGroup.max_height == 0 || values[`height_${indexShipping}`] <= _logisticGroup.max_height)
                                            ))
                                    }

                                    if (!_logisticGroup.shop_enabled) {
                                        return null
                                    }

                                    return (
                                        <div
                                            key={`_logistic--${index}-${indexShipping}`}
                                            className="row mb-4"
                                            style={{ width: '100%' }}
                                        >
                                            <div className="col-3 font-size-lg">{_logisticGroup.channel_name}</div>
                                            <div className="col-7 font-size-lg d-flex" style={{ flexDirection: 'column' }}>
                                                {_logisticGroup?.items?.map(
                                                    (_logistic, _index) => (
                                                        <p key={`_logistic__${_index}__${index}__${indexShipping}`}>
                                                            {_logistic?.channel_name} (Tối đa {formatNumberToCurrency(_logistic.max_weight)}g)
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                            <div className="col-2" style={{ display: 'flex', alignItems: 'center', height: 'fit-content' }} >
                                                {
                                                    !isAccept && <OverlayTrigger
                                                        overlay={
                                                            <Tooltip>
                                                                {formatMessage({defaultMessage:'Đơn vị vận chuyển không được hỗ trợ'})}
                                                            </Tooltip>
                                                        }
                                                    >

                                                        <i className="far fa-times-circle text-danger mr-2"></i>
                                                    </OverlayTrigger>
                                                }
                                                <Field
                                                    name={`channel-logistic-${_logisticGroup.ref_channel_id}_${indexShipping}`}
                                                    component={Switch}
                                                    disabled={!isAccept}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                <div
                                    className="col-12 mb-4"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center' }}
                                >
                                    <span className="switch"  >
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={e => {
                                                    setApplyAll(e.target.checked)
                                                }}
                                                checked={applyAll}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                    &ensp;{formatMessage({defaultMessage:'Áp dụng cho tất cả các sản phẩm còn lại'})}
                                </div>
                            </>
                        )
                    }
                    {
                        !loading && (!!error || !!data) && <div className="form-group mb-4 text-center mt-4">
                            <button
                                type="button"
                                className="btn btn-light btn-elevate"
                                style={{ width: 150 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    (data?.scGetLogisticChannel?.logistics || []).forEach(_logisticGroup => {
                                        setFieldValue(`channel-logistic-${_logisticGroup.ref_channel_id}_${indexShipping}`, products[indexShipping].logisticChannels?.some(_id => _logisticGroup.ref_channel_id == _id))
                                    })
                                    onHide()
                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
                            </button>
                            {
                                !needSetup && <button
                                    type="button"
                                    className="btn btn-primary ml-3"
                                    style={{ width: 150 }}
                                    disabled={_logisticChannels.length == 0}
                                    onClick={async e => {
                                        e.preventDefault();

                                        setProducts(prev => {
                                            return prev.map((_prod, _index) => {
                                                if (_index == indexShipping || applyAll) {
                                                    (data?.scGetLogisticChannel?.logistics || []).forEach(_logisticGroup => {
                                                        setFieldValue(`channel-logistic-${_logisticGroup.ref_channel_id}_${_index}`, _logisticChannels?.some(_id => _logisticGroup.ref_channel_id == _id))
                                                    })
                                                    return {
                                                        ..._prod,
                                                        logisticChannels: JSON.parse(JSON.stringify(_logisticChannels))
                                                    }
                                                }
                                                return _prod;
                                            })
                                        })
                                        setFieldValue('__changed__', true)
                                        onHide()
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xác nhận'})}</span>
                                </button>
                            }
                        </div>
                    }
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default ShippingDialog;