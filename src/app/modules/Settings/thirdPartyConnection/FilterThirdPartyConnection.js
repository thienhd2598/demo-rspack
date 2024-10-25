import React, { memo, useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import Select from "react-select";
import { map } from "lodash";
import query_prvListCategory from '../../../../graphql/query_prvListCategory'
import { useQuery } from "@apollo/client";



const OPTIONS_STATUS = [
    { value: 0, label: <FormattedMessage defaultMessage="Chưa kết nối" /> },
    { value: 1, label: <FormattedMessage defaultMessage="Đã kết nối" /> },
    { value: 2, label: <FormattedMessage defaultMessage="Mất kết nối" /> },
];

const FilterThirdPartyConnection = () => {
    const location = useLocation()
    const history = useHistory()
    const { formatMessage } = useIntl()
    const [inputSearchValue, setInputSearchValue] = useState('');
    const params = queryString.parse(location.search.slice(1, 100000))
    const { loading, data, error, refetch } = useQuery(query_prvListCategory, {
        fetchPolicy: "cache-and-network"
    });
    console.log('data', data)
    useMemo(() => {
        setInputSearchValue(params?.name || '');
    }, [params?.name]);

    const OPTIONS_CATEGORY = useMemo(() => {
        return data?.prvListCategory?.map(item => ({label: item?.name, value: item?.id}))
    }, [data])

    const currentCategory = useMemo(() => {
        const _current = !!params?.list_category
            ? OPTIONS_CATEGORY?.filter(
                _cate => params?.list_category?.split(',').some(_param => +_param == _cate.value)
            )
            : [];

        return _current
    }, [params?.list_category, OPTIONS_CATEGORY]);    

    return (
        <div className="row mb-8">
            <div className="col-4 input-icon">
                <input
                    type="text"
                    className="form-control"
                    isMulti
                    placeholder={formatMessage({ defaultMessage: "Tìm kiếm tên nhà cung cấp" })}
                    style={{ height: 40 }}
                    value={inputSearchValue}
                    onBlur={(e) => {
                        history.push(`${location.pathname}?${queryString.stringify({
                            ...params,
                            name: e.target.value,
                            page: 1
                        })}`)
                    }}
                    onKeyDown={e => {
                        if (e.keyCode == 13) {
                            history.push(`${location.pathname}?${queryString.stringify({
                                ...params,
                                name: e.target.value,
                                page: 1
                            })}`)
                        }
                    }}
                    onChange={(e) => setInputSearchValue(e.target.value)}
                />
                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
            </div>
            <div className="col-4">
                <Select
                    className='w-100'
                    isMulti
                    isClearable
                    isLoading={loading}
                    placeholder={formatMessage({ defaultMessage: 'Danh mục' })}
                    styles={{ container: (styles) => ({ ...styles, zIndex: 9 }) }}
                    value={currentCategory}
                    options={OPTIONS_CATEGORY}
                    onChange={values => {
                        const valuesPush = values?.length > 0
                            ? map(values, 'value')?.join(',')
                            : undefined;

                        history.push(`${location.pathname}?${queryString.stringify({
                            ...params,
                            list_category: valuesPush
                        })}`.replaceAll('%2C', '\,'))
                    }}
                    formatOptionLabel={(option, labelMeta) => {
                        return <div>{option.label}</div>
                    }}
                />
            </div>            
        </div>
    )
};

export default memo(FilterThirdPartyConnection);