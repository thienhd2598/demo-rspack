import React, { memo, useMemo } from 'react';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';
import { Field, useFormikContext } from 'formik';
import { Switch } from '../../../../../_metronic/_partials/controls/forms/Switch';
import { useMutation } from '@apollo/client';
import mutate_userPreviewBarcodePrint from '../../../../../graphql/mutate_userPreviewBarcodePrint';
import clsx from 'clsx';

const MAX_CONFIG = 3;

const SectionPrintSize = ({ configSwitch, typeBarcode }) => {
    const { formatMessage } = useIntl();
    const { values, setFieldValue } = useFormikContext();

    const [previewBarcodePrint, { loading: loadingPreviewBarcodePrint, data: dataPreviewBarcodePrint }] = useMutation(mutate_userPreviewBarcodePrint);

    const [totalConfigEnable, disabelConfigSwitch] = useMemo(() => {
        const configValues = configSwitch.map(config => ({
            key: `config-${config.key}`,
            value: values[`config-${config.key}`]
        }));

        const configEnable = configValues?.filter(config => !!config?.value);

        return [configEnable?.length, configEnable?.length >= values[`max-attributes-config`]]
    }, [values, configSwitch]);

    useMemo(async () => {
        await previewBarcodePrint({
            variables: {
                userPreviewBarcodePrintInput: {
                    configId: values[`barcode-print-config`],
                    barcode: values['type-barcode'] == 'sku' ? configSwitch[2].defaultName : configSwitch[3].defaultName,
                    attributes: {
                        ...(!!values[`config-name`] ? { name: configSwitch[0].defaultName } : {}),
                        ...(!!values[`config-variant`] ? { variant_name: configSwitch[1].defaultName } : {}),
                        ...(!!values[`config-sku`] ? { sku: configSwitch[2].defaultName } : {}),
                        ...(!!values[`config-gtin`] ? { gtin: configSwitch[3].defaultName } : {}),
                        ...(!!values[`config-price`] ? { price: configSwitch[4].defaultName } : {}),
                    },
                }
            }
        })
    }, [
        values[`barcode-print-config`],
        values[`type-barcode`],
        ...configSwitch.map(config => values[`config-${config.key}`])
    ]);

    return (
        <Card>
            <CardHeader
                title={formatMessage({ defaultMessage: "Mẫu tem in" })}
            />
            <CardBody>
                <div className='row'>
                    <div className='col-4'>
                        <div className='d-flex flex-column'>
                            {configSwitch.map(config => (
                                <div className='d-flex align-items-center mb-2'>
                                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                disabled={disabelConfigSwitch && !values[`config-${config.key}`]}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={() => setFieldValue(`config-${config.key}`, !values[`config-${config.key}`])}
                                                checked={!!values[`config-${config.key}`]}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                    <span className='ml-2'>{config?.title}</span>
                                </div>
                            ))}
                            <span className={clsx('mt-2', { 'text-danger': values[`max-attributes-config`] > 0 && totalConfigEnable > (values[`max-attributes-config`] || 0) })}>
                                {formatMessage({ defaultMessage: 'Thông tin hiển thị: {count}/{max}' }, { count: totalConfigEnable, max: values[`max-attributes-config`] || 0 })}
                            </span>
                            {values[`max-attributes-config`] > 0 && totalConfigEnable > (values[`max-attributes-config`] || 0) && (
                                <span className='mt-1 text-danger'>
                                    {formatMessage({ defaultMessage: 'Chọn tối đa {count} thông tin' }, { count: values[`max-attributes-config`] || 0 })}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className='col-8 d-flex justify-content-center'>
                        {loadingPreviewBarcodePrint && <div className='d-flex align-items-center justify-content-center'>
                            <span className="spinner spinner-primary" />
                        </div>}
                        {!loadingPreviewBarcodePrint && !!dataPreviewBarcodePrint?.userPreviewBarcodePrint && (
                            <div
                                className='preview-barcode d-flex align-items-center justify-content-center'
                                dangerouslySetInnerHTML={{
                                    __html: dataPreviewBarcodePrint?.userPreviewBarcodePrint?.data
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className='row mt-4 mb-2'>
                    <div className='col-4'></div>
                    <div className='col-8 d-flex justify-content-center'>
                        <div className='d-flex align-items-center' style={{ gap: 30 }}>
                            {typeBarcode.map(config => (
                                <div className='d-flex align-items-center justify-content-center'>
                                    <label key={`type-barcode-${config?.value}`} className="radio mr-1">
                                        <input
                                            type="radio"
                                            onChange={() => setFieldValue(`type-barcode`, config?.value)}
                                            checked={values[`type-barcode`] == config?.value}
                                        />
                                        <span></span>
                                    </label>
                                    <span>{config?.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
};

export default memo(SectionPrintSize);