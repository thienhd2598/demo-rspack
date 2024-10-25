import { useQuery } from '@apollo/client';
import React, { useMemo } from 'react'
import { Modal } from 'react-bootstrap'
import { useIntl } from 'react-intl';
import query_sme_catalog_inventory_items from '../../../../../graphql/query_sme_catalog_inventory_items';
import { flatten, uniqWith } from 'lodash';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

const DetailsVariantUnit = ({ show, onHide, data }) => {
    const { formatMessage } = useIntl();
    
    const { data: itemInventory, loading, error, refetch } = useQuery(query_sme_catalog_inventory_items, {
        variables: {
          where: {
            variant: {
                sme_catalog_product: {
                    id: {
                        _eq: data?.id
                    }
                }
            }
          },
        },
        fetchPolicy: 'cache-and-network',
      });
      const units = useMemo(() => {
             const inventoryItems = itemInventory?.sme_catalog_inventory_items
            const findItemAttribute = inventoryItems?.find(item => item?.variant?.attributes[0]?.sme_catalog_product_attribute_value?.name == data?.name)
            return uniqWith(flatten(inventoryItems?.flatMap(item => {
                const {variant: {attributes}} = item || {}
                if(attributes[0]?.sme_catalog_product_attribute_value?.name == findItemAttribute?.variant?.attributes[0]?.sme_catalog_product_attribute_value?.name) {
                    return {
                      main_unit_name: !item?.variant?.variant_unit ? item?.variant?.unit : '',
                      variant_unit: item?.variant?.variant_unit,
                      variant_id: item?.variant_id,
                      sku: item?.variant?.sku
                    }
                }
                
                return []
              })), (arrVal, othVal) => arrVal.variant_id === othVal.variant_id)
      }, [itemInventory, data])
    return (
        <>
            <Modal size="lg"
                show={show}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={onHide}
                backdrop={true}
            >
                <Modal.Body>
                    <div className='mb-2 d-flex align-items-center justify-content-between'>
                        <strong style={{ fontSize: '15px' }}>{formatMessage({ defaultMessage: "Đơn vị chuyển đổi" })}</strong>
                        <span><i style={{ cursor: "pointer", fontSize: '15px' }} onClick={onHide} className="drawer-filter-icon fas fa-times icon-md text-right"></i></span>
                    </div>

                    <div className='row col-12 mb-2'>
                        <div className='col-6 d-flex align-items-center'>
                        <span style={{width: 'max-content'}}>{formatMessage({ defaultMessage: 'Đơn vị tính chính' })}:</span>
                        {loading ? <Skeleton style={{width: 220, height: 30, marginRight: 4,borderRadius: 8}} count={1}/> : (
                            <>
                                <input style={{width: '120px'}} type="text" disabled={true} className="mx-2 form-control" value={uniqWith(flatten(units), (arrVal, othVal) => arrVal.variant_id === othVal.variant_id)?.find(item => !!item?.main_unit_name)?.main_unit_name || ''} />
                            </>
                        )}
                        </div>
                        {loading ? 
                            <div className='col-6 d-flex justify-content-end'>
                                <Skeleton style={{width: 220, height: 30, marginRight: 4,borderRadius: 8}} count={1} />
                            </div>
                            : 
                            <div className='col-6 d-flex justify-content-end'>
                                SKU: {units?.find(item => !!item?.main_unit_name)?.sku || '--'}
                            </div>
                        }
                      
                    </div>

                    <table className="table table-borderless product-list table-vertical-center fixed">
                        <thead style={{ borderRight: '1px solid #d9d9d9', zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderLeft: '1px solid #d9d9d9' }}>
                            <tr className="font-size-lg">
                                <th className="text-center" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Đơn vị chuyển đổi' })}</th>
                                <th className="text-center" style={{ fontSize: '14px', width: '40%' }}>{formatMessage({ defaultMessage: 'SKU' })}</th>
                                <th className="text-center" style={{ fontSize: '14px', width: '30%' }}>{formatMessage({ defaultMessage: 'Tỷ lệ chuyển đổi' })}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units?.filter(item => !item?.main_unit_name)?.map(item => (
                                  <tr>
                                  <td className='text-center'>{item?.variant_unit?.name}</td>
                                  <td className='text-center'>
                                      {item?.sku}
                                  </td>
                                  <td className='text-center'>
                                      {item?.variant_unit?.description}
                                  </td>
                                  </tr>
                            ))}
                               
                        </tbody>
                    </table>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default DetailsVariantUnit