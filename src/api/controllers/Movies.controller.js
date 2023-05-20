//Nos traemos el modelo de movies.
const Character = require('../models/Character.model');
const Movie = require('../models/Movies.model');

//Nos traemos el CRUD de Chracter.controllers, lo copiamos y pegamos, pues usaremos los mismos 'metodos'



///--------
///---POST-
///--------
const create = async (req, res, next) => {
    try {
        
        const newMovie = new Movie(req.body)
        const saveMovie = await newMovie.save();
        if(saveMovie){
            return res.status(200).json(saveMovie);
        }else{
            return res.status(404).json('Failed to create movie');
        }

    } catch (error) {
        return next(error);
    }
  };



///---------
///---GETALL-
///---------
const getAll = async (req, res, next) => {
  try {
    const allMovies = await Movie.find().populate('characters')
    if(allMovies){
        return res.status(200).json(allMovies);
    }else{
        return res.status(404).json('All movies failed');
    }
  } catch (error) {
    return next(error);
  }
};



///----------
///---GETBYID-
///----------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const movieById = await Movie.findById(id).populate('characters')
    if(movieById){
        return res.status(200).json(movieById);
    }else{
        return res.status(404).json('Failed to find movie by id');
    }
  } catch (error) {
    return next(error);
  }
};


///-------------
///---GETBYNAME-
///-------------
const getByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const movieByName = await Movie.find({name})
    if(movieByName){
        return res.status(200).json(movieByName);
    }else{
        return res.status(404).json('Movie not found by name')
    }

  } catch (error) {
    return next(error);
  }
    
};



///-------------
///---UPDATE----
///-------------
const updateMovie = async (req, res, next) => {
  try {
    //Hacemos destructuring
    const { id } = req.params
    const updateMovie = await Movie.findByIdAndUpdate(
       //Primero l enviamos el id por aquí, el mismo que antes hemos convocado mediante destructuring
       id,
       //Luego le enviamos la request.body
       req.body 
    )
    //Aqui vamos a validar, sin embargo en este caso haremos que nos mande una contestacion si o si, es decir haya actualizado o no, para asi dar feedback
    if(updateMovie){
        //Aunque se mande el 200 aquí, en este caso, puede ser que no se haya actualizado la pelicula. Es decir, nos manda el 200 si ha encontrado la pelicula, pero no tiene porque significar que la pelicula ha sido actualizada. Para evitar esto, hacemos el test que veremos a continuacion del .json
        return res.status(200).json({
            oldMovie: updateMovie,
            //Hago que lo busque por Id para que en el frontal estos dos objetos se comparen y si realmente han cambiado nos hagan un ok, sino hagan otra llamada, pero tenemos que hacerlo para que el frontal sea autonomo.
            newMovie: await Movie.findById(id),
        })
    }else{
        return res.status(404).json('Movie not found, thus movie not updated')
    }
  } catch (error) {
    return next(error)
    
  }
};



///-------------
///---DELETE----
///-------------
const deleteMovie = async (req, res, next) => {
  try {
    //nos traemos el id de los params
    const { id } = req.params;
    const deleteMovie = await Movie.findByIdAndDelete(id)
   

    //Esto anterior nos devuelve siempre el elemento buscado pero puede ser que no haya borrado, por eso cuidado
    if (deleteMovie) {
      //Aqui debemos añadir un await para que al borrar una pelicula se borre del array "movies" de cada character
     await Character.updateMany({
        movie: id,
      },{
        $pull: {movie: id}
      })
      const testCharacter = await Character.find({movie: id})
        //A continuacion tendremos que hacer el test, porque esto nos va a devolver siempre algo, aunque no haya borrado. Por eso tenemos que asegurarnos de dar feedback al frontal en todo momento.
        return res.status(200).json({
            deleteMovie: deleteMovie,
            //El test consiste en buscar la pelicula borrada por id, para en caso de ser encontrada aun pese haber sido borrada demos el aviso(Todo esto es el ternario)
            test: await Movie.findById(id)? 'Error while deleting, movie was not deleted' : 'Movie was succesfully deleted',
            test: testCharacter.length > 0 ? 'Error while updating characters' : 'Succesfully updated characters'
        })
      
    } else {
      return res.status(404).json("Movie not found");
    }
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  create,
  getAll,
  getById,
  getByName,
  updateMovie,
  deleteMovie,
};
