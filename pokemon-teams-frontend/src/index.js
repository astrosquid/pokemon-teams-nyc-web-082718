const BASE_URL = "http://localhost:3000"
const TRAINERS_URL = `${BASE_URL}/trainers`
const POKEMONS_URL = `${BASE_URL}/pokemons`

document.addEventListener('DOMContentLoaded', () => {
  fetch(TRAINERS_URL)
  .then( (response) => {
    return response.json()
  })
  .then( (json) => {
    makeTrainersFromJSON(json)
    renderTrainerCards()
    createAddListener()
    createReleaseListener()
  })
})

function createAddListener() {
  const main = document.querySelector('main')
  main.addEventListener('click', (event) => {
    if (event.target && event.target.getAttribute('data-trainer-id') !== null) {
      const trainer = Trainer.findById(parseInt(event.target.getAttribute('data-trainer-id')))
      if (trainer.pokemons().length < 6) {
        trainer.getNewPokemon()
      } else {
        alert('Maximum capacity.')
      }
    }
  })
}

function createReleaseListener() {
  const main = document.querySelector('main')
  main.addEventListener('click', (e) => {
    if (e.target && e.target.className === 'release') {
      const pkmnId = parseInt(e.target.getAttribute('data-pokemon-id'))
      const pkmn = Pokemon.findById(pkmnId)
      pkmn.delete()
    }
  })
}

const makeTrainersFromJSON = (json) => {
  json.forEach( (trainer) => {
    new Trainer(trainer.id, trainer.name, trainer.pokemons)
  })
}

function renderTrainerCards() {
  const container = document.querySelector('main')
  trainers.forEach( (trainer) => {
    const card = trainer.createCardHTML()
    container.appendChild(card)
  })
}

let trainers = []
class Trainer {
  constructor(id, name, pokemons) {
    this.id = id
    this.name = name
    pokemons.forEach( (pokemonObj) => {
      new Pokemon(pokemonObj.id, pokemonObj.nickname, pokemonObj.species, this)
    })
    trainers.push(this)
    return this
  }

  static findById(id) {
    return trainers.filter( (trainer) => {
      return trainer.id === id
    })[0]
  }

  pokemons() {
    return pokemons.filter( (pokemon) => {
      return pokemon.trainer === this
    })
  }

  getNewPokemon() {
    fetch(POKEMONS_URL, {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      'body': JSON.stringify({
        'trainer_id': this.id
      })
    })
    .then( (response) => {
      return response.json()
    })
    .then( (json) => {
      const newPkmn = new Pokemon(json.id, json.nickname, json.species, this)
      this.getCard().querySelector('ul').appendChild(newPkmn.generateInfoHTML())
    })
  }

  getCard() {
    return Array.from(document.querySelectorAll('.card')).filter( (card) => {
      return parseInt(card.getAttribute('data-id')) === this.id
    })[0]
  }

  createCardHTML() {
    const card = document.createElement('div')
    card.className = 'card'
    card.setAttribute('data-id', this.id)

    const nameTag = document.createElement('p')
    nameTag.innerText = this.name
    card.appendChild(nameTag)

    const addPkmnBtn = document.createElement('button')
    addPkmnBtn.innerText = 'Add Pokémon'
    addPkmnBtn.setAttribute('data-trainer-id', this.id)
    card.appendChild(addPkmnBtn)

    const pkmnList = document.createElement('ul')
    this.pokemons().forEach( (pokemon) => {
      pkmnList.appendChild(pokemon.generateInfoHTML())
    })
    card.appendChild(pkmnList)

    return card
  }

  removePokemonFromCard(pokemon) {
    // find all the buttons that have an attr
    // called 'data-pokemon-id',
    // then filter those and find the one whose
    // id matches this pokemon.
    // get the button's parent and remove() it
    const releaseBtn = Array.from(document.querySelectorAll('button')).filter((button) => {
      return button.getAttribute('data-pokemon-id') !== null
    }).filter((button) => {
      return parseInt(button.getAttribute('data-pokemon-id')) === pokemon.id
    })[0]
    releaseBtn.parentElement.remove()
  }
}

let pokemons = []
class Pokemon {
  constructor(id, nickname, species, trainer) {
    this.id = id
    this.nickname = nickname
    this.species = species
    this.trainer = trainer
    pokemons.push(this)
    return this
  }

  static findById(id) {
    return pokemons.filter((pokemon) => {
      return pokemon.id === id
    })[0]
  }

  generateInfoHTML() {
    const item = document.createElement('li')
    item.innerText = `${this.nickname} (${this.species})`

    const releaseBtn = document.createElement('button')
    releaseBtn.innerText = 'Release'
    releaseBtn.className = 'release'
    releaseBtn.setAttribute('data-pokemon-id', this.id)

    item.appendChild(releaseBtn)

    return item
  }

  removeFromCollection() {
    pokemons = pokemons.filter( (pokemon) => {
      return pokemon.id !== this.id
    })
  }

  delete() {
    // send a DELETE request to /pokemons
    // when complete, remove this pokemon from
    // local storage, then remove from trainer's
    // list of pokemon
    fetch(POKEMONS_URL + `/${this.id}`, {
      'method': 'DELETE',
      'headers': {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .then((response) => {
      return response.json()
    })
    .then((json) => {
      this.removeFromCollection()
      this.trainer.removePokemonFromCard(this)
    })
  }
}
