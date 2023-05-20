//Nos traemos mongoose
const mongoose = require('mongoose');

//Nos traemos Schema
const MovieSchema = new mongoose.Schema(
    {
        name: {type:String, required: true, unique: true},
        year: {type:Number, required: true},
        characters: [{type: mongoose.Schema.Types.ObjectId, ref: 'Character'}],

    },
    {
        timestamps: true,
    }
);

//Hacemos el modelo
const Movie = mongoose.model('Movie', MovieSchema);
//Y lo exportamos
module.exports = Movie;