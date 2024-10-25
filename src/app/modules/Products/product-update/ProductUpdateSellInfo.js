import React, { memo, useState, useMemo, useCallback, Fragment } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useIntl } from "react-intl";
const ProductUpdateSellInfo = () => {
    const suhbeader = useSubheader();
    const {formatMessage} = useIntl()
    suhbeader.setTitle(formatMessage({defaultMessage:'Sửa giá & tồn kho sản phẩm kho'}));
    const history = useHistory();
   
    const initialValues = useMemo(
        () => {

        }, []
    );

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={{}}
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                ...rest
            }) => {
                return (
                    <Fragment>
                        <RouterPrompt
                            // when={changed}                        
                            when={false}
                            title={formatMessage({defaultMessage:"Bạn đang cập nhật giá & tồn kho sản phẩm kho. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?"})}
                            cancelText={formatMessage({defaultMessage:"KHÔNG"})}
                            okText={formatMessage({defaultMessage:"CÓ, THOÁT"})}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <Form>
                            <Card>
                                <CardBody>
                                    <div
                                        style={{
                                            boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                                            // height: "calc(100vh - 340px)",
                                            borderRadius: 6,
                                            marginTop: 20,
                                            width: '100%',
                                            // overflowY: 'scroll'
                                        }}
                                    >
                                        <table className="table table-borderless product-list  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', position: 'relative' }}>
                                            <thead style={{ background: '#f3f8fa' }}>
                                                <tr>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderRight: 'none',
                                                        width: "40%", padding: 16,
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({defaultMessage:'Tên sản phẩm'})}
                                                    </th>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none',
                                                        padding: 16, width: '30%',
                                                        fontSize: '14px'
                                                    }}>
                                                       {formatMessage({defaultMessage:'Giá niêm yết'})}
                                                    </th>
                                                    <th style={{    
                                                        border: '1px solid #D9D9D9', borderLeft: 'none',
                                                        padding: 16, width: '30%',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({defaultMessage:'Tồn kho'})}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[1, 2, 3].map((_product, index) => (
                                                    <tr style={{ borderBottom: index === [1, 2 , 3].length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                                                        <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
                                                            <div className="d-flex flex-row">
                                                                <div
                                                                    style={{
                                                                        backgroundColor: '#F7F7FA',
                                                                        width: 80, height: 80,
                                                                        borderRadius: 8,
                                                                        overflow: 'hidden',
                                                                        minWidth: 80,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    onClick={e => {
                                                                        e.preventDefault();
                                                                        // window.open(`/product-stores/edit/${product.id}`, '_blank')
                                                                    }}
                                                                    className='mr-6'
                                                                >
                                                                    <img
                                                                        src={"https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"}
                                                                        style={{ width: 80, height: 80, objectFit: 'contain' }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p
                                                                        className='font-weight-normal mb-2'
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={e => {
                                                                            e.preventDefault();
                                                                            // window.open(`/product-stores/edit/${product.id}`, '_blank')
                                                                        }}
                                                                    >
                                                                        {formatMessage({defaultMessage:'Sản phẩm ABC'})}
                                                                    </p>
                                                                    <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                        <p ><img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                            <span className='text-truncate-sku'>
                                                                                {'SKU-123'}
                                                                            </span>
                                                                        </p>
                                                                        <p className="ml-6 d-flex" >
                                                                            <img
                                                                                style={{ width: 20, height: 20 }}
                                                                                // src={_channel?.logo_asset_url}
                                                                                src={toAbsoluteUrl('/media/ic_sku.svg')}
                                                                                className="mr-2"
                                                                            />
                                                                            <span >{'Thien Shop'}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='pt-6 pb-1'>
                                                            1
                                                        </td>
                                                        <td className='pt-6 pb-1'>
                                                            2
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className='d-flex justify-content-end mt-8' >
                                        <button
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 150 }}
                                            onClick={e => {
                                                e.preventDefault()
                                                history.push('/products/list');
                                            }}
                                        >
                                            {formatMessage({defaultMessage:'Hủy bỏ'})}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                            style={{ minWidth: 150 }}
                                            onClick={async (e) => { }}
                                        >
                                            {formatMessage({defaultMessage:'Cập nhật'})}
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Form>
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(ProductUpdateSellInfo);