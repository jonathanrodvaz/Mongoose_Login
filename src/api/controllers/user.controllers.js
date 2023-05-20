const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const setError = require("../../helpers/handle-error");
const randomCode = require("../../utils/randomCode");
const sendEmail = require("../../utils/sendEmail");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');


dotenv.config();

const User = require("../models/user.model");


//---------------------///
///------REGISTER------//
///-------------------///

const register = async (req, res, next)=>{
    //Aqui es donde capturaremos la imagen que el user suba como imagen de perfil. Le metemos un optional chaining(?) para que esto no falle
    let catchImg = req.file?.path
    try {
        //Aqui hacemos que el confirmation code sea lo que randomCode genere
        let confirmationCode = randomCode();
        //Aqui vamos a realizar una constante que tenga el email y el username del usuario registrandose, constante que luego usaremos para meter dentro de la función de enviar el mail, para que la función de enviar el mail tenga el nombre y el email del usuario al que tenga que mandarle el mail.
        const {email,name} = req.body
        //Aqui vamos a buscar si el usuario que se esta registrando ya existe buscando su email y nombre de usuario, ya que ambos (email y nombre de user) tienen que ser unicos como hemos definido en el user.model
        const userExist = await User.findOne(
            {email: req.body.email},
            {name: req.body.name}
        );
        //Aqui vamos a realizar un condicional que va a encargarse de gestionar que va a hacer el sistema si el usuario que se esta registrando no existe aun en nuestros datos (Porque es un nuevo user)
        if(!userExist){
            const newUser = new User({...req.body, confirmationCode});
            //El siguiente condicional se encarga de gestionar el tema de la imagen: Metemos la imagen que el usuario sube, o en caso de que el usuario no suba ninguna foto pues ponemos una foto generica que nosotros decidimos y ponemos en el else
            if(req.file){
                newUser.image = req.file.path
            }else{
                newUser.image = 'https://pic.onlinewebfonts.com/svg/img_181369.png';
            }
            //Aqui guardaremos al usuario registrado
            const userSave = await newUser.save();
            //Aqui le mandaremos el correo al usuario
            if(userSave){
                //La función sendEmail se encargará de mandar el email de confirmación al usuario. A sendEmail le metemos el email, nombre y confirmationCode del usuario.
                const okSendEmail = sendEmail(email, name, confirmationCode)
                if(okSendEmail){
                    return res.status(200).json({
                        user: userSave,
                        confirmationCode
                    })
                }else{
                    //En caso de que el okSendEmail tenga problemas, mandamos un mensaje de error al frontal
                    return res.status(404).json({
                        user: userSave,
                        confirmationCode: "Error, resend code"
                    })
                }
            } 
            //Aqui se va a gestionar el que hacer cuando el usuario que se esta registrando ya se encuentre en nuestros datos. 
        }else{
            //En este caso deberemos también borrar la imagen, pues si el usuario al final resulta que ya existe, no podemos colgar la imagen que al principio del proceso nos ha mandado
            deleteImgCloudinary(catchImg)
            //El error 409 es el error referido a los usuarios, cuando algo existe
            return res.status(409).json("this user already exists")
        } 
        
        
    } catch (error) {
        //Aqui borramos la imagen subida por el usuario porque al final de proceso si se ha dado un error, debemos borrar la foto o sino nos arriesgamos a generar basura en nuestro cloudinary(es decir, que se llene de miles de archivos que al final no corresponden a ningun user porque cuando se han registrado han tenido problemas y el proceso de registro no ha continuado pero al no haber definido una función que se encargue de la foto subida, pues la foto se sube igualmente, ocupando valioso espacio)
        deleteImgCloudinary(catchImg)
        //En este caso, podemos hacer que o le aparezca un mensaje de error segun el error que ha aparecido, o en caso de no haber mensaje de error para dicho error le mandamos un mensaje por defecto que diga "General Error register"
        return next(setError(500, error.message || "General error register"))
    }
}
