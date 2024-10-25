import { useQuery } from '@apollo/client';
import { Field, useFormikContext } from 'formik';
import React, { memo, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Select from 'react-select';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { RadioGroup } from '../../../../../_metronic/_partials/controls/forms/RadioGroup';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import query_coGetPackage from '../../../../../graphql/query_coGetPackage';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import useScanDetection from '../../../../../hooks/useScanDetection';
import { OPTIONS_PROTOCOL, OPTIONS_SCAN } from '../OrderProcessFailDeliveryHelper';
import { useOrderProcessContext } from '../context';
import LoadingDialog from '../../../Products/product-edit/LoadingDialog';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';

const OrderInfoProcess = () => {
    const { setFieldValue, onToggleModal } = useFormikContext();
    const { setOrdersAdd } = useOrderProcessContext();
    const { formatMessage } = useIntl();

    const [searchType, setSearchType] = useState(OPTIONS_SCAN[0].value);
    const [search, setSearch] = useState(null);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network",
    });

    const { data: dataPackage, loading: loadingPackage, refetch: refetchLoadOrder } = useQuery(query_coGetPackage, {
        variables: {
            q: search,
            search_type: searchType,
        },
        fetchPolicy: 'cache-and-network',
        skip: search === undefined || search === '' || search === null,
        onCompleted: (data) => {
            if (!!data?.coGetPackage) {
                setOrdersAdd(prev => prev.concat({ ...data?.coGetPackage }))
            }
        }
    });


    const optionsWarehouse = useMemo(
        () => {
            if (!dataWarehouse?.sme_warehouses) return [];

            const options = dataWarehouse?.sme_warehouses?.map(warehouse => {
                return {
                    label: warehouse.name,
                    value: warehouse.id,
                };
            });
            setFieldValue('warehouse', options[0]);

            return options;
        }, [dataWarehouse]
    );

    useScanDetection({
        onComplete: async (value) => setSearch(value)
    });


    const selectedOptionScan = useMemo(
        () => {
            return OPTIONS_SCAN.find(op => op.value == searchType)
        }, [searchType]
    );

    return (
        <Card className="mb-4">
            <LoadingDialog show={loadingPackage} />
            <CardHeader title={formatMessage({ defaultMessage: "Thông tin xử lý" })} />
            <CardBody>
                <div className='row d-flex align-items-center my-4'>
                    <div className='col-4'>
                        <div className="row d-flex align-items-center mb-4">
                            <div className="col-4">
                                <span>
                                    {formatMessage({ defaultMessage: 'Kho nhận hàng' })}: <span className="text-danger">*</span>
                                </span>
                            </div>
                            <div className="col-8 field-center">
                                <Field
                                    name="warehouse"
                                    component={ReSelectVertical}
                                    onChange={() => {
                                        setFieldValue("__changed__", true);
                                    }}
                                    required
                                    placeholder=""
                                    label={""}
                                    customFeedbackLabel={" "}
                                    options={optionsWarehouse}
                                    isClearable={false}
                                />
                            </div>
                        </div>
                    </div>
                    <div className='col-2'></div>
                    <div className='col-4'>
                        <div className="row mb-2 d-flex align-items-center">
                            {/* <div className="col-4"> */}
                            <span>{formatMessage({ defaultMessage: 'Hình thức nhập kho' })}:</span>
                            {/* </div> */}
                            <div className="col-8 field-center">
                                <Field
                                    name="protocol"
                                    component={RadioGroup}
                                    customFeedbackLabel={" "}
                                    disabled={false}
                                    options={OPTIONS_PROTOCOL}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='row' >
                    <div className='col-8'>
                        <div className='row'>
                            <div className='col-4 pr-0' style={{ zIndex: 2 }}>
                                <Select
                                    options={OPTIONS_SCAN}
                                    className='w-100 custom-select-order'
                                    theme={(theme) => ({
                                        ...theme,
                                        borderRadius: 0,
                                        colors: {
                                            ...theme.colors,
                                            primary: '#ff5629'
                                        }
                                    })}
                                    value={selectedOptionScan}
                                    onChange={value => {
                                        setSearchType(value?.value || undefined);
                                    }}
                                    formatOptionLabel={(option) => {
                                        return <div>{option.label}</div>
                                    }}
                                />
                            </div>
                            <div className="col-8 pl-0" style={{ height: 'fit-content' }} >
                                <input
                                    // ref={inputRefOrder}
                                    type="text"
                                    className="form-control"
                                    placeholder={formatMessage(selectedOptionScan.placeholder)}
                                    style={{ height: 37, borderRadius: 0, fontSize: '15px', textAlign: 'center' }}
                                    onKeyDown={e => {
                                        if (e.keyCode == 13 && e.target.value) {
                                            setSearch(e.target.value);
                                        }
                                    }}
                                />                                
                            </div>
                        </div>
                    </div>
                    <div className='col-4 d-flex justify-content-end'>
                        <button
                            className="btn btn-outline-primary btn-elevate mr-2 d-flex align-items-center btn-icon-upload px-4"
                            onClick={e => {
                                e.preventDefault();

                            }}
                        >
                            <svg color="#ff572c" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-upload" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                                <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z" />
                            </svg>
                            <span className='ml-2'>
                                {formatMessage({ defaultMessage: 'Nhập file' })}
                            </span>
                        </button>
                    </div>
                </div>
            </CardBody>
        </Card>
    )
};

export default memo(OrderInfoProcess);