import React, { memo } from 'react';

const getDirectionStyle = (direction, size) => {
    switch (direction) {
        case 'left':
            return {
                top: 0,
                left: 0,
                transform: 'translate3d(-100%, 0, 0)',
                width: size,
                height: '100vh',
            }
        case 'right':
            return {
                top: 0,
                right: 0,
                transform: 'translate3d(100%, 0, 0)',
                width: size,
                height: '100vh',
            }
        case 'bottom':
            return {
                left: 0,
                right: 0,
                bottom: 0,
                transform: 'translate3d(0, 100%, 0)',
                width: '100%',
                height: size,
            }
        case 'top':
            return {
                left: 0,
                right: 0,
                top: 0,
                transform: 'translate3d(0, -100%, 0)',
                width: '100%',
                height: size,
            }
        default:
            return {}
    }
};

const Drawer = ({
    open,
    onClose = () => {},
    children,
    style,
    enableOverlay = true,
    overlayColor = '#000',
    overlayOpacity = 0.4,
    zIndex = 100,
    duration = 500,
    direction,
    size = 250,
    className,
}) => {
    const overlayStyles = {
        backgroundColor: `${overlayColor}`,
        opacity: `${overlayOpacity}`,
        zIndex: zIndex,
    }

    const drawerStyles = {
        zIndex: zIndex + 1,
        transitionDuration: `${duration}ms`,
        ...getDirectionStyle(direction, size),
        ...style,
    }

    return (
        <div className='upbase-drawer'>
            <input
                type='checkbox'
                id={'upbase-drawer__checkbox'}
                className='upbase-drawer__checkbox'
                onChange={onClose}
                checked={open}
            />
            <nav
                role='navigation'            
                style={drawerStyles}
                className={'upbase-drawer__container ' + className}
            >
                {children}
            </nav>
            {enableOverlay && (
                <label
                    htmlFor={'upbase-drawer__checkbox'}
                    id={'upbase-drawer__overlay'}
                    className='upbase-drawer__overlay'
                    style={overlayStyles}
                />
            )}
        </div>
    )
};

export default memo(Drawer);