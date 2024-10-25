/*
 * Created by duydatpham@gmail.com on 10/11/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useQuery } from '@apollo/client'
import React, { memo, useEffect, useMemo, useState } from 'react'
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import Select from "react-select";
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import { ReSelectSmeProduct } from '../../../../components/ReSelectSmeProduct';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';
import { useProductsUIContext } from '../ProductsUIContext';
import query_scGetLogisticChannelByChannel from '../../../../graphql/query_scGetLogisticChannelByChannel';
import { Modal } from "react-bootstrap";
import { RouterPrompt } from "../../../../components/RouterPrompt";
import Form from 'react-bootstrap/Form';
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import { Field, Formik } from 'formik';
import { useIntl } from 'react-intl';
import client from '../../../../apollo';
import query_sme_catalog_product_by_pk from '../../../../graphql/query_sme_catalog_product_by_pk';

export default memo(({ setMessShowAlertLogistic }) => {

    const {
        setSmeProduct,
        setCurrentChannel,
        setCreationMethod
    } = useProductsUIContext()
    const { formatMessage } = useIntl();
    const [product, setProduct] = useState()
    const [store, setStore] = useState()
    const [method, setMethod] = useState(0)
    const history = useHistory()

    const { data: dataStore, loading } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    })
    const { data: dataLogistic, loading: loadingLogistic } = useQuery(query_scGetLogisticChannelByChannel, {
        variables: {
            connector_channel_code: store?.connector_channel_code,
            store_id: store?.value
        },
        fetchPolicy: 'network-only',
        skip: !store
    })

    const creationMethod = [
        {
            value: 0,
            label: formatMessage({ defaultMessage: 'Từ sản phẩm kho' })
        },
        {
            value: 1,
            label: formatMessage({ defaultMessage: 'Tạo từ đầu' })
        }
    ]

    useEffect(() => {
        setSmeProduct()
        setCurrentChannel()
        setCreationMethod(0)
    }, [])

    const formSelectCreationMethod = () => {
        return (
            <Formik
                initialValues={{
                    creationMethod: method
                }}
            >
                {({ values }) => {
                    setMethod(values?.creationMethod)

                    return (<Field
                        name="creationMethod"
                        component={RadioGroup}
                        curr
                        value={method}
                        // label={'Loại kiểm kho'}
                        customFeedbackLabel={' '}
                        // disabled={true}
                        options={creationMethod}
                    >

                    </Field>
                    )
                }}
            </Formik>
        )
    }


    const [options] = useMemo(() => {
        let _options = dataStore?.sc_stores?.filter(_store => _store.status == 1).map(_store => {
            let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
            return {
                label: _store.name,
                value: _store.id,
                logo: _channel?.logo_asset_url,
                enable_multi_warehouse: _store?.enable_multi_warehouse,
                connector_channel_code: _store.connector_channel_code,
                special_type: _store?.special_type || 0
            }
        }) || [];
        return [_options]
    }, [dataStore])

    if (!dataStore || loading) {
        return (
            <div className="row" data-sticky-container style={{ justifyContent: 'center', alignItems: 'center' }} >
                <span className="spinner spinner-primary" style={{ marginTop: 20 }} ></span>
            </div>
        )
    }

    if (!!dataStore && options.length == 0 && !loading)
        return < Card >
            <CardBody style={{ textAlign: 'center' }} >
                <p className='mb-1' >{formatMessage({ defaultMessage: 'Bạn chưa kết nối với gian hàng/kênh bán nào.' })}</p>
                <p style={{ fontStyle: 'italic' }} >{formatMessage({ defaultMessage: 'Vui lòng kết nối gian hàng/kênh bán để tạo sản phẩm.' })}</p>
                <Link className="btn btn-primary" style={{ width: 150 }} to='/setting/channels' >{formatMessage({ defaultMessage: 'KẾT NỐI NGAY' })}</Link>
            </CardBody>
        </Card >

    let dontHasLogistic = store?.connector_channel_code == 'shopee' && !dataLogistic?.scGetLogisticChannel?.logistics?.some(_logisticGroup => !!_logisticGroup.shop_enabled)

    return <>
        <RouterPrompt
            when={store || product}
            title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
            cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
            okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
            onOK={() => true}
            onCancel={() => false}
        />
        <Card>
            <CardBody>
                <div className="col-lg-6">
                    <p>{formatMessage({ defaultMessage: 'Gian hàng' })} <span className='text-danger'> * </span> </p>
                    <Select options={options}
                        className='w-100'
                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                        isClearable
                        isLoading={loading}
                        value={store}
                        onChange={_value => {
                            setStore(_value)
                            setProduct()
                        }}

                        formatOptionLabel={(option, labelMeta) => {
                            return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
                        }}
                    />

                    <p className='mt-8 mb-2'>{formatMessage({ defaultMessage: 'Chọn cách tạo' })}</p>
                    {
                        formSelectCreationMethod()
                    }

                    {/* {dontHasLogistic && <span className='mt-2' >Bạn chưa cài đặt phương thức vận chuyển. Cài đặt <a href="https://banhang.shopee.vn/portal/settings/shop/logistics" target="_blank" >tại đây</a>.</span>} */}
                    {
                        method == 0 &&
                        <>
                            <p className='mt-8' >{formatMessage({ defaultMessage: 'Sản phẩm kho' })} <span className='text-danger'> * </span></p>
                            <ReSelectSmeProduct
                                onSelect={setProduct}
                                selected={product}
                                storeId={store?.value}
                            /></>
                    }


                    <div className='d-flex justify-content-end mt-12' >
                        <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                            e.preventDefault()
                            history.push('/product-stores/list')
                        }} >
                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                        </button>
                        <button className="btn btn-primary" style={{ width: 150 }}
                            disabled={!store || (!product && method == 0) || loadingLogistic}
                            type="submit" onClick={async (e) => {
                                e.preventDefault();

                                if (dontHasLogistic) {
                                    setMessShowAlertLogistic(dataLogistic?.scGetLogisticChannel?.message || formatMessage({ defaultMessage: 'Vui lòng cài đặt phương thức vận chuyển trước khi tạo sản phẩm' }))
                                    return
                                }
                                try {
                                    const { data } = await client.query({
                                        query: query_sme_catalog_product_by_pk,
                                        variables: {
                                            id: product?.raw?.id
                                        },
                                        skip: !product?.raw?.id,
                                        fetchPolicy: 'network-only'
                                    })                                    
    
                                    setSmeProduct(data?.sme_catalog_product_by_pk);
                                    setCurrentChannel(store)
                                    setCreationMethod(method)
                                } catch {
                                    setSmeProduct(null);
                                    setCurrentChannel(store);
                                    setCreationMethod(method);                                    
                                }
                            }}>
                            {formatMessage({ defaultMessage: 'Tiếp tục' })}
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    </>
})