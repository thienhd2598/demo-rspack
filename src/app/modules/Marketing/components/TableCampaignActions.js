import { Field, useFormikContext } from "formik";
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useMemo } from "react";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from 'react-intl';
import Select from 'react-select';
import { Checkbox, InputVertical } from "../../../../_metronic/_partials/controls";
import HoverImage from "../../../../components/HoverImage";
import InfoProduct from "../../../../components/InfoProduct";
import { formatNumberToCurrency } from "../../../../utils";
import { useMarketingContext } from "../contexts/MarketingContext";
import { OPTIONS_TYPE_LIMIT } from "../Constants";
import { maxBy, minBy, sumBy } from "lodash";
import { useMutation } from "@apollo/client";
import mutate_retryCampaignItem from "../../../../graphql/mutate_retryCampaignItem";
import { useToasts } from "react-toast-notifications";
import LoadingDialog from "../../FrameImage/LoadingDialog";

const TableCampaignActions = ({
    productSelect, setProductSelect, search, isSelectedAll, handleSelectAll, isActionView = false, isEdit = false, stickyTop = 44
}) => {
    const { formatMessage } = useIntl();
    const { values, setFieldValue } = useFormikContext();
    const { addToast } = useToasts();
    const { campaignItems, setCampaignItems, queryVariables, paramsQuery } = useMarketingContext();
    const { typeCampaign, page, limit } = queryVariables;

    console.log({ queryVariables })

    const [retryCampaignItem, { loading: loadingRetryItem }] = useMutation(mutate_retryCampaignItem);

    const buildProductVariants = (variant, product) => {
        const variantsActive = product?.productVariants?.filter(variant => values[`campaign-${product?.id}-${variant?.id}-active`])
        const isDisabledSwitch = variantsActive?.length == 1

        return (
            <Fragment>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none' }}>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                        <div style={{
                            width: 68, height: 68,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 68
                        }} className='mr-6' />
                        <div className='w-100 d-flex flex-column justify-content-center'>
                            <InfoProduct
                                short={true}
                                sku={variant.sku}
                            // url={`/product-stores/edit/${product.id}`}
                            />
                            {variant?.name != product?.name && <span className='font-weight-normal text-secondary-custom' >{variant?.name?.replaceAll(' + ', ' - ')}</span>}
                        </div>
                    </div>

                </td>
                <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    {formatNumberToCurrency(variant?.price) || ''}
                    <span>đ</span>
                </td>
                {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    {values?.typeDiscount == 1 && <Field
                        style={{ fontSize: '14px', textAlign: 'center' }}
                        type='number'
                        isCampaign
                        name={`campaign-${product?.id}-${variant?.id}-discount-value`}
                        disabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                        component={InputVertical}
                        onFocusChangeValue={(value) => {
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-promotion_price`, variant?.price - value)
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-percent`, Math.ceil(value / variant?.price * 100))
                            if (value == '' || value < 1 || value >= variant?.price) {
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-promotion_price`, '')
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-percent`, '')
                            }
                        }}
                        placeholder=""
                        required
                        addOnRight={'đ'}
                    />}
                    {values?.typeDiscount == 2 && <Field
                        style={{ fontSize: '14px', textAlign: 'center' }}
                        type='number'
                        isCampaign
                        name={`campaign-${product?.id}-${variant?.id}-discount-percent`}
                        disabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                        onFocusChangeValue={(value) => {
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-promotion_price`, Math.ceil(variant?.price * (1 - value / 100)))
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-value`, variant?.price * value / 100)
                            if (value == '' || value < 1 || value > 99) {
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-promotion_price`, '')
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-value`, '')
                            }
                        }}
                        component={InputVertical}
                        placeholder=""
                        required
                        addOnRight={'%'}
                    />}
                    {(values[`campaign-${product?.id}-${variant?.id}-discount-percent`] > 20 && values[`campaign-${product?.id}-${variant?.id}-discount-percent`] <= 50) && <p style={{ color: '#9EA02D' }}>Mức khuyến mãi đang lớn hơn 20% so với giá bán</p>}
                    {(values[`campaign-${product?.id}-${variant?.id}-discount-percent`] > 50 && values[`campaign-${product?.id}-${variant?.id}-discount-percent`] <= 80) && <p style={{ color: '#FE5629' }}>Mức khuyến mãi đang lớn hơn 50% so với giá bán</p>}
                    {(values[`campaign-${product?.id}-${variant?.id}-discount-percent`] > 80 && values[`campaign-${product?.id}-${variant?.id}-discount-percent`] < 100) && <p style={{ color: '#F12020' }}>Mức khuyến mãi đang lớn hơn 80% so với giá bán</p>}
                </td>}
                {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <Field
                        style={{ fontSize: '14px', textAlign: 'center' }}
                        type='number'
                        isCampaign
                        name={`campaign-${product?.id}-${variant?.id}-promotion_price`}
                        onFocusChangeValue={(value) => {
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-percent`, Math.ceil(((variant?.price - value) / variant?.price) * 100))
                            setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-value`, variant?.price - value)
                            if (value == '' || value < 1 || value >= variant?.price) {
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-percent`, '')
                                setFieldValue(`campaign-${product?.id}-${variant?.id}-discount-value`, '')
                            }
                        }}
                        disabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                        component={InputVertical}
                        placeholder=""
                        required
                        addOnRight={'đ'}
                    />
                    {values[`campaign-${product?.id}-${variant?.id}-promotion_price`] && variant?.price_minimum && (values[`campaign-${product?.id}-${variant?.id}-promotion_price`] < Number(variant?.price_minimum || 0)) && <p style={{ color: '#F12020' }}>{formatMessage({ defaultMessage: 'Giá sau giảm nhỏ hơn giá tối thiểu' })}</p>}
                </td>}
                <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <span>{variant?.sellable_stock}</span>
                </td>
                {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <div className='d-flex'>
                        <div style={{ width: '70%' }}>
                            <Select
                                id={`campaign-${product?.id}-${variant?.id}-purchase_limit`}
                                options={OPTIONS_TYPE_LIMIT}
                                isDisabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                                value={values[`campaign-${product?.id}-${variant?.id}-purchase_limit`]}
                                onChange={(value) => {
                                    setFieldValue(`campaign-${product?.id}-${variant?.id}-purchase_limit`, value)
                                }}
                            />
                        </div>
                        {values[`campaign-${product?.id}-${variant?.id}-purchase_limit`]?.value == 2 &&
                            <div style={{ width: '30%' }}>
                                <Field
                                    type='number'
                                    isCampaign
                                    name={`campaign-${product?.id}-${variant?.id}-purchase_limit_number`}
                                    component={InputVertical}
                                    disabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                                    placeholder=""
                                    value={values[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`]}
                                />
                            </div>
                        }
                    </div>
                </td>}
                {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <div className='d-flex'>
                        <div style={{ width: '70%' }}>
                            <Select
                                id={`campaign-${product?.id}-${variant?.id}-quantity_per_user`}
                                options={OPTIONS_TYPE_LIMIT}
                                isDisabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                                value={values[`campaign-${product?.id}-${variant?.id}-quantity_per_user`]}
                                onChange={(value) => {
                                    setFieldValue(`campaign-${product?.id}-${variant?.id}-quantity_per_user`, value)
                                }}
                            />
                        </div>
                        {values[`campaign-${product?.id}-${variant?.id}-quantity_per_user`]?.value == 2 &&
                            <div style={{ width: '30%' }}>
                                <Field
                                    type='number'
                                    isCampaign
                                    name={`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`}
                                    max={variant?.sellable_stock}
                                    disabled={!values[`campaign-${product?.id}-${variant?.id}-active`] || isActionView}
                                    component={InputVertical}
                                    placeholder=""
                                    value={values[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`]}
                                />
                            </div>
                        }
                    </div>
                </td>}
                {values?.type != 'other' && (
                    <td className="text-center" style={{ borderTop: 'none', borderBottom: 'none' }}>
                        <span className="switch d-flex justify-content-center" style={{ transform: 'scale(0.9)' }}>
                            <label>
                                <input
                                    type={'checkbox'}
                                    style={{ background: '#F7F7FA', border: 'none' }}
                                    disabled={(values[`campaign-${product?.id}-${variant?.id}-active`] && isDisabledSwitch) || isActionView || variant?.sellable_stock == 0}
                                    onChange={() => {
                                        setFieldValue(`campaign-${product?.id}-${variant?.id}-active`, !values[`campaign-${product?.id}-${variant?.id}-active`]);
                                    }}
                                    checked={values[`campaign-${product?.id}-${variant?.id}-active`]}
                                />
                                <span></span>
                            </label>
                        </span>
                    </td>
                )}
            </Fragment>
        )
    }

    const dataTable = useMemo(() => {
        let data = [];
        if (paramsQuery?.type) {
            data = campaignItems?.filter(item => {
                if (paramsQuery?.type == 1) {
                    return values?.typeItem == 1
                        ? !!item?.sync_error_message
                        : item?.productVariants?.some(variant => !!variant?.sync_error_message)
                }
                if (paramsQuery?.type == 2) {
                    return values?.typeItem == 1
                        ? !item?.sync_error_message && item?.sync_status == 2
                        : item?.productVariants?.some(variant => !variant?.sync_error_message && variant?.sync_status == 2)
                }
                if (paramsQuery?.type == 3) {
                    return values?.typeItem == 1
                        ? item?.sync_status == 1
                        : item?.productVariants?.some(variant => variant?.sync_status == 1)
                }

                return true
            })?.slice((page - 1) * limit, page * limit)
        } else {
            data = campaignItems?.slice((page - 1) * limit, page * limit)
        }

        return data?.filter(item => item?.name?.includes(search) || item?.sku?.includes(search) || item?.productVariants?.some(vr => vr?.sku?.includes(search)))
    }, [campaignItems, page, limit, paramsQuery, search]);    

    return (
        <div className="mx-4">
            <LoadingDialog show={loadingRetryItem} />
            <table className="table table-borderless product-list table-vertical-center fixed">
                <thead
                    style={{
                        position: 'sticky',
                        top: stickyTop,
                        zIndex: 1,
                        background: '#F3F6F9',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        borderBottom: '1px solid gray',
                        borderLeft: '1px solid #d9d9d9',
                    }}
                >
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px' }}>
                            <Checkbox
                                inputProps={{
                                    'aria-label': 'checkbox',
                                }}
                                isSelected={isSelectedAll}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width={`${values?.type != 'other' ? '16%' : '50%'}`}
                        >
                            <span className="mx-4">
                                {formatMessage({ defaultMessage: 'Sản phẩm' })}
                            </span>
                        </th>
                        <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width={`${values?.type != 'other' ? '10%' : '25%'}`}
                        >
                            {formatMessage({ defaultMessage: 'Giá bán' })}
                        </th>
                        {values?.type != 'other' && <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width="11%"
                        >
                            {formatMessage({ defaultMessage: 'Giảm giá' })}
                        </th>}
                        {values?.type != 'other' && <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width="13%"
                        >
                            {formatMessage({ defaultMessage: 'Giá sau giảm' })}
                        </th>}
                        <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width={`${values?.type != 'other' ? '8%' : '25%'}`}
                        >
                            {formatMessage({ defaultMessage: 'Có sẵn' })}
                        </th>
                        {values?.type != 'other' && <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width="17%"
                        >
                            {formatMessage({
                                defaultMessage: 'Số lượng sản phẩm khuyến mại',
                            })}
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="layout-tooltip">
                                        Tổng lượng hàng mà bạn sẽ bán với giá khuyến mãi. Nếu số
                                        lượng đã bán vượt con số này, giá của sản phẩm/SKU sẽ
                                        quay lại giá ban đầu.
                                    </Tooltip>
                                }
                            >
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                            </OverlayTrigger>
                        </th>}
                        {values?.type != 'other' && <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width="17%"
                        >
                            {formatMessage({ defaultMessage: 'Giới hạn mua' })}
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="layout-tooltip">
                                        Giới hạn mua mỗi khách là số lượng hàng tối đa cho mỗi
                                        sản phẩm/SKU mà mỗi khách có thể mua với giá khuyến mãi.
                                    </Tooltip>
                                }
                            >
                                <i className="fs-14 mx-1 fas fa-info-circle"></i>
                            </OverlayTrigger>
                        </th>}
                        {values?.type != 'other' && <th
                            style={{ fontSize: '14px', textAlign: 'center' }}
                            width="10%"
                        >
                            {formatMessage({ defaultMessage: 'Thao tác' })}
                        </th>}
                    </tr>
                </thead>
                <tbody style={{ borderBottom: '0.5px solid #cbced4' }}>
                    {false && <div
                        className="text-center w-100 mt-4"
                        style={{ position: 'absolute' }}
                    >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>}
                    {dataTable?.map(
                        (product, index) => {
                            const priceMinVariant = minBy(product?.productVariants, 'price')?.price;
                            const priceMiniumVariant = maxBy(product?.productVariants, 'price_minimum')?.price_minimum;
                            const totalSellableStockVariant = sumBy(product?.productVariants, 'sellable_stock');
                            const isSelected = productSelect?.map(_product => _product?.id).includes(product?.id)

                            const campaignVariants = product?.productVariants?.filter(variant => {
                                if (paramsQuery?.type) {
                                    if (paramsQuery?.type == 1) return !!variant?.sync_error_message
                                    if (paramsQuery?.type == 2) return !variant?.sync_error_message && variant?.sync_status == 2
                                    if (paramsQuery?.type == 3) return variant?.sync_status == 1
                                }

                                return true
                            })

                            const errorMessageProduct = values?.typeItem == 1
                                ? product?.sync_error_message
                                : product?.productVariants?.find(variant => !!variant?.sync_error_message)?.sync_error_message;

                            const imgOrigin = (product?.productAssets || []).find(_asset => _asset.type == 4)
                            const imgProduct = !!imgOrigin?.template_image_url ? imgOrigin : (product?.productAssets || []).find(_asset => _asset.type == 1);

                            return (
                                <>
                                    <tr>
                                        <td style={{ verticalAlign: 'top' }} rowSpan={values?.typeItem == 2 ? campaignVariants?.length + 1 : 1}>
                                            <Checkbox
                                                isSelected={isSelected}
                                                inputProps={{
                                                    'aria-label': 'checkbox',
                                                }}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setProductSelect(prevState => ([...prevState, product]))
                                                    } else {
                                                        setProductSelect(prevState => prevState.filter(_state => _state.id !== product?.id))
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td style={{ fontSize: '14px', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                                                <div style={{
                                                    backgroundColor: '#F7F7FA',
                                                    width: 68, height: 68,
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    minWidth: 68
                                                }} className='mr-6' >
                                                    {!!imgProduct && <HoverImage
                                                        placement="right"
                                                        defaultSize={{ width: 68, height: 68 }}
                                                        size={{ width: 320, height: 320 }}
                                                        url={imgProduct?.sme_url}
                                                    />}
                                                </div>
                                                <div className='w-100'>
                                                    <InfoProduct
                                                        name={product?.name}
                                                        short={true}
                                                        sku={product?.sku}
                                                        url={`/product-stores/edit/${product?.id}`}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <>
                                                {product?.productVariants?.length == 1 && <span>{formatNumberToCurrency(priceMinVariant)}đ</span>}
                                                {product?.productVariants?.length > 1 && <div className="d-flex justify-content-center">
                                                    <div className="d-flex flex-column align-items-start justify-content-center">
                                                        <span>{formatNumberToCurrency(minBy(product?.productVariants, 'price')?.price)}đ -</span>
                                                        <span>{formatNumberToCurrency(maxBy(product?.productVariants, 'price')?.price)}đ</span>
                                                    </div></div>}
                                            </>}
                                        </td>
                                        {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <>
                                                {values?.typeDiscount == 1 && <Field
                                                    style={{ fontSize: '14px', textAlign: 'center' }}
                                                    type='number'
                                                    isCampaign
                                                    name={`campaign-${product?.id}-discount-value`}
                                                    component={InputVertical}
                                                    disabled={isActionView}
                                                    onFocusChangeValue={(value) => {
                                                        setFieldValue(`campaign-${product.id}-promotion_price`, priceMinVariant - value)
                                                        setFieldValue(`campaign-${product.id}-discount-percent`, Math.ceil(value / priceMinVariant * 100))
                                                        if (value == '' || value < 1 || value >= priceMinVariant) {
                                                            setFieldValue(`campaign-${product.id}-promotion_price`, '')
                                                            setFieldValue(`campaign-${product.id}-discount-percent`, '')
                                                        }
                                                    }}
                                                    placeholder=""
                                                    required
                                                    addOnRight={'đ'}
                                                />}
                                                {values?.typeDiscount == 2 && <Field
                                                    style={{ fontSize: '14px', textAlign: 'center' }}
                                                    type='number'
                                                    isCampaign
                                                    name={`campaign-${product?.id}-discount-percent`}
                                                    disabled={isActionView}
                                                    onFocusChangeValue={(value) => {
                                                        setFieldValue(`campaign-${product.id}-promotion_price`, Math.ceil(priceMinVariant * (1 - value / 100)))
                                                        setFieldValue(`campaign-${product?.id}-discount-value`, priceMinVariant * value / 100)
                                                        if (value == '' || value < 1 || value > 99) {
                                                            setFieldValue(`campaign-${product.id}-promotion_price`, '')
                                                            setFieldValue(`campaign-${product?.id}-discount-value`, '')
                                                        }
                                                    }}
                                                    component={InputVertical}
                                                    placeholder=""
                                                    required
                                                    addOnRight={'%'}
                                                />}
                                                {(values[`campaign-${product?.id}-discount-percent`] > 20 && values[`campaign-${product?.id}-discount-percent`] <= 50) && <p style={{ color: '#9EA02D' }}>Mức khuyến mãi đang lớn hơn 20% so với giá bán</p>}
                                                {(values[`campaign-${product?.id}-discount-percent`] > 50 && values[`campaign-${product?.id}-discount-percent`] <= 80) && <p style={{ color: '#FE5629' }}>Mức khuyến mãi đang lớn hơn 50% so với giá bán</p>}
                                                {(values[`campaign-${product?.id}-discount-percent`] > 80 && values[`campaign-${product?.id}-discount-percent`] < 100) && <p style={{ color: '#F12020' }}>Mức khuyến mãi đang lớn hơn 80% so với giá bán</p>}
                                            </>}
                                        </td>}
                                        {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <Field
                                                style={{ fontSize: '14px', textAlign: 'center' }}
                                                type='number'
                                                isCampaign
                                                name={`campaign-${product?.id}-promotion_price`}
                                                disabled={isActionView}
                                                onFocusChangeValue={(value) => {
                                                    setFieldValue(`campaign-${product.id}-discount-percent`, Math.ceil(((priceMinVariant - value) / priceMinVariant) * 100))
                                                    setFieldValue(`campaign-${product?.id}-discount-value`, priceMinVariant - value)
                                                    if (value == '' || value < 1 || value >= priceMinVariant) {
                                                        setFieldValue(`campaign-${product.id}-discount-percent`, '')
                                                        setFieldValue(`campaign-${product?.id}-discount-value`, '')
                                                    }
                                                }}
                                                component={InputVertical}
                                                placeholder=""
                                                required
                                                addOnRight={'đ'}
                                            />}
                                            {values?.typeItem == 1 && values[`campaign-${product?.id}-promotion_price`] && priceMiniumVariant && (values[`campaign-${product?.id}-promotion_price`] < Number(priceMiniumVariant || 0)) && <p style={{ color: '#F12020' }}>{formatMessage({ defaultMessage: 'Giá sau giảm nhỏ hơn giá tối thiểu' })}</p>}
                                        </td>}
                                        <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <span>{totalSellableStockVariant}</span>}
                                        </td>
                                        {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <div className='d-flex'>
                                                <div style={{ width: '70%' }}>
                                                    <Select
                                                        id={`campaign-${product?.id}-purchase_limit`}
                                                        options={OPTIONS_TYPE_LIMIT}
                                                        isDisabled={isActionView}
                                                        value={values[`campaign-${product?.id}-purchase_limit`]}
                                                        onChange={(value) => {
                                                            setFieldValue(`campaign-${product?.id}-purchase_limit`, value)
                                                        }}
                                                    />
                                                </div>
                                                {values[`campaign-${product?.id}-purchase_limit`]?.value == 2 &&
                                                    <div style={{ width: '30%' }}>
                                                        <Field
                                                            name={`campaign-${product?.id}-purchase_limit_number`}
                                                            component={InputVertical}
                                                            disabled={isActionView}
                                                            placeholder=""
                                                            value={values[`campaign-${product?.id}-purchase_limit_number`]}
                                                        />
                                                    </div>
                                                }
                                            </div>}
                                        </td>}
                                        {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {values?.typeItem == 1 && <div className='d-flex'>
                                                <div style={{ width: '70%' }}>
                                                    <Select
                                                        id={`campaign-${product?.id}-quantity_per_user`}
                                                        options={OPTIONS_TYPE_LIMIT}
                                                        isDisabled={isActionView}
                                                        value={values[`campaign-${product?.id}-quantity_per_user`]}
                                                        onChange={(value) => {
                                                            setFieldValue(`campaign-${product?.id}-quantity_per_user`, value)
                                                        }}
                                                    />
                                                </div>
                                                {values[`campaign-${product?.id}-quantity_per_user`]?.value == 2 &&
                                                    <div style={{ width: '30%' }}>
                                                        <Field
                                                            name={`campaign-${product?.id}-quantity_per_user_number`}
                                                            max={product.sellable_stock}
                                                            disabled={isActionView}
                                                            component={InputVertical}
                                                            placeholder=""
                                                            value={values[`campaign-${product?.id}-quantity_per_user_number`]}
                                                        />
                                                    </div>
                                                }
                                            </div>}
                                        </td>}
                                        {values?.type != 'other' && <td style={{ fontSize: '14px', textAlign: 'center', borderBottom: values?.typeItem == 2 ? 'none' : 'unset' }}>
                                            {isEdit && values?.type != 'other' && paramsQuery?.type == 1 && values?.status != 1 ? (
                                                <Dropdown drop='down'
                                                    isDisabled={isActionView}
                                                >
                                                    <Dropdown.Toggle
                                                        className='btn-outline-secondary'
                                                        disabled={isActionView}
                                                        style={isActionView ? { cursor: 'not-allowed', opacity: 0.4 } : {}}
                                                    >
                                                        {formatMessage({ defaultMessage: `Chọn` })}
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu style={{ zIndex: 99 }}>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            setProductSelect(prev => prev.filter(item => item?.id != product?.id || item?.campaign_item_id != product?.campaign_item_id));
                                                            setCampaignItems(prev => prev.filter(item => item?.id != product?.id || item?.campaign_item_id != product?.campaign_item_id));
                                                        }} >
                                                            {formatMessage({ defaultMessage: 'Xóa' })}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const { data } = await retryCampaignItem({
                                                                variables: {
                                                                    campaign_id: values?.id,
                                                                    list_campaign_item_id: values?.typeItem == 1
                                                                        ? [product?.campaign_item_id]
                                                                        : product?.productVariants?.filter(variant => !!variant?.sync_error_message)?.map(item => item?.campaign_item_id)
                                                                }
                                                            })
                                                            if (data?.mktRetryCampaignItem?.success) {
                                                                addToast(formatMessage({ defaultMessage: 'Đồng bộ hàng hóa thành công' }), { appearance: 'success' })
                                                            } else {
                                                                addToast(data?.mktRetryCampaignItem?.message, { appearance: 'error' })
                                                            }
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Đồng bộ lại` })}
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            ) : (
                                                <button disabled={isActionView} style={{ backgroundColor: 'transparent' }} onClick={(e) => {
                                                    e.preventDefault()

                                                    setProductSelect(prev => prev.filter(item => item?.id != product?.id || item?.campaign_item_id != product?.campaign_item_id));
                                                    setCampaignItems(prev => prev.filter(item => item?.id != product?.id || item?.campaign_item_id != product?.campaign_item_id));
                                                }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash-fill cursor-pointer text-danger" viewBox="0 0 16 16">
                                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>}
                                    </tr>
                                    {values?.typeItem == 2 && campaignVariants?.map(variant => <tr>{buildProductVariants(variant, product)}</tr>)}
                                    {errorMessageProduct && paramsQuery?.type == 1 && <tr>
                                        <td colSpan={9} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)' }}>
                                            <div style={{
                                                paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                            }} >
                                                <p className="mt-0 mb-0"><span>{errorMessageProduct}</span></p>
                                            </div>

                                        </td>
                                    </tr>}
                                </>
                            );
                        }
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default memo(TableCampaignActions);