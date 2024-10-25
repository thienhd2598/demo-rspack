import React, { memo } from 'react';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';
import query_sme_barcode_print_config from '../../../../../graphql/query_sme_barcode_print_config';
import { useQuery } from '@apollo/client';
import { useFormikContext } from 'formik';

const SectionPrintSample = () => {
    const { formatMessage } = useIntl();
    const { setFieldValue, values } = useFormikContext();

    const { data: dataBarcodePrintConfig, loading: loadingBarcodePrintConfig } = useQuery(query_sme_barcode_print_config, {
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {
            const barcodePrintConfigDefault = data?.sme_barcode_print_config?.find(config => !!config?.is_default);

            setFieldValue(`barcode-print-config`, barcodePrintConfigDefault?.id);
            setFieldValue(`max-attributes-config`, barcodePrintConfigDefault?.attribute_count);
        }
    });

    return (
        <Card>
            <CardHeader
                title={formatMessage({ defaultMessage: "Khổ in" })}
            />
            <CardBody>
                {!!loadingBarcodePrintConfig && (
                    <div className='d-flex align-items-center justify-content-center' style={{ minHeight: 200 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}                
                {!loadingBarcodePrintConfig && (
                    <div className='d-flex justify-content-between align-items-center flex-wrap'>
                        {dataBarcodePrintConfig?.sme_barcode_print_config?.map(config => {
                            return (
                                <div className='d-flex flex-column align-items-center justify-content-center mb-10' key={``} style={{ maxWidth: '50%' }}>
                                    <div className='image-config-wrapper mb-4'>
                                        <img
                                            src={config?.paper_preview_link}
                                            style={{ objectFit: config?.column >= 5 ? 'contain' : 'cover' }}
                                            className="image-config"
                                        />
                                    </div>
                                    <div className='d-flex align-items-center justify-content-center'>
                                        <label key={`barcode-print-config-${config?.id}`} className="radio mr-1">
                                            <input
                                                type="radio"
                                                name='address'
                                                onChange={() => {
                                                    setFieldValue(`max-attributes-config`, config?.attribute_count);
                                                    setFieldValue(`barcode-print-config`, config?.id)
                                                }}
                                                checked={values[`barcode-print-config`] == config?.id}
                                            />
                                            <span></span>
                                        </label>
                                        <span>{config?.name}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardBody>
        </Card>
    )
};

export default memo(SectionPrintSample);