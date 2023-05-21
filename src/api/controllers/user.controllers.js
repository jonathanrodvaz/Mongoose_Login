const { deleteImgCloudinary } = require('../../middleware/files.middleware');
const setError = require('../../helpers/handle-error');
const randomCode = require('../../utils/randomCode');
const sendEmail = require('../../utils/sendEmail');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/user.model');
const { getTestEmailSend } = require('../../state/state.data');
const nodemailer = require('nodemailer');
const { generateToken } = require('../../utils/token');
const randomPassword = require('../../utils/randomPassword');
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const BASE_URL_COMPLETE = `${BASE_URL}${PORT}`;


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
                let okSendMail = await sendEmail(email, name, confirmationCode)
                console.log(okSendMail)
                if(okSendMail == true){
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
        return next(error);
        //En este caso, podemos hacer que o le aparezca un mensaje de error segun el error que ha aparecido, o en caso de no haber mensaje de error para dicho error le mandamos un mensaje por defecto que diga "General Error register"
        //No en uso, la dejo comentada. 
        //return next(setError(500, error.message || 'General error register'))
    }
}

//---------------------///
///------LOGIN---------//
///-------------------///
const login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const userDB = await User.findOne({ email });
  
      if (userDB) {
        if (bcrypt.compareSync(password, userDB.password)) {
          const token = generateToken(userDB._id, email);
          return res.status(200).json({
            user: {
              email,
              _id: userDB._id,
            },
            token,
          });
        } else {
          return res.status(404).json('password dont match');
        }
      } else {
        return res.status(404).json('User no register');
      }
    } catch (error) {
      return next(error);
    }
  };


//------------------------------------------------------------///
///------CAMBIO DE CONTRASEÑA(Cuando no estas logado)---------//
///----------------------------------------------------------///
const changePassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const userDb = await User.findOne({ email });
      if (userDb) {
        return res.redirect(
          `${BASE_URL_COMPLETE}/api/v1/users/sendPassword/${userDb._id}`
        );
      } else {
        return res.status(404).json('User no register');
      }
    } catch (error) {}
  };
  
  const sendPassword = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userDb = await User.findById(id);
      const email = process.env.EMAIL;
      const password = process.env.PASSWORD;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: email,
          pass: password,
        },
      });
      let passwordSecure = randomPassword();
      console.log(passwordSecure);
      const mailOptions = {
        from: email,
        to: userDb.email,
        subject: '-----',
        text: `User: ${userDb.name}. Your new code login is ${passwordSecure} Hemos enviado esto porque tenemos una solicitud de cambio de contraseña, si no has sido ponte en contacto con nosotros, gracias.`,
      };
      transporter.sendMail(mailOptions, async function (error, info) {
        if (error) {
          console.log(error);
          return res.status(404).json('dont send email and dont update user');
        } else {
          console.log('Email sent: ' + info.response);
          const newPasswordBcrypt = bcrypt.hashSync(passwordSecure, 10);
          await User.findByIdAndUpdate(id, { password: newPasswordBcrypt });
          const userUpdatePassword = await User.findById(id);
          if (bcrypt.compareSync(passwordSecure, userUpdatePassword.password)) {
            return res.status(200).json({
              updateUser: true,
              sendPassword: true,
            });
          } else {
            return res.status(404).json({
              updateUser: false,
              sendPassword: true,
            });
          }
        }
      });
    } catch (error) {
      return next(error);
    }
  };
//------------------------------------------------------------///
///------CAMBIO DE CONTRASEÑA(Cuando si estas logado)---------//
///----------------------------------------------------------///
const modifyPassword = async (req, res, next) => {
    try {
      const { password, newPassword } = req.body;
      const { _id } = req.user;
      if (bcrypt.compareSync(password, req.user.password)) {
        const newPasswordHashed = bcrypt.hashSync(newPassword, 10);
        await User.findByIdAndUpdate(_id, { password: newPasswordHashed });
        const userUpdate = await User.findById(_id);
        if (bcrypt.compareSync(newPassword, userUpdate.password)) {
          return res.status(200).json({
            updateUser: true,
          });
        } else {
          return res.status(200).json({
            updateUser: false,
          });
        }
      } else {
        return res.status(404).json('password dont match');
      }
    } catch (error) {
      return next(error);
    }
  };

  //------------------------------------------------------------///
///----------------------UPDATE--------------------------------//
///----------------------------------------------------------///
const update = async (req, res, next) => {
    let catchImg = req.file?.path;
    try {
      const patchUser = new User(req.body);
      if (req.file) {
        patchUser.image = req.file.path;
      }
  
      patchUser._id = req.user._id;
      patchUser.password = req.user.password;
      patchUser.rol = req.user.rol;
      await User.findByIdAndUpdate(req.user._id, patchUser);
      if (req.file) {
        deleteImgCloudinary(req.user.image);
      }
      const updateUser = await User.findById(req.user._id);
      const updateKeys = Object.keys(req.body);
  
      const testUpdate = [];
      updateKeys.forEach((item) => {
        if (updateUser[item] === req.body[item]) {
          testUpdate.push({
            [item]: true,
          });
        }
      });
  
      if (req.file) {
        updateUser.image == req.file.path
          ? testUpdate.push({
              file: true,
            })
          : testUpdate.push({
              file: false,
            });
      }
      return res.status(200).json({
        testUpdate,
      });
    } catch (error) {
      deleteImgCloudinary(catchImg);
      return next(error);
    }
  };

//--------------------------------------------------------------///
///----------------------DELETE--------------------------------//
///----------------------------------------------------------///
const deleteUser = async (req, res, next) => {
    try {
      const { _id, image } = req.user;
      await User.findByIdAndDelete(_id);
      if (await User.findById(_id)) {
        return res.status(404).json('Dont delete');
      } else {
        deleteImgCloudinary(image);
        return res.status(200).json('ok delete');
      }
    } catch (error) {
      deleteImgCloudinary(req.user.image);
      return next(error);
    }
  };
  module.exports = {
    register,
    login,
    changePassword,
    sendPassword,
    modifyPassword,
    update,
    deleteUser,
  };