//Este archivo, handle-error, es donde se encuentra una función que nos ayudará a gestionar los errores
const setError = (code, message)=>{
    const error = new Error()
    error.code = code
    error.message = message
    return error
}

module.exports = setError;