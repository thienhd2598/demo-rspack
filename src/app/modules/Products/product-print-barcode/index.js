import React, { useState, useCallback, memo, useMemo, Fragment, useLayoutEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useSubheader } from '../../../../_metronic/layout';
import { ArrowBackIos } from '@material-ui/icons';
import { Field, useFormikContext, Form, Formik } from "formik";
import * as Yup from "yup";
import { useHistory, useLocation } from 'react-router-dom';
import SectionPrintBarcode from './components/SectionPrintBarcode';
import SectionPrintSample from './components/SectionPrintSample';
import SectionPrintSize from './components/SectionPrintSize';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { useApolloClient } from '@apollo/client';
import mutate_userGenerateBarcodePrint from '../../../../graphql/mutate_userGenerateBarcodePrint';
import LoadingPrintDialog from './dialogs/LoadingPrintDialog';
import { useToasts } from 'react-toast-notifications';
import { formatNumberToCurrency } from '../../../../utils';
import ModalPrintResults from './dialogs/ModalPrintResults';

const useAbortableMutation = (mutation) => {
    const client = useApolloClient();
    const controller = useRef(new window.AbortController());
    const [data, setData] = useState();
    const [error, setError] = useState();
    const [loading, setLoading] = useState(false);

    const request = useCallback(
        async (options) => {
            try {
                setLoading(true);
                controller.current = new window.AbortController();
                const res = await client.mutate({
                    ...options,
                    mutation,
                    // refetchQueries: ['scGetOrders'],
                    context: { ...options.context, fetchOptions: { signal: controller.current.signal } },
                    errorPolicy: 'all',
                });
                setData(res.data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error);
                }
            } finally {
                setLoading(false);
            }
        },
        [client, mutation],
    );

    const abort = useCallback(() => {
        if (!controller.current.signal.aborted) {
            controller.current.abort();
            setLoading(false);
        }
    }, [controller]);

    return [request, { data, error, loading }, abort];
}

const CONFIG_SWITCH = [
    { key: 'name', title: 'Tên hàng hóa', isDefault: true, defaultName: 'Sản phẩm A' },
    { key: 'variant', title: 'Phân loại', isDefault: true, defaultName: 'Đỏ-XL' },
    { key: 'sku', title: 'Mã SKU', isDefault: true, defaultName: 'sku_123' },
    { key: 'gtin', title: 'GTIN', isDefault: false, defaultName: 'gtin_123' },
    { key: 'price', title: 'Giá bán', isDefault: true, defaultName: '100,000đ' },
];

const TYPE_BARCODE = [
    { value: 'sku', label: 'SKU' },
    { value: 'gtin', label: 'GTIN' },
];

