const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const validator = require("validator");

//Aqui hacemos el Schema. 
const UserSchema = new mongoose.Schema(
    {
        //Al final, en validate, lo que estamos haciendo es traer la libreria validator, y usar uno de sus metodos, llamado isEmail, que se encarga de comprobar que lo introducido en el campo email sea en efecto un email. Junto al isEmail, tenemos que escribir que mensaje de error se lanzará en caso de que no se introduzca un email.
        email:{type:String, required:true, trim:true, unique:true, validate:[validator.isEmail, "Email no valido"]},
        name:{type:String, required:true, trim:true, unique:true},
        //Aunque validator.isStrongPassword ya se encarga de asegurarse de que la contraseña tenga un length minimo, es bueno introducir aparte el minlength para que en caso de que la contraseña introducida sea corta se lance un mensaje de error personalizado indicando esta cuestión
        password:{type:String, required:true, trim:true, validate:[validator.isStrongPassword], minlength: [8, "Password must have min 8 characters"]},
        gender:{type:String, enum:["hombre", "mujer"], required:true},
        role:{type:String, enum:["admin", "user"], required:true},
        confirmationCode:{type:Number, required: true},
        //El check debe estar por defecto en false porque si esta en true, cualquier usuario estará automaticamente checkeado. El check es para comprobar que el user esta comprobado tras hacerse un nuevo usuario
        check:{type: Boolean, default: false},
        image:{type: String},

    },
    {
        timestamp: true,
    }


);

//Tenemos que preguardar la contraseña porque antes de guardar tenemos que encriptar la contraseña.
UserSchema.pre("save", async (next)=>{
try {
    //El bcrypt.hash es la encriptacion, y le ponemos el numero 10 para que de diez vueltas de encriptacion(Encripta, vuelve a encriptar, x10) NO METER MÁS DE 10 VUELTAS DE ENCRIPTACION
    this.password = await bcrypt.hash(this.password, 10)
    //cuanda haya dado las 10 vueltas, continuará
    next()
} catch (error) {
    next("error hashing password", error)
}
})

const User = mongoose.model("User", UserSchema)
module.exports = User;