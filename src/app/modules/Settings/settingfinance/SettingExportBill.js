import _ from 'lodash';
import React, { useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl';
import DatePicker from "rsuite/DatePicker";
import Select from "react-select";
import { useIntl } from 'react-intl';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import InfoConnectDialog from './InfoConnectDialog';
import dayjs from 'dayjs';
import { useHistory, useLocation } from "react-router-dom";
import mutate_configInvoiceSetting from '../../../../graphql/mutate_configInvoiceSetting'
import mutate_disconnectInvoicePartner from '../../../../graphql/mutate_disconnectInvoicePartner'
import { useMutation, useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { ConfirmDialog } from './confirmDialog'
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import query_prvListProviderConnected from '../../../../graphql/query_prvListProviderConnected';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';


const SettingExportBill = ({ loadingInvoiceSetting, dataInvoiceSetting }) => {
    const PARTNERNAME = 'hoadon30s'
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()
    const history = useHistory();

    const [variables, setVariables] = useState({
        statusExportBill: 'COMPLETED',
        statusTimeCreateBill: 'created_at',
        isAuto: true,
        fromTime: null,
        providerConnectedId: null
    })

    console.log({ dataInvoiceSetting })

    useMemo(() => {        
        setVariables({
            providerConnectedId: dataInvoiceSetting?.provider_connected_id,
            statusExportBill: dataInvoiceSetting?.order_status,
            statusTimeCreateBill: dataInvoiceSetting?.date_type,
            isAuto: !!dataInvoiceSetting?.is_auto,
            fromTime: dataInvoiceSetting?.from_date ? new Date(dayjs(dataInvoiceSetting?.from_date).format('YYYY-MM-DD')) : null
        })
    }, [dataInvoiceSetting])

    const [openDialog, setOpenDialog] = useState(false)
    const [confirmDialog, setConfirmDialog] = useState(false)


    const STATUS_EXPORT_BILL = [
        {
            value: 'SHIPPED',
            label: <FormattedMessage defaultMessage='Đơn đã giao cho ĐVVC' />,
        },
        {
            value: 'TO_CONFIRM_RECEIVE',
            label: <FormattedMessage defaultMessage='Đơn đã giao cho người mua' />,

        },
        {
            value: 'COMPLETED',
            label: <FormattedMessage defaultMessage='Đơn hoàn thành' />,
        },
    ];

    const STATUS_TIME_ORDER = [
        {
            value: 'created_at',
            label: <FormattedMessage defaultMessage='Thời gian xuất hoá đơn lên hệ thống đối tác' />,
        },
        {
            value: 'order_at',
            label: <FormattedMessage defaultMessage='Thời gian tạo đơn' />,
        },
        {
            value: 'completed_at',
            label: <FormattedMessage defaultMessage='Thời gian đơn hoàn thành' />,
        },
    ]

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs()
            .endOf("day")
            .unix();

        return unixDate > today;
    };

    const { data: dataProviderConnected } = useQuery(query_prvListProviderConnected, {
        variables: {
            category_code: 'invoice'
        },
        fetchPolicy: 'cache-and-network'
    });

    const [configInvoiceSetting, { loading }] = useMutation(mutate_configInvoiceSetting,
        { awaitRefetchQueries: true, refetchQueries: ['getInvoiceSetting'] }
    );

    const [disconnectInvoiceSetting, { loading: disconnectLoading }] = useMutation(mutate_disconnectInvoicePartner,
        { awaitRefetchQueries: true, refetchQueries: ['getInvoiceSetting'] }
    );    

    const optionsProviderConnected = useMemo(() => {
        return dataProviderConnected?.prvListProviderConnected?.data?.map(item => ({
            ...item,
            label: item?.provider_name,
            value: item?.id,
        }))
    }, [dataProviderConnected]);

    const handleConfifInvoiceSetting = async () => {
        const { data } = await configInvoiceSetting({
            variables: {
                provider_connected_id: variables.providerConnectedId,
                date_type: variables.statusTimeCreateBill,
                from_date: variables.fromTime ? dayjs(variables.fromTime).format('YYYY-MM-DD') : null,
                is_auto: variables.isAuto ? 1 : 0,
                order_status: variables.statusExportBill,
            }
        })

        if (!!data?.configInvoiceSetting?.success) {
            addToast(formatMessage({ defaultMessage: 'Cập nhật thành công' }), { appearance: 'success' })
            history.push('/finance/manage-finance-order')
            return
        }
        addToast(data?.configInvoiceSetting?.message || formatMessage({ defaultMessage: 'Cập nhật thất bại' }), { appearance: 'error' })
    }

    const handleDisconnect = async () => {
        try {
            const { data } = await disconnectInvoiceSetting({
                variables: {
                    partner_name: PARTNERNAME
                }
            })
            if (!!data?.disconnectInvoicePartner?.success) {
                addToast(formatMessage({ defaultMessage: 'Ngắt kết nối thành công' }), { appearance: 'success' })
                setVariables({
                    statusExportBill: 'COMPLETED',
                    statusTimeCreateBill: 'order_at',
                    isAuto: true,
                    fromTime: null
                })
                setConfirmDialog(false)
                return
            }
            addToast(formatMessage({ defaultMessage: 'Ngắt kết nối thất bại' }), { appearance: 'error' })
            setConfirmDialog(false)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div>
            {openDialog && <InfoConnectDialog show={openDialog} onHide={() => setOpenDialog(false)} />}
            <LoadingDialog show={loading || disconnectLoading} />
            {confirmDialog && <ConfirmDialog handleDisconnect={handleDisconnect} show={confirmDialog} onHide={() => setConfirmDialog(false)} />}
            {/* <div className='col-12 border-gray border-bottom pb-2'>
                <span className="text-dark" style={{ fontWeight: 700, fontSize: '14px' }}>Cài đặt xuất hóa đơn</span>
            </div> */}
            <div className='row col-7' style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center' }}>
                    <div className='text-right'>Hệ thống cung cấp hóa đơn
                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Đối tác hỗ trợ xuất hoá đơn.' })}>
                            <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                        </TooltipWrapper>
                    </div>
                    <Select
                        isLoading={loadingInvoiceSetting}
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        value={_.find(optionsProviderConnected, item => item?.value == variables.providerConnectedId)}
                        // value={
                        //     _.find(_.omit(STATUS_EXPORT_BILL), (_bill) => _bill?.value == variables['statusExportBill']) || _.omit(STATUS_EXPORT_BILL)
                        // }       
                        placeholder={formatMessage({ defaultMessage: 'Chọn hệ thống cung cấp' })}
                        options={optionsProviderConnected}
                        onChange={({ value }) => {
                            if (value) {
                                setVariables(prev => ({ ...prev, providerConnectedId: value }))
                            }

                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>;
                        }}
                    />

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center' }}>
                    <div className='text-right'>{formatMessage({ defaultMessage: "Tự động xử lý hóa đơn" })}
                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Hệ thống sẽ tự động xử lý và tạo hoá đơn nháp để xuất sang phần mềm xuất hoá đơn đối tác.' })}>
                            <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                        </TooltipWrapper>
                    </div>
                    <div className='d-flex justify-contend-end'>
                        <span className="switch" style={{ transform: 'scale(0.8)' }}>
                            <label>
                                <input
                                    type={'checkbox'}
                                    disabled={!variables.providerConnectedId}
                                    onChange={() => {
                                        setVariables(prev => ({ ...prev, isAuto: !prev['isAuto'] }))
                                    }}
                                    style={{ background: '#F7F7FA', border: 'none' }}
                                    checked={variables['isAuto']}
                                />
                                <span></span>
                            </label>
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center' }}>
                    <div className='text-right'>{formatMessage({ defaultMessage: "Thời gian bắt đầu" })}
                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Thời gian hệ thống bắt đầu thực hiện xử lý tạo hoá đơn tự động.' })}>
                            <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                        </TooltipWrapper>
                    </div>
                    <div>
                        <DatePicker
                            disabled={!variables.providerConnectedId}
                            onChange={value => {
                                if (!!value) {
                                    setVariables(prev => ({ ...prev, fromTime: value }))
                                } else {
                                    setVariables(prev => ({ ...prev, fromTime: null }))
                                }

                            }}
                            value={variables['fromTime']}
                            disabledDate={disabledFutureDate}
                            format={"dd/MM/yyyy"}
                            placeholder="Thời gian bắt đầu"
                            className="w-100 custome__style__input__date border border-gray" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 99 }}>
                    <div className='text-right'>{formatMessage({ defaultMessage: 'Trạng thái xuất hóa đơn' })}
                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Trạng thái đơn hàng xuất hoá đơn tự động.' })}>
                            <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                        </TooltipWrapper>
                    </div>
                    <div>
                        <Select
                            isDisabled={!variables.providerConnectedId}
                            isLoading={loadingInvoiceSetting}
                            className="w-100 custom-select-warehouse"
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: "#ff5629",
                                },
                            })}
                            value={
                                _.find(_.omit(STATUS_EXPORT_BILL), (_bill) => _bill?.value == variables['statusExportBill']) || _.omit(STATUS_EXPORT_BILL)
                            }
                            defaultValue={variables['statusExportBill']}
                            options={STATUS_EXPORT_BILL}
                            onChange={({ value }) => {
                                if (value) {
                                    setVariables(prev => ({ ...prev, statusExportBill: value }))
                                }

                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>;
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center' }}>
                    <div className='text-right'>{formatMessage({ defaultMessage: "Thời gian lập hoá đơn" })}
                        <TooltipWrapper note={formatMessage({ defaultMessage: 'Thời gian xác định ngày lập hoá đơn trên hệ thống đối tác tạo hoá đơn.' })}>
                            <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                        </TooltipWrapper>
                    </div>
                    <div>
                        <Select
                            isDisabled={!variables.providerConnectedId}
                            className="w-100 custom-select-warehouse"
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: "#ff5629",
                                },
                            })}
                            isLoading={loadingInvoiceSetting}
                            value={
                                _.find(_.omit(STATUS_TIME_ORDER), (_bill) => _bill?.value == variables['statusTimeCreateBill']) || STATUS_TIME_ORDER[0]
                            }
                            defaultValue={variables['statusTimeCreateBill']}
                            options={STATUS_TIME_ORDER}
                            onChange={({ value }) => {
                                if (value) {
                                    setVariables(prev => ({ ...prev, statusTimeCreateBill: value }))
                                }

                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>;
                            }}
                        />
                    </div>
                </div>
                <div className='d-flex justify-content-end mt-2'>
                    <AuthorizationWrapper keys={['setting_finance_action']}>
                        <button
                            onClick={handleConfifInvoiceSetting}
                            disabled={!variables.providerConnectedId || loading}
                            className='btn btn-primary'
                        >
                            Cập nhật
                        </button>
                    </AuthorizationWrapper>
                </div>
            </div>


        </div>
    )
}

export default SettingExportBill