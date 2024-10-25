import { useMutation } from '@apollo/client';
import React, { useEffect, useState } from 'react'
import mutate_coCheckLogisticFee from '../../../../../graphql/mutate_coCheckLogisticFee';
import { formatNumberToCurrency } from '../../../../../utils';
import { useFormikContext } from 'formik';
import { useToasts } from 'react-toast-notifications';
const LogisticFee = ({ variables }) => {
    const [logisticFee, setLogisticFee] = useState(0)
    const [loading, setLoading] = useState(false)
    const { setFieldValue, values } = useFormikContext()
    const [checkLogisticFree] = useMutation(mutate_coCheckLogisticFee, {
        awaitRefetchQueries: true,
      });
      const { addToast } = useToasts()
    useEffect(() => {

    (async () => {
        setLoading(true)
        const { data } = await checkLogisticFree({
            variables: {
                ...variables
            }
        })
        setLoading(false)
        if(data?.coCheckLogisticFee?.success) {
          setFieldValue(`check-free-${variables?.provider_connected_id}-service-${variables?.shipping_service}-fail`, false)
          setFieldValue(`free-${variables?.provider_connected_id}-service-${variables?.shipping_service}`, data?.coCheckLogisticFee?.price)
          setLogisticFee(data?.coCheckLogisticFee?.price)
          if(values['service_logistic']?.code) {
            setFieldValue('shipping_discount_seller_fee_step2', values['fee_bearer']?.value == 2 ? +data?.coCheckLogisticFee?.price : 0)
            setFieldValue('shipping_original_fee_logistic', data?.coCheckLogisticFee?.price|| 0)
          }
          
        } else {
          addToast(data?.coCheckLogisticFee?.message || 'Có lỗi xảy ra', {appearance: 'error'})
          setFieldValue(`free-${variables?.provider_connected_id}-service-${variables?.shipping_service}`, 0)
          setFieldValue(`check-free-${variables?.provider_connected_id}-service-${variables?.shipping_service}-fail`, true)
        }
        
        
    })()
    
    }, [values['refetchCheckFreeLogistic']])
  return (
    <div>
        {loading ? <span className="mr-3 spinner spinner-primary"></span> : values[`check-free-${variables?.provider_connected_id}-service-${variables?.shipping_service}-fail`] ? <span style={{color: '#F5222D'}}>Lỗi ĐVVC tính phí</span> :( <span>{formatNumberToCurrency(logisticFee || 0)} đ</span>)} 
    </div>
  )
}

export default LogisticFee