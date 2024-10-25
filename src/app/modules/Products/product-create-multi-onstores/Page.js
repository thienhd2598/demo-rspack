/*
 * Created by duydatpham@gmail.com on 24/02/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useCreateMultiContext } from "./CreateMultiContext";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import { useHistory } from "react-router-dom";
import { parseSchemaProductConnectorFromProduct } from "../../../../utils";
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { useIntl } from "react-intl";

export default memo(() => {
    const { step, setProducts, setStep, stepPassed, setCacheStep1 } = useCreateMultiContext()
    const history = useHistory()
    const { formatMessage } = useIntl()
    console.log(history?.location?.state)
    useMemo(() => {
        const { products, channels } = history?.location?.state || {};
        let _products = [];

        (products || []).forEach(_pro => {
            const newVariantArray = _pro?.sme_catalog_product_variants?.filter(variant => !variant?.product_status_id)
            let _product = {
                raw: {
                    ..._pro,
                    sme_catalog_product_variants: newVariantArray
                }
            };
            (channels || []).forEach(_channel => {
                _products.push({
                    ..._product,
                    ...parseSchemaProductConnectorFromProduct(_pro, _channel),
                    merge_price: 0,
                    merge_stock: 0,
                    channel: _channel
                })
            });
        });        
        setProducts(_products)
    }, [history?.location?.state])


    const getStyle = useCallback((curr) => {
        if (curr == step) {
            return { fontWeight: 'bold', fontSize: 14, color: '#FE5629', cursor: 'pointer' }
        }
        return { fontWeight: 'normal', fontSize: 14, cursor: 'pointer', opacity: stepPassed[`step${curr}`] ? 1 : 0.3 }
    }, [step, stepPassed])


    return <div>
        <Helmet
            titleTemplate={formatMessage({ defaultMessage: "Thêm sản phẩm sàn hàng loạt" }) + "- UpBase"}
            defaultTitle={formatMessage({ defaultMessage: "Thêm sản phẩm sàn hàng loạt" }) + "- UpBase"}
        >
            <meta name="description" content={formatMessage({ defaultMessage: "Thêm sản phẩm sàn hàng loạt" }) + "- UpBase"} />
        </Helmet>
        <div style={{
            textAlign: 'center',
            marginBottom: 16
        }} >
            <span style={getStyle(0)} onClick={e => {
                stepPassed?.step0 && step != 0 && setStep(0)
            }} >1. {formatMessage({ defaultMessage: "Chọn ngành hàng" })}</span>
            <img src={toAbsoluteUrl('/media/line.svg')} style={{ marginLeft: 12, marginRight: 12 }} />
            <span style={getStyle(1)} onClick={e => {
                stepPassed?.step1 && step != 1 && setStep(1)
            }} >2. {formatMessage({ defaultMessage: "Chỉnh sửa thuộc tính" })}</span>
            <img src={toAbsoluteUrl('/media/line.svg')} style={{ marginLeft: 12, marginRight: 12 }} />
            <span style={getStyle(2)} onClick={e => {
                stepPassed?.step2 && step != 2 && setStep(2)
            }} >3. {formatMessage({ defaultMessage: "Chỉnh sửa thông tin hàng loạt" })}</span>
        </div>
        {step == 0 && <Step1 />}
        {step == 1 && <Step2 />}
        {step == 2 && <Step3 />}
        <div
            id="kt_scrolltop1"
            className="scrolltop"
            style={{ bottom: 80 }}
            onClick={() => {
                window.scrollTo({
                    letf: 0,
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }}
        >
            <span className="svg-icon">
                <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
            </span>{" "}
        </div>
    </div>
})