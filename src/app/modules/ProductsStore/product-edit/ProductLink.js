/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Field, Form } from "formik";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Formik } from 'formik';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../utils';
import { useProductsUIContext } from "../ProductsUIContext";

const Sticky = require('sticky-js');


export function ProductLink({
    history,
    setStep,
    formikProps,
    storeInactive
}) {

    const productLink = useProductsUIContext();

    console.log(`====product link ====`, productLink);
    const [showProductLink, setShowProductLink] = useState(false)
    const [isShowGrpClassify, setShowGrpClassify] = useState(false)
    const [isShowChooseProduct, setShowChooseProduct] = useState(false);

    return (
        <CardBody>
            <div className="row col-6" data-sticky-container>
                <div className="table-responsive mt-10">
                    {/* table-borderless  */}
                    <table className="table product-list table-head-custom table-head-bg product-list table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                        <thead>
                            <tr className="text-left text-uppercase" >
                                <th style={{ fontSize: '14px' }}>
                                    <span className="text-dark-75">A</span>
                                </th>

                                <th style={{ fontSize: '14px' }} width='25%'>
                                    <p className="text-dark-75 mb-0"><span >Kích thước</span></p>
                                    {/* <a href="#" style={{ textTransform: 'none' }}>Tự động tạo</a> */}
                                </th>
                                <th style={{ fontSize: '14px' }} width='25%'><span className="text-dark-75">Mã SKU</span><span style={{ color: 'red' }} >*</span></th>
                                <th style={{ fontSize: '14px' }} width='25%'><span className="text-dark-75">Mã SKU sản phẩm kho</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr >
                                <td style={{ border: '1px solid' }} rowSpan={2}>
                                    <span className="text-dark-75" >Do Cam</span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span className="text-dark-75" >M</span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span className="text-dark-75" >
                                        AKQ1011
                                    </span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span onClick={e => {
                                        e.preventDefault();
                                        setShowChooseProduct(true)
                                    }} className="text-dark-75">1</span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid' }} rowSpan={1}>
                                    <span className="text-dark-75">L</span>
                                </td>
                                <td style={{ border: '1px solid' }} >
                                    <span className="text-dark-75">
                                        AKQ1012
                                    </span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <a onClick={(e) => {
                                        e.preventDefault();
                                        setShowGrpClassify(true)
                                    }} style={{ color: 'blue' }}>
                                        AKQ1013
                                    </a>
                                </td>
                            </tr>

                            <tr >
                                <td style={{ border: '1px solid' }} rowSpan={2}>
                                    <span className="text-dark-75" >Mau trang</span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span className="text-dark-75" >S</span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span className="text-dark-75" >
                                        KQA1011
                                    </span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <span className="text-dark-75">1</span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid' }} rowSpan={1}>
                                    <span className="text-dark-75">L</span>
                                </td>
                                <td style={{ border: '1px solid' }} >
                                    <span className="text-dark-75">
                                        KQA1012
                                    </span>
                                </td>
                                <td style={{ border: '1px solid' }}>
                                    <a onClick={(e) => {
                                        e.preventDefault();
                                        setShowProductLink(true)
                                    }} style={{ color: 'rgb(255, 85, 41)' }}>
                                        Liên kết
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div >
            </div>

            <Modal
                show={showProductLink}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
            >
                <Modal.Body className="overlay overlay-block cursor-default" >
                    <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>Chọn phân loại sản phẩm kho bạn muốn liên kết</div>
                    <div className="radio-list" onChange={e => {
                        // setCurrent(e.target.value)
                    }} >
                        {
                            ['Xanh S - ee202 - Tồn kho: 200', 'Xanh S - ee202 - Tồn kho: 200', 'Xanh S - ee202 - Tồn kho: 200', 'Xanh S - ee202 - Tồn kho: 200']
                                .map(_option => {
                                    return <label key={`_option--${_option}`} className="radio" style={{ marginBottom: '2rem' }}>
                                        <input type="radio" name="radios1" value={_option} />
                                        <span></span>
                                        {_option}
                                    </label>
                                })
                        }
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={() => setShowProductLink(false)}
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            Huỷ
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-elevate"
                            style={{ width: 100 }}
                            // disabled={!current}
                            onClick={e => {
                                e.preventDefault()
                                setShowProductLink(false)
                                // history.push({
                                //   pathname: '/product-stores/new',
                                //   state: {
                                //     channel: options.find(_opt => _opt.value == current),
                                //     idProductCreated
                                //   }
                                // })
                                // onChoosed(options.find(_opt => _opt.value == current))
                            }}
                        >
                            XÁC NHẬN
                        </button>
                    </div>
                </Modal.Footer>
            </Modal >

            {/* Modal choose group classify */}
            <Modal
                show={isShowGrpClassify}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
            >
                <Modal.Body className="overlay overlay-block cursor-default" >
                    <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>
                        Chọn nhóm phân loại để liên kết
                    </div>
                    <div>
                        <p style={{ marginBottom: 10 }}>Nhóm phân loại trên sàn</p>
                        <div
                            className="radio-list"
                            style={{ display: 'flex', flexDirection: 'row' }}
                            onChange={e => {
                                // setCurrent(e.target.value)
                            }}
                        >
                            {
                                ['Màu sắc', 'Kích cỡ']
                                    .map(_option => {
                                        return <label key={`_option--${_option}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                            <input type="radio" name="radios1" value={_option} />
                                            <span></span>
                                            {_option}
                                        </label>
                                    })
                            }
                        </div>
                    </div>
                    <div>
                        <p style={{ marginBottom: 10 }}>Nhóm phân loại kho</p>
                        <div
                            style={{ display: 'flex', flexDirection: 'row' }}
                            className="radio-list" onChange={e => {
                                // setCurrent(e.target.value)
                            }}
                        >
                            {
                                ['Màu sắc', 'Kích cỡ']
                                    .map(_option => {
                                        return <label key={`_option--${_option}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                            <input type="radio" name="radios1" value={_option} />
                                            <span></span>
                                            {_option}
                                        </label>
                                    })
                            }
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={() => setShowGrpClassify(false)}
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            Huỷ
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary btn-elevate"
                            style={{ width: 100 }}
                            // disabled={!current}
                            onClick={e => {
                                e.preventDefault()
                                setShowGrpClassify(false)
                                // history.push({
                                //   pathname: '/product-stores/new',
                                //   state: {
                                //     channel: options.find(_opt => _opt.value == current),
                                //     idProductCreated
                                //   }
                                // })
                                // onChoosed(options.find(_opt => _opt.value == current))
                            }}
                        >
                            XÁC NHẬN
                        </button>
                    </div>
                </Modal.Footer>
            </Modal >

            {/* Modal choose product */}
            <Modal
                show={isShowChooseProduct}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
            >
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                    <Formik
                        initialValues={{
                            status: "", // values => All=""/Selling=0/Sold=1
                            condition: "", // values => All=""/New=0/Used=1
                            searchText: "",
                        }}
                        onSubmit={(values) => {
                        }}
                    >
                        {({
                            values,
                            handleSubmit,
                            handleBlur,
                            handleChange,
                            setFieldValue,
                        }) => (
                            <form onSubmit={handleSubmit} className="form form-label-right">
                                <div className="form-group">
                                    <div className=" bold" style={{ fontSize: 16, fontWeight: 500, margin: '1rem 2rem 1rem 2rem' }}>
                                        Chọn sản phẩm liên kết
                                    </div>
                                    <i
                                        className="ki ki-bold-close icon-md text-muted"
                                        style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }}
                                        onClick={e => {
                                            e.preventDefault();
                                            setShowChooseProduct(false);
                                        }}
                                    ></i>
                                    <div className="input-icon" style={{ margin: '0rem 2rem 1rem 2rem' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tên sản phẩm/SKU"
                                            onBlur={(e) => {
                                                // history.push(`${location.pathname}?name=${e.target.value}`)
                                            }}
                                            defaultValue={''}
                                            onKeyDown={e => {
                                                // if (e.keyCode == 13) {
                                                //     history.push(`${location.pathname}?name=${e.target.value}`)
                                                // }
                                            }}
                                        />
                                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                    </div>
                                    <div
                                        style={{ padding: '0rem 1rem 1rem 1rem' }}
                                    >
                                        <div className='row' style={{ borderBottom: '2px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                            <div className='col-8'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img src={null}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }} />
                                                    </div>
                                                    <div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tên sản phẩm</p>
                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                            <p style={{ fontSize: 10 }} className='mb-1'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> SKU</p>
                                                        </div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tồn kho: {formatNumberToCurrency(40000)}</p>

                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <span
                                                    className="text-primary font-weight-bold"
                                                    style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                >
                                                    Liên kết
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{ padding: '0rem 1rem 1rem 1rem' }}
                                    >
                                        <div className='row' style={{ borderBottom: '2px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                            <div className='col-8'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img src={null}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }} />
                                                    </div>
                                                    <div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tên sản phẩm</p>
                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                            <p style={{ fontSize: 10 }} className='mb-1'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> SKU</p>
                                                        </div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tồn kho: {formatNumberToCurrency(40000)}</p>

                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <span
                                                    className="text-primary font-weight-bold"
                                                    style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                >
                                                    Liên kết
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{ padding: '0rem 1rem 1rem 1rem' }}
                                    >
                                        <div className='row' style={{ borderBottom: '2px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                            <div className='col-8'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img src={null}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }} />
                                                    </div>
                                                    <div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tên sản phẩm</p>
                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                            <p style={{ fontSize: 10 }} className='mb-1'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> SKU</p>
                                                        </div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tồn kho: {formatNumberToCurrency(40000)}</p>

                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <span
                                                    className="text-primary font-weight-bold"
                                                    style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                >
                                                    Liên kết
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{ padding: '0rem 1rem 1rem 1rem' }}
                                    >
                                        <div className='row' style={{ padding: '6px 1rem 0px', alignItems: 'center' }}>
                                            <div className='col-8'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img src={null}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }} />
                                                    </div>
                                                    <div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tên sản phẩm</p>
                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                            <p style={{ fontSize: 10 }} className='mb-1'><img src={toAbsoluteUrl('/media/ic_sku.svg')} /> SKU</p>
                                                        </div>
                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tồn kho: {formatNumberToCurrency(40000)}</p>

                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <span
                                                    className="text-primary font-weight-bold"
                                                    style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                >
                                                    Liên kết
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </Formik>
                </Modal.Body>
            </Modal >
        </CardBody>
    )
}