const ProductPrintBarcode = () => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const [validateSchema, setValidateSchema] = useState(null);
    const [idsRemove, setIdsRemove] = useState([]);
    const [productsFiltered, setProductsFiltered] = useState(location?.state?.products || []);
    const [showResults, setShowResults] = useState(null);
    console.log('productsFiltered', productsFiltered)
    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'In mã vạch' }) },
        ])
    }, []);

    const [mutate, { loading: loadingUserGenerateBarcodePrint, data }, abort] = useAbortableMutation(mutate_userGenerateBarcodePrint);

    useMemo(() => {
        if (!!data?.userGenerateBarcodePrint) {
            setShowResults(data?.userGenerateBarcodePrint);
        }
    }, [data]);

    const initialValues = useMemo(() => {
        if (!location?.state?.products) return null;
        let schema = {};
        const initalState = location?.state?.products?.reduce((result, value) => {
            result[`variant-${value?.variant?.id}-${value?.sme_store_id}`] = value?.stock_actual || 0;

            schema[`variant-${value?.variant?.id}-${value?.sme_store_id}`] = Yup.number()
                .min(1, formatMessage({ defaultMessage: "Số lượng tem tối thiểu bằng {min}" }, { min: 1 }))
                // .max(1000, formatMessage({ defaultMessage: "Số lượng tem tối đa bằng {max}" }, { max: '1.000' }))
                .required(formatMessage({ defaultMessage: "Vui lòng nhập số lượng tem" }))

            return result;
        }, {});

        const configSwitch = CONFIG_SWITCH.reduce((result, value) => {
            result[`config-${value.key}`] = value.isDefault

            return result;
        }, {});

        setValidateSchema(Yup.object().shape(schema));
        return {
            ...initalState,
            ...configSwitch,
            ['type-barcode']: TYPE_BARCODE[0].value
        };
    }, [location?.state]);

    console.log({ productsFiltered })

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "In mã vạch" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "In mã vạch" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "In mã vạch" }) + " - UpBase"} />
            </Helmet>

            <Formik
                initialValues={initialValues}
                validationSchema={validateSchema}
                enableReinitialize
            >
                {({
                    handleSubmit,
                    values,
                    setFieldValue,
                    validateForm
                }) => {
                    const totalStamp = (location?.state?.products || []).reduce((result, value) => {
                        const codeStamp = `${value?.variant?.id}-${value?.sme_store_id}`;
                        const isExist = !idsRemove?.some(id => id == codeStamp);

                        if (isExist) {
                            result += values[`variant-${value?.variant?.id}-${value?.sme_store_id}`] || 0
                        }

                        return result;
                    }, 0);

                    const configValues = CONFIG_SWITCH.map(config => ({
                        key: `config-${config.key}`,
                        value: values[`config-${config.key}`]
                    }));

                    const configEnable = configValues?.filter(config => !!config?.value);

                    const disablePrintPdf = productsFiltered?.filter(item => !idsRemove?.some(id => id == `${item?.variant?.id}-${item?.sme_store_id}`))?.length == 0
                        || configEnable?.length > values[`max-attributes-config`]

                    return (
                        <Fragment>
                            {/* <RouterPrompt
                                when={values['__changed__']}
                                title={formatMessage({ defaultMessage: "Bạn đang tạo sản phẩm. Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                                cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                                okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                                onOK={() => true}
                                onCancel={() => false}
                            /> */}
                            {loadingUserGenerateBarcodePrint && <LoadingPrintDialog
                                show={loadingUserGenerateBarcodePrint}
                                totalStamp={totalStamp}
                                totalVariant={productsFiltered?.filter(item => !idsRemove?.some(id => id == `${item?.variant?.id}-${item?.sme_store_id}`))?.length}
                                onHide={() => {
                                    abort();
                                }}
                            />}
                            {!!showResults && <ModalPrintResults
                                totalVariant={productsFiltered?.filter(item => !idsRemove?.some(id => id == `${item?.variant?.id}-${item?.sme_store_id}`))?.length}
                                totalStamp={totalStamp}
                                showResults={showResults}
                                onHide={() => setShowResults(null)}
                            />}
                            <div className="mb-4">
                                <a
                                    href="/products/stocks"
                                    style={{ color: "#ff5629" }}
                                >
                                    <ArrowBackIos />
                                    <span>
                                        {formatMessage({ defaultMessage: "Quay lại" })}
                                    </span>
                                </a>
                            </div>
                            <div className='row'>
                                <div className='col-8'>
                                    <div className='d-flex flex-column'>
                                        <SectionPrintBarcode
                                            products={productsFiltered}
                                            totalStamp={totalStamp}
                                            idsRemove={idsRemove}
                                            setIdsRemove={setIdsRemove}
                                        />
                                        <SectionPrintSize
                                            configSwitch={CONFIG_SWITCH}
                                            typeBarcode={TYPE_BARCODE}
                                        />
                                    </div>
                                </div>
                                <div className='col-4'>
                                    <SectionPrintSample />
                                </div>
                                <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                    <button
                                        className="btn btn-primary"
                                        type="submit"
                                        style={{ width: 150, cursor: disablePrintPdf ? 'not-allowed' : 'pointer' }}
                                        disabled={disablePrintPdf}
                                        onClick={async () => {
                                            let error = await validateForm(values);

                                            Object.keys(error).forEach(key => {
                                                const existKeyRemove = idsRemove?.some(id => `variant-${id}` == key);

                                                if (existKeyRemove) delete error[key];
                                                return;
                                            })

                                            if (Object.values(error).length > 0) {
                                                handleSubmit();
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (totalStamp > 2000) {
                                                addToast(formatMessage({ defaultMessage: 'Chỉ được in tối đa 2000 tem' }), { appearance: 'error' })
                                                return;
                                            }

                                            const productsPayload = productsFiltered
                                                ?.filter(item => !idsRemove?.some(id => id == `${item?.variant?.id}-${item?.sme_store_id}`))
                                                ?.map(item => ({
                                                    attributes: {
                                                        ...(!!values[`config-name`] ? {
                                                            name: item?.variant?.sme_catalog_product?.name
                                                        } : {}),
                                                        ...(!!values[`config-variant`] && item?.variant?.attributes?.length > 0 ? {
                                                            variant_name: item?.variant?.name
                                                        } : {}),
                                                        ...(!!values[`config-sku`] ? {
                                                            sku: item?.variant?.sku
                                                        } : {}),
                                                        ...(!!values[`config-gtin`] ? {
                                                            gtin: item?.variant?.gtin
                                                        } : {}),
                                                        ...(!!values[`config-price`] ? {
                                                            price: `${formatNumberToCurrency(item?.variant?.price)}đ`
                                                        } : {}),
                                                    },
                                                    barcode: values['type-barcode'] == 'sku' ? item?.variant?.sku : item?.variant?.gtin,
                                                    quantity: values[`variant-${item?.variant?.id}-${item?.sme_store_id}`],
                                                    sku: item?.variant?.sku,
                                                    variantId: item?.variant?.id,
                                                }))

                                            const body = {
                                                configId: values[`barcode-print-config`],
                                                products: productsPayload
                                            };

                                            await mutate({
                                                variables: {
                                                    userGenerateBarcodePrintInput: body
                                                }
                                            });
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Xuất file PDF' })}
                                    </button>
                                </div>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik >
        </Fragment >
    )
};

export default memo(ProductPrintBarcode);
