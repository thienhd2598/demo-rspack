import React, { Fragment } from 'react';

export default function ToastAlert({
    isActive, message
}) {
    return (
        <Fragment>
            {isActive && (
                <div className="overlay-alert text-center d-flex justify-content-center align-items-center">
                    <p className='text-alert'>
                        {message}
                    </p>
                </div>
            )}
        </Fragment>
    )
};