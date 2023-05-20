const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const Character = require("../models/Character.model");
const Movie = require("../models/Movies.model");



///--------
///---POST-
///--------

const create = async (req, res, next) => {
    //Capturo la url por si luego la tengo que borrar y le pongo el optional chaining (?) para que no me rompa en caso que no tenga la clave path
    let catchImg = req.file?.path;
    try {
      await Character.syncIndexes();
      //Creamos este objeto para poder en un array el id de la pelicula o peliculas a la que character pertenece
      const filterBody = {
        name: req.body.name,
        gender: req.body.gender,
        
      }
      //Creamos un nuevo modelo con los datos que nos trae la request body
      const newCharacter = new Character(filterBody);


      //Cogemos las movies de la req.body y las recorremos
      const {movie} = req.body
      //Con esta linea de codigo podremos introducir los ids de las peliculas a las que los characters pertenecen
     const arrayMovie = movie.split(",")
     arrayMovie.forEach((item)=>{
      newCharacter.movie.push(item);

     })
      
      //Con este codigo, si el usuario envia imagen le metemos la que nos envia, pero sino le metemos una foto general por defecto.
      if (req.file) {
        newCharacter.image = req.file.path;
      } else {
        newCharacter.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }
  
      //Lo guardamos en la database
      const saveCharacter = await newCharacter.save();
      //Aqui es donde haremos el push en movie metiendo los personajes
      arrayMovie.forEach(async(item, index)=>{

        const characterById = await Character.findById(saveCharacter._id)
        await characterById.updateOne({
          //La siguiente linea nos servirá para meter en el array de character en movies el character que aquí estemos creando
          $push: {movie: item},
         
        })
      })
  
      // Evaluamos que se haya efectuado correctamente
      if (saveCharacter) {
        //En caso correcto: se envia un codigo 200 (Codigo que indica que todo esta correcto) y un json con el objeto posteado
        //Aqui es donde postearemos en movie. Primero crearemos la pelicula a la que queremos apuntar, con los siguientes const
        const arrayTest = []
         arrayMovie.forEach(async(itemID)=>{
           const movieById = await Movie.findById(itemID)
           await movieById.updateOne({
             //La siguiente linea nos servirá para meter en el array de character en movies el character que aquí estemos creando
             $push: {characters: saveCharacter._id},
            
           })
           const testUpdateMovie = await Movie.findById(itemID);
            arrayTest.push({
            idMovie: itemID,
            idCharacter: newCharacter._id,
            testMovieUpdate: testUpdateMovie.characters.includes(saveCharacter._id) ? true : false,

        })
        })
        
        //Tendremos que modificar el json original porque necesitaremos que de feedback de que todo lo anterior se ha realizado
        return res.status(200).json({
          newCharacter: saveCharacter,
          testMovieUpdate: arrayTest,
        });
      } else {
        //En caso negativo: se envia un 404 not found(Codigo que se utiliza tanto para el not found como no el not correct), que indica que no se ha enviado el elemento a la database
        return res.status(404).json("Unable to upload Character");
      }
    } catch (error) {
      //Lanzamos a traves del next el error a nivel general de try cach para tener constancia en el log de este error
      deleteImgCloudinary(catchImg);
  
      return next(error);
    }
  };



