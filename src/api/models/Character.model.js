// Creamos el modelo de datos con mongoose.
const mongoose = require('mongoose')

//Traemos el Schema de datos: Es la definición de datos
const Schema = mongoose.Schema 

    //Definimos el esqueleto del modelo character
    //1)Definimos lo primero el TYPE --> tipo de dato
    //2)Vamos a definir que este dato sea requerido para crear el modelo REQUIRED. Cuando el valor no sea requerido, debes poner 'required:false'

const CharacterSchema = new Schema(
    {
       name: { type: String, required: false },
       gender: { type: String, enum: ['hombre', 'mujer', 'fluido'], required: false},
       image: { type: String},
       movie: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]


    }, 
    {
        timestamps:true,
    }


)

//Hacemos el modelo, donde llamaremos a mongoose para que meta el modelo de datos.
const Character = mongoose.model('Character', CharacterSchema);

//Y como siempre debemos hacer, lo exportamos. Lo importará controller. 
module.exports = Character;