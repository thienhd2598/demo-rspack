import React, { Fragment, memo, useState } from "react";
import { Card, CardBody, CardHeader, InputVertical } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { OPTIONS_ITEM_TYPE, OPTIONS_TYPE_LIMIT, TABS_DETAILS } from "../Constants";
import { Field, useFormikContext } from "formik";
import { useMarketingContext } from "../contexts/MarketingContext";
import { useHistory, useLocation } from 'react-router-dom';
import Select from 'react-select';
import SupportFeature from "../campaign-create/SupportFeature";
import { Accordion, Dropdown, useAccordionToggle } from "react-bootstrap";
import queryString from 'querystring';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { minBy } from "lodash";
import Pagination from "../pagination";
import { useParams } from 'react-router-dom';
import TableCampaignActions from "../components/TableCampaignActions";

const CustomToggle = ({ children, eventKey, title }) => {
    const [show, setShow] = useState(true);

    const decoratedOnClick = useAccordionToggle(eventKey, () => {
        setShow(prev => !prev);
    });

    return (
        <div className="mx-4 d-flex align-items-center justify-content-between pb-4 mt-4" onClick={decoratedOnClick}>
            <strong
                style={{ fontSize: 14, color: '#000' }}
            >
                {title}
            </strong>

            {show ? (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                    </svg>
                </span>
            ) : (
                <span className="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                    </svg>
                </span>
            )}
        </div>
    );
};

