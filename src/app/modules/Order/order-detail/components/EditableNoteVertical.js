import clsx from 'clsx';
import React, { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button, ButtonToolbar, Overlay, OverlayTrigger, Popover } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import * as Yup from "yup";

const EditableNoteVertical = ({
    text,
    onConfirm,
    id
}) => {
    const { formatMessage } = useIntl();
    const [show, setShow] = useState(false);
    const [note, setNote] = useState(text || '');
    const [error, setError] = useState(null);
    const target = useRef(null);

    const yupSchema = Yup.object().shape({
        smeNote: Yup.string()
            .max(250, formatMessage({ defaultMessage: "Ghi chú người bán tối đa 250 ký tự." }))
            .test(
                'chua-ky-tu-space-o-dau-cuoi',
                formatMessage({ defaultMessage: 'Ghi chú người bán không được chứa dấu cách ở đầu và cuối' }),
                (value, context) => {
                    if (!!value) {
                        return value.length == value.trim().length;
                    }
                    return true;
                },
            )
            .test(
                'chua-ky-tu-2space',
                formatMessage({ defaultMessage: 'Ghi chú người bán không được chứa 2 dấu cách liên tiếp' }),
                (value, context) => {
                    if (!!value) {
                        return !(/\s\s+/g.test(value))
                    }
                    return true;
                },
            ).nullable(),
    });

    const resetValue = useCallback(() => {
        setNote(text);
        setError(null);
        setShow(prev => !prev);
    }, [text]);

    return (
        <div className="d-flex justify-content-start align-items-center">
            <span>
                {text || '--'}
            </span>
            <ButtonToolbar>
                <i
                    ref={target}
                    role="button"
                    className="ml-2 text-dark far fa-edit"
                    onClick={resetValue}
                />
                <Overlay
                    rootClose
                    onHide={resetValue}
                    show={show}
                    target={target.current}
                    placement="left"
                >
                    <Popover>
                        <Popover.Title className="p-3" as="h6">{formatMessage({ defaultMessage: "Cập nhật ghi chú người bán" })}
                        </Popover.Title>
                        <Popover.Content>
                            <div className="d-flex justify-content-between">
                                <div className='mr-2 d-flex flex-column'>
                                    <textarea
                                        type="text"
                                        rows={4}
                                        maxLength={250}
                                        className={clsx(`form-control mr-2`, { ['border border-danger']: !!error })}
                                        value={note}
                                        onBlur={() => {
                                            yupSchema.validate({
                                                smeNote: note
                                            }).then(value => {
                                                setError(null);
                                            }).catch(error => {
                                                setError(error?.message);
                                            })
                                        }}
                                        onChange={(event) => {
                                            const newValue = event.target.value;

                                            setError(null);
                                            setNote(newValue)
                                        }}
                                    />
                                    <span className="text-right mt-1" style={{ color: 'rgba(0,0,0, 0.45)' }} >{`${note?.length || 0}/${250}`}</span>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    style={{ height: 30 }}                                    
                                    onClick={() => {
                                        yupSchema.validate({
                                            smeNote: note
                                        }).then(value => {
                                            !!onConfirm && onConfirm({
                                                sme_note: note,
                                                list_order_id: [id]
                                            }, () => {
                                                resetValue();
                                            })
                                        }).catch(error => {
                                            setError(error?.message);
                                        })
                                    }}
                                    className="mr-2 d-flex justify-content-center align-items-center">
                                    <i className="fas fa-check p-0 icon-nm" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    style={{ height: 30 }}
                                    onClick={resetValue}
                                    size="sm"
                                    className="d-flex justify-content-center align-items-center">
                                    <i className="fas fa-times p-0 icon-nm" />
                                </Button>
                            </div>
                            {!!error && (
                                <span className='text-danger mt-2 d-block' style={{ maxWidth: '75%' }}>{error}</span>
                            )}
                        </Popover.Content>
                    </Popover>
                </Overlay>
            </ButtonToolbar>
        </div>
    )
};

export default memo(EditableNoteVertical);