///---------
///---GETALL-
///---------
const getAll = async (req, res, next) => {
  try {
    //El find() de Mongoose nos trae todos los elementos (A diferencia de como funciona en js)
    const allCharacter = await Character.find().populate('movie')
    if (allCharacter) {
      return res.status(200).json(allCharacter);
    } else {
      return res.status(404).json("Character not found");
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
    const characterById = await Character.findById(id).populate('movie')
    if (characterById) {
      return res.status(200).json(characterById);
    } else {
      return res.status(404).json("ID not found");
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
    const characterByName = await Character.find({ name });
    if (characterByName) {
      return res.status(200).json(characterByName);
    } else {
      return res.status(404).json("Name not found");
    }
  } catch (error) {
    return next(error);
  }
};



///-------------
///---UPDATE----
///-------------
const updateCharacter = async (req, res, next) => {
  //Capturo la url por si luego la tengo que borrar y le pongo el optional chaining (?) para que no me rompa en caso que no tenga la clave path
  let catchImg = req.file?.path;
  try {
    const { id } = req.params;

    ///Aqui vamos a buscar que exista este character en la database
    const characterById = await Character.findById(id);

    ///Aqui guardamos la URL de la imagen antigua
    const oldImg = characterById.image;

    //Si el character existe entonces ejecutamos el update.
    if (characterById) {
      //Instanciamos un nuevo objeto del modelo Character
      const patchCharacter = new Character(req.body);

      //IMPORTANTE: Metemos el ID antiguo para que no cambie.
      patchCharacter._id = id;

      //Si hemos recibido un archivo entonces lo metemos en la clave imagen
      if (req.file) {
        patchCharacter.image = req.file.path;
      } else {
        //Si no hemos recibido un archivo entonces nos quedamos con el antiguo
        patchCharacter.image = oldImg;
      }

      //Hacemos la query de Mongoose de encontrar por ID y actualizar
      const saveCharacter = await Character.findByIdAndUpdate(
        id,
        patchCharacter
      );
      //Entonces evaluamos si esta se ha realizado correctamente
      if (saveCharacter) {
        //En caso de haberse actualizado --> Borro la foto antigua de cloudinary
        //Y envio la respuesta con un codigo 200
        deleteImgCloudinary(oldImg);
        return res.status(200).json(await Character.findById(id));
      } else {
        //En caso de no haberse actualizado --> Mando una respuesta con un 404 y un mensaje indicando que no se ha actualizado
        return res.status(404).json("Unable to update");
      }

      //Si el character no existe lanzamos un error al usuario por la res.
    } else {
      //Si no se ha encontrado por id --> Mando una respuesta 404 con un mensaje indicando que no se ha encontrado
      return res.status(404).json("ID not found");
    }
  } catch (error) {
    //IMPORTANTE: Si el character no se encontro, o hay cualquier otro error capturado, la foto se ha subido antes porque esta en el middleware
    //Por lo cual hay que borrarla para no tener basura ocupando nuestro cloudinary
    if (req.file) {
      //Le pasamos el req.file.path que incluye la url de cloudinary
      deleteImgCloudinary(catchImg);
    }

    //Y por ultimo lanzamos el error que se guardara en el log del backend
    return next(error);
  }
};



///-------------
///---DELETE----
///-------------
const deleteCharacter = async (req, res, next) => {
  try {
    //nos traemos el id de los params
    const { id } = req.params;

    //Buscamos por ID y borramos
    const deleteCharacter = await Character.findByIdAndDelete(id);

    //Esto anterior nos devuelve siempre el elemento buscado pero puede ser que no haya borrado, por eso cuidado
    if (deleteCharacter) {
      //Para ver que esto esta correctamente borrado lo buscamos en la db, si no esta elimino la imagen y si esta lanzo un next para acabe con la ejecucion
      if(await Character.findById(id)){
        next("Error while deleting image")
      }else{
        deleteImgCloudinary(deleteCharacter.image);
        //Una vez borrada la imagen de cloudinary, cojo y busco la pelicula y para que haya consistencia va a sacar las peliculas. 
        await Movie.updateMany({characters: id},
          {
          $pull: {characters: id}
        })
      }
        
      //Si todo se ha hecho correctamente lanzamos un 200, no obstante tambien test en el runtime que se haya hecho correctamente con la clave test
      return res.status(200).json({
        deleteObject: deleteCharacter,
        test: (await Character.findById(id)) ? "not ok delete" : "ok delete",
      });
    } else {
      return res.status(404).json("Character not found, unable to delete");
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
  updateCharacter,
  deleteCharacter,
};


//Como crear un dato de TYPE OBJECT ID, ejemplo adicional//
//arrayMovie.forEach((item)=>{
//  console.log(item);
//  const idObject = new ObjectId(item);
//    newCharacter.movie.push(idObject);
//});

//const mongoose = require("mongoose"),ObjectId;
//const ObjectId = require("mongodb").ObjectId;
//const new ObjectId = new mongoose("idquequeramos")