const DetailCampaignTemplate = ({
    setShowImportCampaignItems, setShowAddProduct, productSelect, setProductSelect, isActionView = false, isEdit,
    createFrameImgBatch, removeFrameImgBatch, setShowWarningItemType, isSelectedAll, handleSelectAll, setShowImportCampaignDiscount
}) => {
    const params = useParams();
    const { channelCampaign, paramsQuery, queryVariables, campaignItems, setCampaignItems } = useMarketingContext();
    const { setFieldValue, validateForm, setValues, values, handleSubmit } = useFormikContext();
    const { typeCampaign, page, limit } = queryVariables;
    const { formatMessage } = useIntl();
    const [search, setSearch] = useState('');
    const history = useHistory();
    const location = useLocation();

    const viewProduct = (
        <Fragment>
            <div className="d-flex justify-content-between mx-4 pb-4 mt-4">
                <div>
                    <div className="d-flex align-items-center">
                        <span className="mr-12">{formatMessage({ defaultMessage: 'Chọn sản phẩm và hàng hóa bạn muốn đặt giá khuyến mãi' })}</span>
                        <Field
                            name="typeItem"
                            component={RadioGroup}
                            isCenter
                            customFeedbackLabel={' '}
                            options={OPTIONS_ITEM_TYPE}
                            // disabled={isActionView || channelCampaign?.code == 'shopee' || values?.channel == 'shopee'}
                            disabled={isActionView}
                            onChangeOption={() => {
                                if (campaignItems?.length > 0) {
                                    setShowWarningItemType(true);
                                    return;
                                }

                                if (values[`typeItem`] == 1) {
                                    setFieldValue('typeItem', 2)
                                } else {
                                    setFieldValue('typeItem', 1)
                                }
                            }}
                        />
                    </div>
                </div>
                <div className='d-flex align-items-center'>
                    {typeCampaign != 'other' && <Dropdown drop='down' className="mr-4">
                        <Dropdown.Toggle
                            disabled={!values?.store || isActionView}
                            className={`${(!!values?.store || !isActionView) ? 'btn-primary' : 'btn-darkk'} btn`}
                        >
                            {formatMessage({ defaultMessage: "Tải file" })}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item className="mb-1 d-flex"
                                onClick={() => setShowImportCampaignItems(true)}
                            >
                                {formatMessage({ defaultMessage: 'Tải file {name}' }, { name: values?.typeItem == 1 ? 'sản phẩm' : 'hàng hóa' })}
                            </Dropdown.Item>
                            <Dropdown.Item
                                className="mb-1 d-flex"
                                disabled={campaignItems?.length == 0}
                                onClick={() => setShowImportCampaignDiscount(true)}
                            >
                                {formatMessage({ defaultMessage: 'Tải file giảm giá' })}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>}
                    {typeCampaign != 'other' && <button
                        type="button"
                        onClick={() => setShowAddProduct(true)}
                        className="btn btn mr-3"
                        disabled={!values?.store || isActionView}
                        style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                    >
                        {formatMessage({ defaultMessage: '+ Thêm sản phẩm' })}
                    </button>}
                </div>
            </div>
            {typeCampaign != 'other' && (<><div className='ml-1 row align-items-end mb-8'>
                <div className="col-2 input-icon d-dlex" >
                    <input
                        type="text"
                        className="form-control"
                        placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                        style={{ height: 40 }}
                        onBlur={(e) => {
                            setSearch(e.target.value)
                        }}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                setSearch(e.target.value)
                            }
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                </div>
                <div className='col-2 d-dlex flex-row'>
                    <p className="text-muted">{formatMessage({ defaultMessage: 'Giảm giá' })}</p>
                    {values?.typeDiscount == 2 && <Field
                        name={`discount_percent`}
                        value={values.discount_percent}
                        component={InputVertical}
                        disabled={isActionView}
                        type='number'
                        placeholder=""
                        style={{ padding: '0 10px' }}
                        addOnRight={'%'}
                    />}
                    {values?.typeDiscount == 1 && <Field
                        type='number'
                        style={{ padding: '0 10px' }}
                        value={values.discount_value}
                        disabled={isActionView}
                        name={`discount_value`}
                        component={InputVertical}
                        placeholder=""
                        addOnRight={'đ'}
                    />}
                </div>
                <div className='col-3 d-dlex flex-row'>
                    <p className="text-muted">{formatMessage({ defaultMessage: 'Số lượng sản phẩm khuyến mại' })}</p>
                    <div className='d-flex'>
                        <div style={{ width: '70%' }}>
                            <Select
                                type='number'
                                id="quantity"
                                style={{ zIndex: 10 }}
                                isDisabled={isActionView}
                                options={OPTIONS_TYPE_LIMIT}
                                value={values?.quantity}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 10
                                    }),
                                }}
                                onChange={(value) => {
                                    setFieldValue('quantity', value)
                                }}
                            />
                        </div>
                        {values.quantity.value == 2 &&
                            <div style={{ width: '30%' }}>
                                <Field
                                    type='number'
                                    name={'quantity_number'}
                                    disabled={isActionView}
                                    component={InputVertical}
                                    placeholder=""
                                    value={values.quantity_number}
                                />
                            </div>
                        }
                    </div>
                </div>
                <div className='col-3 d-dlex flex-row'>
                    <p className="text-muted">Giới hạn mua</p>
                    <div className='d-flex'>
                        <div style={{ width: '70%' }}>
                            <Select
                                id="quantity_per_user"
                                value={values?.quantity_per_user}
                                isDisabled={isActionView}
                                options={OPTIONS_TYPE_LIMIT}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 10
                                    }),
                                }}
                                onChange={(value) => {
                                    setFieldValue('quantity_per_user', value)
                                }}
                            />
                        </div>
                        {values?.quantity_per_user?.value == 2 &&
                            <div style={{ width: '30%' }}>
                                <Field
                                    type='number'
                                    name={'quantity_per_user_number'}
                                    component={InputVertical}
                                    disabled={isActionView}
                                    placeholder=""
                                    value={values?.quantity_per_user_number}
                                />
                            </div>}
                    </div>
                </div>
                <div className='col-2 d-dlex flex-row'>
                    <button
                        className="btn btn-primary btn-elevate mt-6"
                        style={{ padding: '10px 20px' }}
                        disabled={isActionView}
                        onClick={async (e) => {
                            e.preventDefault();
                            const totalError = await validateForm()
                            if (Object.keys(totalError)?.filter((item) => {
                                return ['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                            })?.length > 0) {
                                handleSubmit();
                                return;
                            } else {
                                let formUpdate = { ...values };
                                (campaignItems || []).forEach(product => {
                                    const minPriceVariant = minBy(product?.productVariants || [], 'price')?.price;

                                    if (values?.typeItem == 1) {
                                        if (values[`quantity_per_user`].value == 2) {
                                            formUpdate[`campaign-${product?.id}-quantity_per_user_number`] = +values[`quantity_per_user_number`]
                                            formUpdate[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[1]
                                        } else {
                                            formUpdate[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                        }
                                        if (values[`quantity`].value == 2) {
                                            formUpdate[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[1]
                                            formUpdate[`campaign-${product?.id}-purchase_limit_number`] = +values[`quantity_number`]
                                        } else {
                                            formUpdate[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                        }                                        

                                        if (values?.typeDiscount == 1) {
                                            if (values[`discount_value`] != null) {
                                                formUpdate[`campaign-${product?.id}-discount-value`] = +values[`discount_value`]
                                                formUpdate[`campaign-${product.id}-promotion_price`] = minPriceVariant - values[`discount_value`]
                                            }
                                        } else {
                                            if (values[`discount_percent`] != null) {
                                                formUpdate[`campaign-${product?.id}-discount-percent`] = +values[`discount_percent`]
                                                formUpdate[`campaign-${product.id}-promotion_price`] = Math.ceil(minPriceVariant - values[`discount_percent`] / 100 * minPriceVariant)
                                            }
                                        }
                                    }

                                    if (values?.typeItem == 2) {
                                        (product?.productVariants || []).forEach(variant => {
                                            if (!values[`campaign-${product?.id}-${variant?.id}-active`]) return;
                                            if (values[`quantity_per_user`].value == 2) {
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = +values[`quantity_per_user_number`]
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[1]
                                            } else {
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                            }
                                            if (values[`quantity`].value == 2) {
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[1]
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = +values[`quantity_number`]
                                            } else {
                                                formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                            }

                                            if (values?.typeDiscount == 1) {
                                                if (values[`discount_value`] != null) {
                                                    formUpdate[`campaign-${product?.id}-${variant?.id}-discount-value`] = +values[`discount_value`]
                                                    formUpdate[`campaign-${product.id}-${variant?.id}-promotion_price`] = variant?.price - values[`discount_value`]
                                                }
                                            } else {
                                                if (values[`discount_percent`] != null) {
                                                    formUpdate[`campaign-${product?.id}-${variant?.id}-discount-percent`] = +values[`discount_percent`]
                                                    formUpdate[`campaign-${product.id}-${variant?.id}-promotion_price`] = Math.ceil(variant?.price - values[`discount_percent`] / 100 * variant?.price)
                                                }
                                            }
                                        })
                                    }
                                })

                                setValues(formUpdate)
                            }
                        }}
                    >
                        {formatMessage({ defaultMessage: 'ÁP DỤNG CHO TẤT CẢ' })}
                    </button>
                </div>
            </div>
                <div className='row mb-4 ml-4 d-dlex align-items-center' style={{ position: 'sticky', top: 44, zIndex: 9, background: '#fff' }}>
                    <span style={{ color: '#ff5629' }} className='mr-4'>Đã chọn {productSelect?.length}</span>
                    <Dropdown drop='down'>
                        <Dropdown.Toggle disabled={!productSelect.length} className={`${productSelect?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                            {formatMessage({ defaultMessage: "Thao tác" })}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <>
                                <Dropdown.Item className="mb-1 d-flex"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        let productSelectIds = productSelect?.map(item => item.id)
                                        let newProduct = campaignItems?.filter(item => {
                                            return !productSelectIds.includes(item?.id)
                                        })
                                        setCampaignItems(newProduct);
                                        setProductSelect([])
                                    }}>
                                    {formatMessage({ defaultMessage: "Xóa hàng loạt" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={createFrameImgBatch} className="mb-1 d-flex">
                                    {formatMessage({ defaultMessage: "Thêm khung ảnh hàng loạt" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={async () => await removeFrameImgBatch()} className="mb-1 d-flex">
                                    {formatMessage({ defaultMessage: "Xóa khung ảnh hàng loạt" })}
                                </Dropdown.Item>
                            </>
                        </Dropdown.Menu>
                    </Dropdown>
                </div></>)}

            <TableCampaignActions
                stickyTop={80}
                isActionView={isActionView}
                search={search}
                productSelect={productSelect}
                setProductSelect={setProductSelect}
                isSelectedAll={isSelectedAll}
                handleSelectAll={handleSelectAll}
            />

            <Pagination
                page={page}
                totalPage={Math.ceil(campaignItems?.length / limit)}
                limit={limit}
                totalRecord={campaignItems?.length}
                count={page * limit >= campaignItems?.length ? (campaignItems?.length - (page - 1) * limit) : limit}
                basePath={isEdit ? `/marketing/campaign-template/${params?.id}` : `/marketing/campaign-template-create-new`}
                emptyTitle={formatMessage({ defaultMessage: 'Chưa có hàng hóa nào.' })}
            />
        </Fragment>
    )

    return (
        <Fragment>
            {isActionView && (
                <Accordion key={`other-pos-card`} defaultActiveKey="other-pos">
                    <Card id={`other-pos`} className="mb-4" style={{ overflow: 'unset' }}>
                        <CustomToggle
                            eventKey={`other-pos`}
                            title={formatMessage({ defaultMessage: 'SẢN PHẨM KHUYẾN MÃI' })}
                        />
                        <Accordion.Collapse eventKey={`other-pos`}>
                            {viewProduct}
                        </Accordion.Collapse>
                    </Card>
                </Accordion>
            )}

            {!isActionView && (
                <Card>
                    <div className="d-flex flex-column pb-4 mt-4">
                        <strong
                            style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                        >
                            {formatMessage({ defaultMessage: 'SẢN PHẨM KHUYẾN MÃI' })}
                        </strong>
                    </div>
                    {viewProduct}
                </Card>
            )}
        </Fragment>
    )
}

export default memo(DetailCampaignTemplate);