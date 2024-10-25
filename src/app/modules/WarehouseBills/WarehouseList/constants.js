
const preallocateStatus = Object.freeze({
    ALLOW_PREALLOCATE: 1,
    NOT_ALLOW_PREALLOCATE: 0,
})

const typesAction = Object.freeze({
    SET_DEFAULT_WAREHOUSE: 'SET_DEFAULT_WAREHOUSE',
    UPDATE_PREALLOCATE: 'UPDATE_PREALLOCATE',
    CREATE_WAREHOUSE: 'CREATE_WAREHOUSE',
    UPDATE_WAREHOUSE: 'UPDATE_WAREHOUSE',
})

const typesScan = Object.freeze({
    SINGLE_SCAN: 1,
    MULTIPLE_SCAN: 2
})


export {
    preallocateStatus,
    typesAction,
    typesScan
}