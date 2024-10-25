import React, { memo, useMemo } from "react";
import InfoProduct from "../../../../../components/InfoProduct";
import { Field } from "formik";
import { InputVerticalWithIncrease } from "../../../../../_metronic/_partials/controls";

const OrderRowProcess = ({ key, order, orderItem, store }) => {
    const buildVariantCombo = useMemo(() => {
        return (
            <>
                <tr style={{ borderRight: '0.5px solid #cbced4' }}>
                    <td
                        colSpan={3}
                        className="d-flex align-items-center"
                        style={{ verticalAlign: "top", width: "150%", border: 'none' }}
                    >
                        <div>
                            <InfoProduct short={true} sku={orderItem?.sme_variant?.sku} textTruncateSku={true} />
                        </div>
                        <span
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                // setDataCombo(order?.productVariant?.combo_items)
                            }}
                            className="ml-4 text-primary"
                        >
                            Combo
                        </span>
                    </td>
                </tr>
                {orderItem?.comboItems?.map((_combo, index) => {
                    return (
                        <tr key={`combo-item-${index}`}>
                            <td className="d-flex" style={{ verticalAlign: "top", border: 'none', borderTop: '0.5px solid #cbced4' }}>
                                <div
                                    style={{
                                        backgroundColor: "#F7F7FA",
                                        width: 60,
                                        height: 60,
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        minWidth: 60,
                                        cursor: "pointer",
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                    }}
                                    className="mr-6"
                                >
                                    {
                                        <img
                                            src={_combo?.smeVariant?.image}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: "contain",
                                            }}
                                        />
                                    }
                                </div>
                                <div>
                                    <div style={{ wordWrap: "break-word" }} className="mt-1 mb-2">
                                        <InfoProduct short={true} sku={_combo?.smeVariant?.sku} textTruncateSku={true} />
                                    </div>
                                    <span className="text-secondary-custom fs-12">
                                        {_combo?.smeVariant?.attributes.length > 0 ? _combo?.smeVariant?.name?.replaceAll(' - ', ' + ') : ''}
                                    </span>
                                </div>
                            </td>
                            <td className="text-center" style={{ verticalAlign: "top" }}>
                                {_combo?.quantity}
                            </td>
                            <td className="text-center" style={{ verticalAlign: "top" }}>
                                <Field
                                    name={`order-combo-${order?.id}-${orderItem?.id}-${_combo?.id}-quantity`}
                                    component={InputVerticalWithIncrease}
                                    label={""}
                                    required={false}
                                    customFeedbackLabel={" "}
                                    cols={["", "col-12"]}
                                    countChar
                                    maxChar={"255"}
                                    rows={4}
                                />
                            </td>
                        </tr>
                    );
                })}
            </>
        );
    }, [order, orderItem]);

    return (
        <>
            <tr
                key={`product-variant-return-order-${order?.id}`}
                style={{
                    borderBottom: "1px solid #D9D9D9",
                    borderTop: "1px solid #D9D9D9",
                }}
            >
                <td
                    rowSpan={orderItem?.is_combo ? orderItem?.comboItems?.length + 2 : 1}
                    style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9" }}
                >
                    <div className="d-flex row w-100 m-0 p-1">
                        <div
                            className="col-10"
                            style={{
                                verticalAlign: "top",
                                display: "flex",
                                flexDirection: "row",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "#F7F7FA",
                                    width: 60,
                                    height: 60,
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    minWidth: 60,
                                    cursor: "pointer",
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                }}
                                className="mr-6"
                            >
                                {
                                    <img
                                        src={orderItem?.sc_variant?.image}
                                        style={{ width: 60, height: 60, objectFit: "contain" }}
                                    />
                                }
                            </div>
                            <div>
                                <div>
                                    <InfoProduct
                                        short={true}
                                        name={orderItem?.sc_variant?.name}
                                        url={() => {
                                            // detailsProductOnSeller(
                                            //     order?.connector_channel_code,
                                            //     returnOrder?.order?.ref_store_id,
                                            //     order?.ref_product_id,
                                            //     order?.ref_variant_id
                                            // );
                                        }}
                                        productOrder={true}
                                    />
                                </div>

                                <div style={{ wordWrap: "break-word" }} className="mt-1 mb-2">
                                    <InfoProduct short={true} sku={orderItem?.sc_variant?.sku} textTruncateSku={true} />
                                </div>
                                <span className="text-secondary-custom fs-12">
                                    {orderItem?.sc_variant?.name}
                                </span>
                            </div>
                        </div>
                        <div className="col-2 px-0" style={{ wordBreak: 'break-word' }}>
                            <span style={{ fontSize: 12 }} className="mr-1">
                                x
                            </span>
                            {orderItem?.quantity_purchased}
                        </div>
                    </div>
                </td>
                {!orderItem?.is_combo && (
                    <>
                        <td style={{ verticalAlign: "top" }}>
                            <div className="d-flex align-items-center">
                                <div
                                    style={{
                                        backgroundColor: "#F7F7FA",
                                        width: 60,
                                        height: 60,
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        minWidth: 60,
                                        cursor: "pointer",
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                    }}
                                    className="mr-6"
                                >
                                    {
                                        <img
                                            src={orderItem?.sme_variant?.image}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                objectFit: "contain",
                                            }}
                                        />
                                    }
                                </div>
                                <div>
                                    <div className="mt-1 mb-2">
                                        <InfoProduct short={true} sku={orderItem?.sme_variant?.sku} textTruncateSku={true} />
                                    </div>
                                    <span className="text-secondary-custom fs-12">
                                        {orderItem?.sme_variant?.attributes.length > 0 ? orderItem?.sme_variant?.name?.replaceAll(' - ', ' + ') : ''}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td className="text-center" style={{ verticalAlign: "top" }}>
                            {orderItem?.sme_variant?.quantity_purchased}
                        </td>
                        <td className="text-center" style={{ verticalAlign: "top" }}>
                            <Field
                                name={`order-${order?.id}-${orderItem?.id}-quantity`}
                                component={InputVerticalWithIncrease}
                                label={""}
                                required={false}
                                customFeedbackLabel={" "}
                                cols={["", "col-12"]}
                                countChar
                                maxChar={"255"}
                                rows={4}
                            />
                        </td>
                    </>
                )}
            </tr >
            {
                orderItem?.is_combo ? (
                    <>
                        {buildVariantCombo}
                    </>
                ) : (
                    <></>
                )}
        </>
    )
};

export default memo(OrderRowProcess);