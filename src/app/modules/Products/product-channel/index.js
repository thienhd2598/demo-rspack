/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";
import { useProductsUIContext } from "../ProductsUIContext";
import CategorySelect from "../../../../components/CategorySelect";
import { useQuery } from "@apollo/client";
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import _ from 'lodash'
import { Field, useFormikContext } from "formik";
import BrandProperty from "./BrandProperty";
import { ATTRIBUTE_VALUE_TYPE } from "../ProductsUIHelpers";
import query_scGetLogisticChannel from "../../../../graphql/query_scGetLogisticChannel";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { formatNumberToCurrency } from "../../../../utils";
import query_scGetAttributeByCategory from "../../../../graphql/query_scGetAttributeByCategory";
import { ReSelectBranch } from "../../../../components/ReSelectBranch";
import { useIntl } from "react-intl";

function ProductChannels(props) {
  const { channels, setChannels, setChannelsAvailable, currentProduct } = useProductsUIContext()
  const { values, setFieldValue } = useFormikContext()
  const { intl, connector_channel_code, last_category_selected } = props;
  const [categories, setCategories] = useState({})
  const [categorySelected, setCategorySelected] = useState(null)
  const {formatMessage} = useIntl()
  const { data, loading } = useQuery(op_sale_channel_categories, {
    variables: {
      connector_channel_code
    },
    // fetchPolicy: 'cache-and-network'
  })

  const { data: dataLogistics } = useQuery(query_scGetLogisticChannel, {
    variables: {
      store_id: channels[connector_channel_code].stores[0].id
    },
    skip: connector_channel_code != 'shopee',
    fetchPolicy: 'cache-and-network'
  })

  const { data: dataAttributes, loading: loadingAttribute } = useQuery(query_scGetAttributeByCategory, {
    variables: {
      category_id: categorySelected?.id || -1,
      sc_store_id: channels[connector_channel_code].stores[0].id,
      skip: !categorySelected,
    },
    // fetchPolicy: 'cache-and-network'
  })

  useMemo(() => {
    if ((currentProduct?.sme_catalog_product_ship_package_infos || []).length == 0 || !dataLogistics?.scGetLogisticChannel?.logistics) {
      return
    }
    const sme_catalog_product_ship_package_info = currentProduct.sme_catalog_product_ship_package_infos[0]
    console.log('sme_catalog_product_ship_package_info', sme_catalog_product_ship_package_info, dataLogistics?.scGetLogisticChannel?.logistics)
    let _volume = (sme_catalog_product_ship_package_info.size_width || 0) * (sme_catalog_product_ship_package_info.size_length || 0) * (sme_catalog_product_ship_package_info.size_height || 0)
    let requireSize = !!sme_catalog_product_ship_package_info.size_width || !!sme_catalog_product_ship_package_info.size_length || !!sme_catalog_product_ship_package_info.size_height
    let logistics = dataLogistics?.scGetLogisticChannel?.logistics?.filter(_logisticGroup => {
      return _logisticGroup.items?.some(_logistic => (!_logistic.max_weight || sme_catalog_product_ship_package_info.weight <= _logistic.max_weight)
        && (!_logistic.min_weight || sme_catalog_product_ship_package_info.weight >= _logistic.min_weight)
        && (!requireSize || ((_logistic.max_width == 0 || sme_catalog_product_ship_package_info.size_width <= _logistic.max_width)
          && (_logistic.max_length == 0 || sme_catalog_product_ship_package_info.size_length <= _logistic.max_length)
          && (_logistic.max_height == 0 || sme_catalog_product_ship_package_info.size_height <= _logistic.max_height)
          && (_volume > 0) && (!_logistic.max_volume || _volume <= _logistic.max_volume))))
    })

    if (logistics.length == 1) {
      setFieldValue(`channel-logistic-${logistics[0].ref_channel_id}`, true)
    }

    setChannels(prev => {
      return {
        ...prev,
        [connector_channel_code]: {
          ...prev[connector_channel_code],
          logistics
        }
      }
    })
  }, [dataLogistics, currentProduct.sme_catalog_product_ship_package_infos])


  useMemo(() => {
    let _categories = _.groupBy(data?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
    setCategories(_categories)
    if (!!last_category_selected) {
      let cate = (data?.sc_sale_channel_categories || []).find(_cate => _cate.ref_id == last_category_selected)
      if (cate) {
        setChannels(prev => {
          return {
            ...prev,
            [connector_channel_code]: {
              ...prev[connector_channel_code],
              category: cate
            }
          }
        })

        let newArray = []
        newArray.push(cate)
        let parent = (data?.sc_sale_channel_categories || []).find(_cate => _cate.id == cate.parent_id)
        while (!!parent) {
          newArray = [parent, ...newArray]
          parent = (data?.sc_sale_channel_categories || []).find(_cate => _cate.id == parent.parent_id)
        }
        setFieldValue(`category-${connector_channel_code}`, newArray)

      }
    }
  }, [data, last_category_selected])
  const [attributes, warranties] = useMemo(() => {
    if (!!dataAttributes) {
      console.log('dataAttributes', dataAttributes)
      let _attributes = (dataAttributes?.scGetAttributeByCategory || [])
        .filter(_op => _op.attribute_type != 1 && !((_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT || _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) && (_op.attribute_options || []).length == 0))
        .map(_op => {
          let unit = !!_op.unit_options && _op.unit_options.length == 1 ? _op.unit_options[0] : null
          let options = _op.attribute_options;
          if (!!unit) {
            options = options.map(_option => {
              if (!!_option.display_name && _option.display_name.endsWith(unit)) {
                return {
                  ..._option,
                  display_name: _option.display_name.substr(0, _option.display_name.length - unit.length)
                }
              }
              return _option
            })
          }
          return { ..._op, options }
        });
      console.log('_attributes', _attributes)
      setChannelsAvailable(prev => {
        return {
          ...prev,
          [connector_channel_code]: _attributes
        }
      })

      let _warranties = _attributes.filter(_att => _att.attribute_type == 2)
      _warranties.sort((_w1, _w2) => -(_w1.is_mandatory || 0) + (_w2.is_mandatory || 0))

      return [_attributes.filter(_att => _att.attribute_type != 2), _warranties];
    }
    return [[], []]
  }, [dataAttributes])
  let categorySelectedId = useMemo(() => {
    if (!!values[`category-${connector_channel_code}`]) {
      let cate = values[`category-${connector_channel_code}`][values[`category-${connector_channel_code}`].length - 1];
      setCategorySelected(cate)
      return cate.id
    }

    return null
  }, [values[`category-${connector_channel_code}`]])


  const _onSelect = useCallback((category) => {
    setFieldValue(`brand-${connector_channel_code}`, undefined)
    setChannels(prev => {
      return {
        ...prev,
        [connector_channel_code]: {
          ...prev[connector_channel_code],
          category
        }
      }
    })
  }, [connector_channel_code])
  return (
    <Card >
      <CardBody>
        <div className="form-group col mb-0">
          <div className="checkbox-inline row">
            <label className="checkbox checkbox-outline checkbox-primary mb-0">
              <input type="checkbox" name="check-upbase" checked={values[`category-${connector_channel_code}-selected`] || false}
                onChange={(e) => {
                  setFieldValue(`category-${connector_channel_code}-selected`, !values[`category-${connector_channel_code}-selected`])
                }} />
              <span></span>
              {channels[connector_channel_code].channel.name}
            </label>
          </div>
          {
            values[`category-${connector_channel_code}-selected`] && <div style={{ marginLeft: -14, }} className='row mt-4' >
              <span style={{ color: '#00000073' }} >{formatMessage({defaultMessage: 'Chọn gian hàng'})}:</span>
              {
                channels[connector_channel_code].stores.filter(_store => !!_store.status).map(_store => {
                  return (
                    <label key={`store-${_store.id}`} className="checkbox checkbox-outline checkbox-primary mx-4">
                      <input type="checkbox" name="check-upbase" checked={_store.isSelected || false}
                        onChange={(e) => {
                          setChannels(prev => {
                            return {
                              ...prev,
                              [connector_channel_code]: {
                                ...prev[connector_channel_code],
                                stores: prev[connector_channel_code].stores.map(__store => {
                                  if (__store.id == _store.id) {
                                    return {
                                      ...__store,
                                      isSelected: !__store.isSelected
                                    }
                                  }
                                  return __store;
                                })
                              }
                            }
                          })
                        }} />
                      <span></span>
                      &ensp;{_store.name}
                    </label>
                  )
                })
              }
            </div>
          }
        </div>
      </CardBody>
      {
        values[`category-${connector_channel_code}-selected`] && <div style={{ borderTop: '1px solid #F0F0F0' }} >
          <CardBody>
            <CategorySelect categories={categories}
              key={`category-${connector_channel_code}`}
              name={`category-${connector_channel_code}`}
              selected={categorySelected}
              onSelect={_onSelect}
            />
            {
              !!categorySelectedId && <Field
                name={`brand-${connector_channel_code}`}
                component={ReSelectBranch}
                placeholder={formatMessage({defaultMessage: 'Chọn thương hiệu'})}
                label={formatMessage({defaultMessage: 'Thương hiệu'})}
                customFeedbackLabel={' '}
                required
                connector_channel_code={connector_channel_code}
                sc_category_id={connector_channel_code == 'shopee' ? categorySelectedId : null}
              />
            }

            <BrandProperty brand={connector_channel_code}
              loading={loadingAttribute}
              properties={attributes}
            />
            {
              warranties.length > 0 && <>
                <p className='font-weight-bold mt-8' >{formatMessage({defaultMessage: 'Chế độ bảo hành'})}</p>
                <BrandProperty brand={connector_channel_code}
                  loading={loadingAttribute}
                  properties={warranties}
                  isShowAll={true}
                />
              </>
            }
            {
              channels[connector_channel_code].enable_logistic && channels[connector_channel_code].logistics?.length > 0 ? (
                <>
                  <p className='font-weight-bold mt-8' >{formatMessage({defaultMessage: 'Phí vận chuyển'})}</p>
                  <div className="row">
                    <div className='col-12' style={{ display: 'flex' }} >
                      <label className="col-form-label">{formatMessage({defaultMessage: 'Đồng bộ thông tin chiều dài x rộng x cao của sản phẩm lên sàn'})}&ensp;&ensp;</label>
                      <Field
                        name={`is_valid_logistic-${connector_channel_code}`}
                        component={Switch}
                      />
                    </div>
                  </div>
                  {
                    channels[connector_channel_code].logistics?.map(_logistic => {
                      return (
                        <div key={`_logistic--${_logistic.ref_channel_id}`} className="row">
                          <label className="col-6 col-form-label">{_logistic.channel_name} (Tối đa {formatNumberToCurrency(_logistic.max_weight)}g)</label>
                          {
                            channels[connector_channel_code].logistics?.length > 1 && <div className="col-6" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }} >
                              <Field
                                name={`channel-logistic-${_logistic.ref_channel_id}`}
                                component={Switch}
                              />
                            </div>
                          }
                        </div>
                      )
                    })
                  }
                </>
              ) : <></>
            }

          </CardBody>
        </div>
      }
    </Card>
  );
}

export default memo(ProductChannels);