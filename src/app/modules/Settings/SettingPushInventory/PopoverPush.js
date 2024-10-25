import React from 'react'
import { OverlayTrigger, Popover, Button } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useFormikContext } from 'formik';

const PopoverPush = ({ fieldChange, children, handleConfirm, field }) => {
    const { formatMessage } = useIntl()
    const { values, validateForm, errors, setFieldValue, setFieldError } = useFormikContext()
    return (
        <div>
            <OverlayTrigger
                rootClose
                trigger="click"
                placement="bottom"
                overlay={<Popover>
                    <Popover.Title className="p-3" as="h6">
                        {formatMessage({ defaultMessage: "Tỷ lệ đẩy" })}
                    </Popover.Title>
                    <Popover.Content>
                        <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                            <input
                                type="text"
                                pattern="[0-9]*"
                                style={{ height: '30px', zIndex: 9999 }}
                                onFocus={e => e.stopPropagation()}
                                onKeyDown={e => e.stopPropagation()}
                                onChange={(event) => {
                                    const newValue = event.target.value;

                                    if (newValue === "" || newValue === null) {
                                        setFieldValue(field, newValue)
                                    }

                                    if (/^\d+$/.test(newValue) && newValue >= 0 && newValue <= 100) {
                                        setFieldValue(field, newValue)
                                    }
                                }}
                                value={values[field]}
                                className={`form-control mr-2 ${!!errors[field] ? 'border border-danger' : ''}`}
                            />
                            <Button
                                className="ml-2 mr-2 d-flex justify-content-center align-items-center"
                                variant="primary"
                                size="sm"
                                onClick={handleConfirm}
                            >
                                <i className="fas fa-check p-0 icon-nm" />
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setFieldValue(field, values[fieldChange])
                                    document.body.click()
                                }}
                                size="sm"
                                className="d-flex justify-content-center align-items-center"
                            >
                                <i className="fas fa-times p-0 icon-nm" />
                            </Button>
                        </div>
                    </Popover.Content>
                </Popover>}
            >
                {children}
            </OverlayTrigger>

        </div>
    )
}

export default PopoverPush