/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  InputVertical
} from "../../../../_metronic/_partials/controls";
import { injectIntl } from "react-intl";
import { useProductsUIContext } from "../ProductsUIContext";
import { Field, useFormikContext } from "formik";
import CreatableSelect from 'react-select/creatable';

import { useQuery } from "@apollo/client";
import _ from 'lodash'
import { ReSelectBranch } from "../../../../components/ReSelectBranch";
import { ATTRIBUTE_VALUE_TYPE, queryCheckExistSku } from "../ProductsUIHelpers";
import CategorySelect from "../../../../components/CategorySelect";
import op_sale_channel_categories from "../../../../graphql/op_sale_channel_categories";
import BrandProperty from "../product-channel/BrandProperty";
import query_scGetAttributeByCategory from "../../../../graphql/query_scGetAttributeByCategory";
import SuggestCategory from "./SuggestCategory";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { useSelector } from "react-redux";
import { createSKUProduct, getMaxLengthSKU } from '../../../../utils/index';
import { useToasts } from "react-toast-notifications";

function ProductBasicInfo(props) {
  const { intl } = props;
  const { addToast, removeAllToasts } = useToasts();
  const { setFieldValue, values } = useFormikContext()
  const { currentChannel, categorySelected, setCategorySelected, setProperties, smeProduct, optionsProductTag, setCustomAttributes, setAttributesSelected, variants, productEditing, customAttributes } = useProductsUIContext();
  const [categories, setCategories] = useState({})
  const user = useSelector((state) => state.auth.user);

  const { data: dataAttributes, loading: loadingAttribute } = useQuery(query_scGetAttributeByCategory, {
    variables: {
      category_id: categorySelected?.id || -1,
      sc_store_id: currentChannel?.value,
      skip: !categorySelected,
    },
    // fetchPolicy: 'cache-and-network'
  })

  const { data, loading } = useQuery(op_sale_channel_categories, {
    variables: {
      connector_channel_code: currentChannel?.connector_channel_code
    },
    // fetchPolicy: 'cache-and-network'
  })
  console.log('vaaaaa', customAttributes)

  const [attributes, warranties] = useMemo(() => {
    if (!!dataAttributes && !!dataAttributes?.scGetAttributeByCategory) {      
      let _attributes = (dataAttributes?.scGetAttributeByCategory || [])
        .filter(_op => {
          if (currentChannel?.connector_channel_code == 'shopee') return _op.attribute_type != 1;
          return ((_op.attribute_type == 1 && _op.is_sale_prop == 0) || _op.attribute_type != 1) && !((_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT || _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) && (_op.attribute_options || []).length == 0)
        })
        .map(_op => {
          let options = _op.attribute_options;
          let unit_options = _op.unit_options;
          if (_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT ||
            _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
            unit_options = [];
          }

          return { ..._op, options, unit_options }
        });

      if (currentChannel?.connector_channel_code == 'shopee') {
        const attributesVariant = (dataAttributes?.scGetAttributeByCategory || [])
          ?.filter(_op => _op.attribute_type == 1)
          ?.map(_op => {
            let options = _op.attribute_options;

            const groups = _op?.attribute_groups?.map(group => {
              const groupOptions = options?.filter(op => op?.sc_attribute_group_id == group?.id);
              return {
                ...group,
                options: groupOptions
              }
            }) || [];

            return { ..._op, options, groups }
          });
          
        setCustomAttributes(attributesVariant);
        setAttributesSelected(prev => prev.map(attr => {
          const findedSelected = attributesVariant?.find(item => item?.id == attr?.sc_attribute_id);

          if (findedSelected) {
            const currentGroupSelect = findedSelected?.groups?.find(item => attr?.values?.some(val => val?.sc_attribute_group_id == item?.id));

            return {
              ...attr,
              groups: findedSelected?.groups,
              currentGroupSelect
            }
          }

          return {
            ...attr,
            groups: [],
            currentGroupSelect: null
          }
        }))
      }

      if (currentChannel?.connector_channel_code != 'shopee') {
        let _attributesTiktok = (dataAttributes?.scGetAttributeByCategory || [])
          .filter(_op => _op.attribute_type == 1 && (currentChannel?.connector_channel_code == 'lazada' ? _op.is_sale_prop == 1 : true))
          .map(_op => {
            let options = _op.attribute_options;
            let unit_options = _op.unit_options;
            if (_op.input_type == ATTRIBUTE_VALUE_TYPE.SINGLE_SELECT ||
              _op.input_type == ATTRIBUTE_VALUE_TYPE.MULTIPLE_SELECT) {
              unit_options = [];
            }
            return { ..._op, options, unit_options }
          });

        console.log([..._attributesTiktok])
        //Voi tiktok thi append phan loai cua nganh hang moi
        if (currentChannel?.connector_channel_code == 'tiktok')
          setCustomAttributes(prev => {
            console.log('prev', [...prev])
            let _new = prev.map(_1 => {
              if (!!_1.ref_id) {
                let _idx1 = _attributesTiktok.findIndex(__ => __.ref_id == _1.ref_id)
                if (_idx1 >= 0) {
                  _attributesTiktok.splice(_idx1, 1)
                }
              } else {
                let _idx1 = _attributesTiktok.findIndex(__ => _1.id == __.id || _1.sc_attribute_id == __.id)
                if (_idx1 >= 0) {
                  let _found = _attributesTiktok[_idx1]
                  _attributesTiktok.splice(_idx1, 1)
                  return {
                    ..._1,
                    ref_id: _found.ref_id,
                    sc_attribute_id: _found.id || _1.id
                  }
                }
              }

              return _1
            })//.filter(__attr => !!__attr.sc_attribute_id)
            console.log('_attributesTiktok_attributesTiktok', [..._attributesTiktok], [..._new])
            return _new.concat(_attributesTiktok)
          });
        //Voi lazada chỉ giữ lại phần chung, xoá phần riêng ở ngành hàng cũ
        if (currentChannel?.connector_channel_code == 'lazada') {
          setCustomAttributes(prev => {
            console.log('prev', [...prev])
            let _new = prev.map(_attribute => {
              if (!!_attribute.ref_id) {
                let _idx1 = _attributesTiktok.findIndex(__ => __.ref_id == _attribute.ref_id)
                if (_idx1 >= 0) {
                  _attributesTiktok.splice(_idx1, 1)
                  return _attribute
                }
              } else {
                let _idx1 = _attributesTiktok.findIndex(__ => _attribute.id == __.id || _attribute.sc_attribute_id == __.id)
                if (_idx1 >= 0) {
                  let _found = _attributesTiktok[_idx1]
                  _attributesTiktok.splice(_idx1, 1)
                  return {
                    ..._attribute,
                    ref_id: _found.ref_id
                  }
                }
              }

              ///UPBASE-3179: đổi các attribute ngành hàng cũ thành custom
              return null
            }).filter(__ => !!__)
            // console.log('_attributesTiktok_attributesTiktok', [..._attributesTiktok], [..._new])
            setAttributesSelected(prev => {
              // console.log('setAttributesSelected', [...prev])
              let newAtt = prev.map(_selected => {
                // console.log('setAttributesSelected::foundAtt', foundAtt)
                if (!_new.some(__ => __.id == _selected.sc_attribute_id)) {
                  return {
                    ..._selected,
                    sc_attribute_id: null
                  }
                }
                return _selected
              })
              // console.log('newAttnewAtt', newAtt)
              return newAtt;
            })
            return _new.concat(_attributesTiktok)
          });

        }
        // setAttributesSelected(_attributesTiktok);
      }

      setProperties(_attributes)

      let _warranties = _attributes.filter(_att => _att.attribute_type == 2)
      _warranties.sort((_w1, _w2) => -(_w1.is_mandatory || 0) + (_w2.is_mandatory || 0))

      return [_attributes.filter(_att => _att.attribute_type != 2), _warranties];
    }
    return [[], []]
  }, [dataAttributes, currentChannel])

  const checkExistSku = useCallback(async (code) => {
    if (code.trim().length == 0) {
      return false;
    }
    if (await queryCheckExistSku(null, code)) {
      setFieldValue(`variant-sku_boolean`, { sku: true })
    } else {
      setFieldValue(`variant-sku_boolean`, { sku: false })
    }
  }, [])

  console.log({ variants })


  useMemo(() => {
    let _categories = _.groupBy(data?.sc_sale_channel_categories, _cate => _cate.parent_id || 'root');
    setCategories(_categories)   
  }, [data])


  const _onSelect = useCallback((category) => {
    setCategorySelected(category)
    setFieldValue('brand', undefined, false);
  }, [currentChannel?.connector_channel_code])
  return (
    <Card>
      <CardHeader title={intl.formatMessage({
        defaultMessage: "THÔNG TIN CƠ BẢN",
      })}>
        <CardHeaderToolbar>
        </CardHeaderToolbar>
      </CardHeader>
      <CardBody>
        <Field
          name="name"
          component={InputVertical}
          placeholder=""
          label={intl.formatMessage({
            defaultMessage: "Tên sản phẩm",
          })}
          required
          customFeedbackLabel={' '}
          countChar
          maxChar={currentChannel?.connector_channel_code != 'shopee' ? 255 : 120}
        />
        <CategorySelect categories={categories}
          key={`category`}
          name={`category`}
          selected={categorySelected}
          onSelect={_onSelect}
        />
        {!categorySelected && <SuggestCategory isEdit={props?.isEdit} categoryList={data?.sc_sale_channel_categories || []} />}
        <div className='row mb-2' >
          <div className={`col-md-6`} style={{ position: 'relative' }} >
            <Field
              name="sku"
              component={InputVertical}
              placeholder=""
              tooltip={intl.formatMessage({ defaultMessage: "Mã SKU của thông tin sản phẩm phục vụ cho mục đích liên kết sản phẩm" })}
              // required={(variants?.length > 0 && currentChannel?.connector_channel_code == 'lazada') || currentChannel?.connector_channel_code == 'tiktok' ? false : true}
              required={false}
              customFeedbackLabel={' '}
              countChar
              value={(value) => console.log('000', value)}
              label={intl.formatMessage({ defaultMessage: "Mã SKU thông tin" })}
              maxChar={getMaxLengthSKU(currentChannel?.connector_channel_code)}
              absolute
              disabled={currentChannel?.connector_channel_code == 'lazada' && productEditing?.status != 2 && values[`disable-edit-attribute`]}
            // onBlurChange={async (value) => {
            //   await checkExistSku(value)
            // }}
            />

            {!values.sku ? <a href="#" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem', cursor: currentChannel?.connector_channel_code === 'lazada' && productEditing?.status != 2 && values[`disable-edit-attribute`] ? 'not-allowed' : 'pointer' }}
              onClick={e => {
                e.preventDefault()
                if (currentChannel?.connector_channel_code === 'lazada' && productEditing?.status != 2 && values[`disable-edit-attribute`]) return;
                if (!!values.name)
                  setFieldValue('sku', createSKUProduct(user?.sme_id, values.name || ''))
                else {
                  addToast(intl.formatMessage({ defaultMessage: "Vui lòng nhập tên sản phẩm" }), { appearance: 'warning' });
                }

              }}
            >{intl.formatMessage({ defaultMessage: "Tự động tạo" })}</a> : null}
          </div>
          <div className={`col-md-6`} >

            {
              !!categorySelected && <Field
                name={`brand`}
                component={ReSelectBranch}
                placeholder={intl.formatMessage({ defaultMessage: "Chọn thương hiệu" })}
                label={intl.formatMessage({ defaultMessage: "Thương hiệu" })}
                customFeedbackLabel={' '}
                required
                connector_channel_code={currentChannel?.connector_channel_code}
                sc_category_id={currentChannel?.connector_channel_code == 'shopee' ? categorySelected.id : null}
                cols={['col-12', 'col-12']}
              />
            }
          </div>
        </div>

        <BrandProperty brand={currentChannel?.connector_channel_code}
          loading={loadingAttribute}
          properties={attributes}
        />


        {
          warranties.length > 0 && <>
            <p className='font-weight-bold mt-8' >{intl.formatMessage({ defaultMessage: "Chế độ bảo hành" })}</p>
            <BrandProperty brand={currentChannel?.connector_channel_code}
              loading={loadingAttribute}
              properties={warranties}
              isShowAll={true}
            />
          </>
        }

        {
          currentChannel?.connector_channel_code == 'tiktok' && <div style={{ display: 'flex', alignItems: 'center' }} >
            <span style={{ marginRight: 16 }} >{intl.formatMessage({ defaultMessage: "Thanh toán khi nhận hàng" })}</span>
            <Field
              name="is_cod_open"
              component={Switch}
              placeholder=""
              label={""}
            />
          </div>
        }

        <div className="row mt-2">
          <label className="col-12 col-form-label pb-1">{intl.formatMessage({ defaultMessage: "Tag" })}</label>
          <i className="col-12 pb-2" style={{ fontSize: 12 }}>{intl.formatMessage({ defaultMessage: "Thêm tag sản phẩm để có thể tìm kiếm nhanh các sản phẩm cùng tag ở quản lý sản phẩm sàn" })}</i>
          <div className="col-12">
            <CreatableSelect
              placeholder={intl.formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
              isMulti
              isClearable
              value={values?.product_tags || []}
              onChange={value => {
                if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                  removeAllToasts();
                  addToast(intl.formatMessage({ defaultMessage: "Tag sản phẩm tối đa chỉ được 255 ký tự" }), { appearance: 'error' });
                  return;
                }
                setFieldValue(`__changed__`, true);
                setFieldValue(`product_tags`, value)
              }}
              options={optionsProductTag}
              formatCreateLabel={(inputValue) => intl.formatMessage({ defaultMessage: "Tạo mới: {value}" }, { value: inputValue })}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default injectIntl(ProductBasicInfo);