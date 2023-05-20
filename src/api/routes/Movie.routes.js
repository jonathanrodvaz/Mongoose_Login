const express = require('express');
const { create, getAll, getById, getByName, updateMovie, deleteMovie } = require('../controllers/Movies.controller');
const MovieRoutes = express.Router();


MovieRoutes.post('/', create);
MovieRoutes.get('/', getAll);
MovieRoutes.get('/:id', getById);
MovieRoutes.get('/name/:name', getByName);
MovieRoutes.patch('/:id', updateMovie);
MovieRoutes.delete('/:id', deleteMovie);


module.exports = MovieRoutes;