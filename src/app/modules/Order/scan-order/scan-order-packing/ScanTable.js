import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody, CardHeader, CardHeaderToolbar } from '../../../../../_metronic/_partials/controls';
import OrderProductRow from '../OrderProductRow';
import { useIntl } from "react-intl";
import OrderProductRowCombo from '../OrderProductRowCombo';
import ModalCombo from '../../../Products/products-list/dialog/ModalCombo';
import Select from 'react-select';
import useScanDetection from '../../../../../hooks/useScanDetection';
import mutate_coPrintShipmentPackage from '../../../../../graphql/mutate_coPrintShipmentPackage';
import { useMutation } from '@apollo/client';
import LoadingDialog from '../../../FrameImage/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import HtmlPrint from '../../HtmlPrint';
import { useOnKeyPress } from '../../../../../hooks/useOnKeyPress';

const optionsSearchProduct = [
    {
        value: 'sku',
        label: 'SKU'
    },
    {
        value: 'gtin',
        label: 'GTIN'
    },
]

const ScanTable = ({
    packageInfo, loading, isValidOrder, infoOrder, sumAmountOrder, sumAmountAddProduct, warehouse,
    typeProduct, setTypeProduct, setSearchProduct, searchPrdouct, refetchLoadProd, setCheckReloadOrder, isValidProduct
}) => {
    const { formatMessage } = useIntl()
    const inputRefProd = useRef(null);
    const refSelectProd = useRef(null);
    const [focus, setFocus] = useState(0);    
    const [dataCombo, setDataCombo] = useState(null);
    const { addToast } = useToasts();

    const ProductRow = useMemo(() => {
        if (isValidOrder) {
            return (
                infoOrder?.map((item, groupIndex) => (
                    item.length === 1 ? (
                        <OrderProductRow
                            key={`order-product-${groupIndex}`}
                            product={item[0].product}
                            isBorder={false}
                            warehouse={warehouse}
                            item={{ ...item[0] }}
                        />
                    ) : (
                        <OrderProductRowCombo
                            key={`order-product-combo-${groupIndex}`}
                            isBorder={false}
                            item={[...item]}
                            warehouse={warehouse}
                            setDataCombo={setDataCombo}
                        />
                    )
                )))
        }

    }, [infoOrder])

    useEffect(() => {
        if (isValidProduct) {
            inputRefProd.current.value = ''
            setSearchProduct('')
        }
    }, [isValidProduct, searchPrdouct]);

    const [printShipmentPackage, { data: printData, loading: loadingWithShipOrder }] = useMutation(mutate_coPrintShipmentPackage);

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefProd?.current) return;

            if (focus == 'product') {
                setSearchProduct(value)
                reloadProductSameValue()
                inputRefProd.current.value = ''
            }

        }
    });    

    const reloadProductSameValue = () => {
        refetchLoadProd()
        setCheckReloadOrder(prev => {
            return prev + 1;
        })
        inputRefProd.current.value = ''
    }

    const handlePrintShipmentPackage = useCallback(async () => {
        const { data } = await printShipmentPackage({
            variables: {
                list_package: [{ package_id: packageInfo?.id }],
                list_print_type: [1],
                need_check_shipping_carrier: 0
            }
        });

        if (data?.coPrintShipmentPackage?.data?.list_package_fail?.length == 0) {
            window.open(data?.coPrintShipmentPackage?.data?.doc_url, '_blank');
        } else {
            addToast(data?.coPrintShipmentPackage?.data?.list_package_fail?.[0]?.error_message || 'In vận đơn thất bại', { appearance: 'error' });
        }
    }, [packageInfo]);

    useOnKeyPress(handlePrintShipmentPackage, "F3");

    return (
        <Fragment>            
            <LoadingDialog show={loadingWithShipOrder} />
            <Card>
                <CardHeader title={formatMessage({ defaultMessage: `Thông tin` })}>
                    <CardHeaderToolbar>
                    </CardHeaderToolbar>
                </CardHeader>
                <CardBody className='py-5"'>
                    <div className='row d-flex justify-content-between align-items-center mb-4'>
                        <div className='col-6'>
                            {warehouse?.fulfillment_scan_pack_mode == 1 && <div className='row'>
                                <div className='col-3 pr-0' style={{ zIndex: 2 }}>
                                    <Select
                                        ref={refSelectProd}
                                        options={optionsSearchProduct}
                                        className='w-100 custom-select-order'
                                        style={{ borderRadius: 0 }}
                                        value={optionsSearchProduct.find(_op => _op.value == typeProduct.value)}
                                        onKeyDown={e => {
                                            if (e.keyCode === 39 && !e.target.value) {
                                                inputRefProd.current.focus();
                                                return;
                                            }
                                        }}
                                        onChange={value => {
                                            inputRefProd.current.focus();
                                            setTypeProduct(value)
                                        }}
                                        isDisabled={!isValidOrder}
                                        formatOptionLabel={(option, labelMeta) => {
                                            return <div>{option.label}</div>
                                        }}
                                    />
                                </div>
                                <div className="col-9 input-icon pl-0" style={{ height: 'fit-content' }} >
                                    <input
                                        ref={inputRefProd}
                                        disabled={!isValidOrder}
                                        type="text"
                                        className="form-control"
                                        placeholder={typeProduct.value == 'sku' ? formatMessage({ defaultMessage: "Quét hoặc nhập SKU hàng hóa" }) : formatMessage({ defaultMessage: "Quét hoặc nhập GTIN hàng hóa" })}
                                        style={{ height: 37, borderRadius: 0, paddingLeft: '50px', fontSize: '15px' }}
                                        onFocus={() => setFocus('product')}
                                        onKeyDown={e => {
                                            if (e.keyCode === 37 && !e.target.value) {
                                                refSelectProd.current.focus();
                                                return;
                                            }

                                            if (e.keyCode == 13) {
                                                if (e.target.value == searchPrdouct) {
                                                    reloadProductSameValue()
                                                    return
                                                }
                                                setSearchProduct(e.target.value)
                                                inputRefProd.current.value = ''

                                            }
                                        }}
                                    />
                                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                </div>
                            </div>}
                        </div>
                        <div className='col-4 d-flex justify-content-end'>
                            <button
                                className='btn btn-primary'
                                disabled={!infoOrder?.length}
                                onClick={handlePrintShipmentPackage}
                            >
                                {formatMessage({ defaultMessage: 'In vận đơn (F3)' })}
                            </button>
                        </div>
                    </div>
                    <div className='px-4 row d-flex justify-content-between'>
                        <table className="table product-list table-borderless product-list  table-vertical-center fixed mb-0">
                            <tbody>
                                <tr className="font-siz-lg" style={{ fontSize: '15px' }}>
                                    <td style={{ fontSize: '13px' }} width={'50%'}><b>{formatMessage({ defaultMessage: 'Kiện hàng' })}</b></td>
                                    <td style={{ fontSize: '13px' }} width={'50%'}>
                                        {isValidOrder && (
                                            <div className='d-flex align-items-center'>
                                                <span>{packageInfo?.order?.ref_id} </span>
                                                {!!packageInfo?.pack_no ?
                                                    <span className='text-primary'>
                                                        {` (Kiện ${packageInfo?.pack_no}: ${packageInfo?.system_package_number})`}
                                                    </span> : <span> - {formatMessage({ defaultMessage: 'Mã kiện hàng: {packNumber}' }, { packNumber: packageInfo?.system_package_number })}</span>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="font-size-lg" style={{ fontSize: '15px' }}>
                                    <td style={{ fontSize: '13px' }} width={'50%'}><b>{formatMessage({ defaultMessage: 'Vận chuyển' })}</b></td>
                                    <td style={{ fontSize: '13px' }} width={'50%'}>
                                        {isValidOrder && <div className="d-flex flex-column mb-2">
                                            <p className='my-0'>{packageInfo?.shipping_carrier} - {formatMessage({ defaultMessage: 'Mã vận đơn' })}: {packageInfo?.tracking_number || '--'}</p>
                                        </div>
                                        }</td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                    <div className='px-4 row d-flex justify-content-between'>
                        <table className="table mb-0 table-borderless product-list  table-vertical-center fixed">
                            <tbody>
                                <tr className="font-size-lg" style={{ fontSize: '15px' }}>
                                    <td width="40%" className='text-left' style={{ borderTop: '0', borderRight: '0', fontSize: '13px' }}><b>{formatMessage({ defaultMessage: 'Sản phẩm' })}</b></td>
                                    <td width="10%" className='text-center' style={{ borderTop: '0', borderLeft: '0', fontSize: '13px' }}><b>{formatMessage({ defaultMessage: 'ĐVT' })}</b></td>
                                    <td width={warehouse?.fulfillment_scan_pack_mode == 1 ? "25%" : "50%"} className='text-center' style={{ borderTop: '0', fontSize: '13px' }}><b>{formatMessage({ defaultMessage: 'Số lượng đặt' })}</b></td>
                                    {warehouse?.fulfillment_scan_pack_mode == 1 && <td width="25%" className='text-center' style={{ borderTop: '0', fontSize: '13px' }}><b>{formatMessage({ defaultMessage: 'Đã nhặt hàng' })}</b></td>}
                                </tr>
                                {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                    <span className="ml-3 spinner spinner-primary"></span>
                                </div>
                                }
                                {ProductRow}
                            </tbody>
                        </table>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <tbody>
                                <tr className="font-size-lg" style={{ fontSize: '15px' }}>
                                    <td width="50%" className='text-right' style={{ borderTop: '0' }} ><b>{formatMessage({ defaultMessage: 'Tổng số cần lấy' })}</b></td>
                                    <td width={warehouse?.fulfillment_scan_pack_mode == 1 ? "25%" : "50%"} className='text-center' style={{ borderTop: '0', fontSize: '22px' }}><b>{sumAmountOrder}</b></td>
                                    {warehouse?.fulfillment_scan_pack_mode == 1 && <td width="25%" className='text-center' style={{ borderTop: '0', fontSize: '22px', background: sumAmountOrder != sumAmountAddProduct ? '#FE5629' : '#00DB6D', color: '#fff' }}><b>{sumAmountAddProduct}</b></td>}
                                </tr>
                            </tbody>
                        </table>
                        <ModalCombo
                            dataCombo={dataCombo}
                            onHide={() => setDataCombo(null)}
                        />
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(ScanTable);