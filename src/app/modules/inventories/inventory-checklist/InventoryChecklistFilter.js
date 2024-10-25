import React, { Fragment, memo, useMemo, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import queryString from 'querystring';
import _ from 'lodash';
import Select from "react-select";
import DateRangePicker from 'rsuite/DateRangePicker';
import query_sme_inventory_checklist_tags from "../../../../graphql/query_sme_inventory_checklist_tags";
import { useIntl } from "react-intl";
import dayjs from 'dayjs';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const InventoryChecklistFilter = ({ whereCondition }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [valueRangeTime, setValueRangeTime] = useState(null);
    const {formatMessage} = useIntl()
    const currentTags = 
        () => {
            let parseParamsTags = params?.tags?.split(',');
            let _current = dataSmeInventoriesTags?.sme_inventory_checklist_tags?.filter(
                _option => parseParamsTags?.some(param => Number(param) == _option?.id)
            );

           return _current?.map(item => ({label :item.title, value :item.id, }))
        }
    const { data: dataSmeInventoriesTags } = useQuery(query_sme_inventory_checklist_tags, {
        fetchPolicy: 'cache-and-network'
    });
    useMemo(
        () => {
            if (!params?.gt || !params?.lt) return;

            let rangeTimeConvert = [params?.gt, params?.lt]?.map(
                _range => new Date(_range * 1000)
            );
            setValueRangeTime(rangeTimeConvert);
        }, [params?.gt, params?.lt]
    );

    const disabledFutureDate = (date) => {
        const today = new Date();
        return date > today; // trả về true nếu ngày được chọn là ngày trong tương lai
      };


    return (
        <Fragment>
            <div className="form-group row mb-8 d-flex flex-wrap">
                <div className="col-3 input-icon" style={{ height: 'fit-content' }} >
                    <input
                        type="text"
                        className="form-control"
                        placeholder={formatMessage({defaultMessage:"Mã kiểm kho"})}
                        style={{ height: 37 }}
                        onBlur={(e) => {
                            history.push(`/products/inventory/list?${queryString.stringify({
                                ...params,
                                page: 1,
                                code: e.target.value
                            })}`)
                        }}
                        defaultValue={params.code || ''}
                        onKeyDown={e => {
                            if (e.keyCode == 13) {
                                history.push(`/products/inventory/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    code: e.target.value
                                })}`)
                            }
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                </div>

                <div className='col-3' style={{zIndex: 22}}>
                    <Select
                        placeholder={formatMessage({defaultMessage:"Nhập tags"})}
                        isMulti
                        isClearable
                        value={currentTags()}
                        options={dataSmeInventoriesTags?.sme_inventory_checklist_tags?.map(__ => {
                            return {
                                label: __.title,
                                value: __.id
                            }
                        })}
                        onChange={values => {
                            let paramsTag = values?.length > 0
                                ? _.map(values, 'value')?.join(',')
                                : undefined;

                                history.push(`/products/inventory/list?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    tags: paramsTag
                                })}`)

                        }}
                    />
                </div>

                <div className="col-6">
                    <div className='d-flex align-items-center justify-content-end'>
                        <div className='col-2 p-0'>
                            <span style={{ float: 'right' }}>{formatMessage({defaultMessage: 'Thời gian tạo'})}:</span>
                        </div>
                        <div className='col-6 pt-1'>
                            <DateRangePicker
                                style={{ float: 'right', width: '100%' }}
                                character={' - '}
                                format={'dd/MM/yyyy'}
                                value={valueRangeTime}
                                disabledDate={disabledFutureDate}
                                placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                                placement={'bottomEnd'}
                                onChange={values => {
                                    let queryParams = {};
                                    setValueRangeTime(values)

                                    if (!!values) {
                                        let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).startOf('day').unix(), dayjs(values[1]).endOf('day').unix()];

                                        queryParams = {
                                            ...params,
                                            gt: gtCreateTime,
                                            lt: ltCreateTime
                                        }
                                    } else {
                                        queryParams = _.omit({ ...params }, ['gt', 'lt'])
                                    }

                                    history.push(`/products/inventory/list?${queryString.stringify(queryParams)}`);
                                }}
                                locale={{
                                    sunday: 'CN',
                                    monday: 'T2',
                                    tuesday: 'T3',
                                    wednesday: 'T4',
                                    thursday: 'T5',
                                    friday: 'T6',
                                    saturday: 'T7',
                                    ok: formatMessage({defaultMessage:'Đồng ý'}),
                                    today: formatMessage({defaultMessage:'Hôm nay'}),
                                    yesterday: formatMessage({defaultMessage:'Hôm qua'}),
                                    hours: formatMessage({defaultMessage:'Giờ'}),
                                    minutes: formatMessage({defaultMessage:'Phút'}),
                                    seconds: formatMessage({defaultMessage:'Giây'}),
                                    formattedMonthPattern: 'MM/yyyy',
                                    formattedDayPattern: 'dd/MM/yyyy',
                                    // for DateRangePicker
                                    last7Days: formatMessage({defaultMessage:'7 ngày qua'})
                                }}
                            />
                        </div>
                        <div className=''>
                            <AuthorizationWrapper keys={['product_inventory_action']}>
                            <button
                                className="btn btn-primary btn-elevate"
                                onClick={e => {
                                    e.preventDefault();

                                    history.push('/products/inventory/create')
                                }}
                                style={{ flex: 1, }}
                            >
                                {formatMessage({defaultMessage: 'Thêm yêu cầu kiểm kho'})}
                            </button>
                            </AuthorizationWrapper>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default memo(InventoryChecklistFilter);