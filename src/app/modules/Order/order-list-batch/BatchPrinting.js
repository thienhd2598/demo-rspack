import { useMutation } from '@apollo/client';
import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import mutate_coPrintShipmentPackage from '../../../../graphql/mutate_coPrintShipmentPackage';
import mutate_coActionPackageViaFilter from '../../../../graphql/mutate_coActionPackageViaFilter';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import ModalPrintResults from '../dialog/ModalPrintResults';
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation } from 'react-router-dom';
import {useIntl} from 'react-intl'
import LoadingPrintDialog from './components/LoadingPrintDialog';
import { useCallback, useRef } from 'react';
import { useApolloClient } from '@apollo/client';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

export function useAbortableMutation(mutation) {
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
                    refetchQueries: ['scGetPackages'],
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

const BatchPrinting = ({ ids, total, whereCondition, status, setIds }) => {
    const { formatMessage } = useIntl();
    const [optionPrint, setOptionPrint] = useState([]);
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [totalOrder, setTotalOrder] = useState(0)
    const { addToast } = useToasts();
    const params = queryString.parse(useLocation().search.slice(1, 100000));

    useEffect(() => {
        setOptionPrint([])
    }, [params.type]);

    let OPTIONS_TYPE_PRINT = useMemo(() => {
        if (status == 'packed') {
            return [
                {
                    value: 1,
                    label: formatMessage({defaultMessage: "In vận đơn"})
                },
                {
                    value: 2,
                    label: formatMessage({defaultMessage:"In phiếu xuất"})
                },
                {
                    value: 16,
                    label: formatMessage({defaultMessage:"In phiếu nhặt hàng"})
                },

                {
                    value: 4,
                    label: formatMessage({defaultMessage:"In biên bản bàn giao"})
                },
                {
                    value: 32,
                    label: formatMessage({defaultMessage:"In phiếu đóng hàng"})
                },
            ]
        }
        return [
            {
                value: 1,
                label: formatMessage({defaultMessage:"In vận đơn"})
            },
            {
                value: 16,
                label: formatMessage({defaultMessage:"In phiếu nhặt hàng"})
            },
            {
                value: 32,
                label: formatMessage({defaultMessage:"In phiếu đóng hàng"})
            },
        ]
    }, [status])



    const [mutate, { loading: loadingCoPrintShipmentPackage, data: dataCoPrintShipmentPackage }, abort] = useAbortableMutation(mutate_coPrintShipmentPackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages']
    });

    const [coActionPackageViaFilter, { loading: loadingCoActionPackageViaFilter, data: dataCoActionPackageViaFilter }, abortFilter] = useAbortableMutation(mutate_coActionPackageViaFilter, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages'],
    })

    useMemo(() => {
        if (!dataCoPrintShipmentPackage?.coPrintShipmentPackage) return;

        setIds([]);
        if (dataCoPrintShipmentPackage?.coPrintShipmentPackage?.success == 1) {
            setShowResults(dataCoPrintShipmentPackage?.coPrintShipmentPackage?.data)
        } else {
            addToast(dataCoPrintShipmentPackage?.coPrintShipmentPackage?.message, { appearance: 'error' });
        }
    }, [dataCoPrintShipmentPackage]);

    useMemo(() => {
        if (!dataCoActionPackageViaFilter?.coActionPackageViaFilter) return;

        if (dataCoActionPackageViaFilter?.coActionPackageViaFilter?.success == 1) {
            setShowResults(dataCoActionPackageViaFilter?.coActionPackageViaFilter?.data)
        } else {
            addToast(dataCoActionPackageViaFilter?.coActionPackageViaFilter?.message, { appearance: 'error' });
        }
    }, [dataCoActionPackageViaFilter])

    const coPrintShipmentPackage = async () => {
        setLoading(true)
        let variables = {
            list_package: ids.map(_ord => ({ package_id: _ord.id })),
            list_print_type: optionPrint
        }

        await mutate({variables: variables})
    }

    const coActionPackViaFilter = async () => {
        setLoading(true)
        let variables = {
            action_type: 2,
            list_print_type: optionPrint,
            search: whereCondition
        }

        await coActionPackageViaFilter({variables: variables});        
    }

    return (
        <div>
            {<LoadingPrintDialog
                show={loadingCoPrintShipmentPackage || loadingCoActionPackageViaFilter}
                total={totalOrder}
                onHide={() => {
                    if (loadingCoPrintShipmentPackage) {
                        setIds([]);
                        abort()
                    };
                    if (loadingCoActionPackageViaFilter) abortFilter();
                }}
            />}
            { <ModalPrintResults
                 onHide={() => {
                    setShowResults(false)
                }} 
                totalOrder={totalOrder} 
                status={status} 
                showResults={showResults} 
                optionPrint={optionPrint} 
                />
            }
            <Card className="mb-0">
            <div style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }} className="card-header">
            {formatMessage({defaultMessage:'In phiếu hàng loạt'})}
                </div>
                <CardBody>
                    <AuthorizationWrapper keys={['order_list_batch_ticket_print_multiple']}>
                        <div>
                            <div className="radio-list mb-2 pb-2 border-bottom">
                                {OPTIONS_TYPE_PRINT?.map(_option => {
                                    return (
                                        <div className="mb-2">
                                            <Checkbox
                                                key={_option.value}
                                                inputProps={{
                                                    'aria-label': 'checkbox'
                                                }}
                                                title={_option.label}
                                                isSelected={optionPrint?.find(element => element == _option.value) ? true : false}
                                                onChange={(e) => {
                                                    if (optionPrint?.find(element => element == _option.value)) {
                                                        setOptionPrint(optionPrint.filter(_value => _value != _option.value))
                                                    } else {
                                                        setOptionPrint(optionPrint.concat([_option.value]))
                                                    }
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                            <div>
                                <p>
                                {formatMessage({defaultMessage:'Kiện hàng đã chọn'})}: {ids.length}
                                </p>
                                <button
                                    className="media-q btn btn-primary btn-elevate w-100 mt-2 mb-2"
                                    onClick={e => {
                                        e.preventDefault();
                                        setTotalOrder(ids.length)
                                        coPrintShipmentPackage()
                                    }}
                                    disabled={optionPrint.length == 0 || ids.length == 0}
                                    style={{ flex: 1, }}
                                >
                                    {formatMessage({defaultMessage:'In phiếu'})}
                                </button>
                            </div>

                            <div>
                                <p>
                                {formatMessage({defaultMessage:'Số kiện theo bộ lọc'})}: {total}
                                </p>
                                <button
                                    className="media-q btn w-100 mt-2 mb-2"
                                    style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                                    disabled={optionPrint.length == 0 || total == 0}
                                    onClick={e => {
                                        e.preventDefault();
                                        setTotalOrder(total)
                                        coActionPackViaFilter()
                                    }}
                                >
                                    {formatMessage({defaultMessage:'In phiếu theo bộ lọc'})}
                                </button>


                            </div>
                        </div>
                    </AuthorizationWrapper>
                </CardBody>
            </Card>
        </div>
    )
};

export default memo(BatchPrinting);