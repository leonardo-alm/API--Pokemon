const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const morgan = require('morgan');


app.use(express.static('public'));

const PORT = process.env.PORT || 4001;

const pokemons = [
  { id: 1, type: 'Fire', name: 'Rapidash' },
  { id: 2, type: 'Water', name: 'Squirtle' },
  { id: 3, type: 'Ground', name: 'Diglett' },
  { id: 4, type: 'Fire', name: 'Charmander' },
  { id: 5, type: 'Ice', name: 'Lapras' },
  { id: 6, type: 'Ice', name: ' Articuno' },
  { id: 7, type: 'Psychic', name: 'Kadabra' },
  { id: 8, type: 'Flying', name: 'Pidgeot' },
  { id: 9, type: 'Fighting', name: 'Machamp' },
];

let nextId = 10;

// Logging
if (!process.env.IS_TEST_ENV) {
  app.use(morgan('short'));
}

// Parsing
app.use(bodyParser.json());

app.use('/pokemons/:pokemonId', (req, res, next) => {
  const pokemonId = Number(req.params.pokemonId);
  const pokemonIndex = pokemons.findIndex(pokemon => pokemon.id === pokemonId);
  if (pokemonIndex === -1) {
    return res.status(404).send('Pokemon not found');
  }
  req.pokemonIndex = pokemonIndex;
  next();
});

const validatePokemon = (req, res, next) => {
  const newPokemon = req.body;
  const validTypes = ['Normal', 'Fire', 'Water', 'Grass', 'Flying', 'Fighting',
    'Poison', 'Electric', 'Ground', 'Rock', 'Psychic', 'Ice',
    'Bug', 'Ghost', 'Steel', 'Dragon', 'Dark', 'Fairy'];

  if (validTypes.indexOf(newPokemon.type) === -1) {
    return res.status(400).send('Invalid pokemon!');
  }
  next();
}

// Get all pokemons
app.get('/pokemons/', (req, res, next) => {
  res.send(pokemons);
});

// Create a new Pokemon
app.post('/pokemons/', validatePokemon, (req, res, next) => {
  const newPokemon = req.body;
  newPokemon.id = nextId++;
  pokemons.push(newPokemon);
  res.status(201).send(newPokemon);
});

// Get a single Pokemon
app.get('/pokemons/:pokemonId', (req, res, next) => {
  res.send(pokemons[req.pokemonIndex]);
});

// Update a Pokemon
app.put('/pokemons/:pokemonId', validatePokemon, (req, res, next) => {
  const newPokemon = req.body;
  const pokemonId = Number(req.params.pokemonId);
  if (!newPokemon.id || newPokemon.id !== pokemonId) {
    newPokemon.id = pokemonId;
  }
  pokemons[req.pokemonIndex] = newPokemon;
  res.send(newPokemon);
});

// Delete a Pokemon
app.delete('/pokemons/:pokemonId', (req, res, next) => {
  pokemons.splice(req.pokemonIndex, 1);
  res.status(204).send();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
