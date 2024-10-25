import { defineMessages} from 'react-intl'

const STATUS_TAB = Object.freeze({
    GMV: 1,
    ByQuantity: 2
})

const defineTextTab = defineMessages({
    GMV: {
        defaultMessage: 'Theo doanh số'
    },
    ByQuantity: {
        defaultMessage: 'Theo số sản phẩm'
    }
})

const Tabs = [
    { value: STATUS_TAB['GMV'], title: defineTextTab.GMV },
    { value: STATUS_TAB['ByQuantity'], title: defineTextTab.ByQuantity },
  ]

export { STATUS_TAB, Tabs }