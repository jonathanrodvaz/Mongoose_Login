// tenemos que traernos dotenv porque tenemos la url que no queremos que se comparta publicamente. 
const dotenv = require('dotenv');
dotenv.config();


//Mongoose hace la conexion con la base de datos. Nos tenemos que traer la libreria mongoose
const mongoose = require('mongoose');

//Nos traemos la MONGO_URI del .env
const MONGO_URI = process.env.MONGO_URI

//Funcion que exporta y luego importa en el index que conecta con Mongo
const connect = async () =>{
    try {
        const db = await mongoose.connect(MONGO_URI, {
            //Esto es para hacer que la URL de mongo se parsee
                useNewUrlParser: true,
            //Esto convierte los caracteres especiales
                useUnifiedTopology: true,
        })

        //Ahora nos vamos a traer el host y el name de la base de datos.
        const{ name, host} = db.connection
        console.log(`Conectada la DB 👍 en el host: ${host} con el nombre: ${name}`);
    } catch (error) {
        console.log('No se ha conectado la DB ❌', error)
    }
}

module.exports = { connect };