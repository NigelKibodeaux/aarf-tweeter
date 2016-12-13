'use strict'
const cheerio = require('cheerio')

module.exports.parsePetsFromPage =
function parsePetsFromPage(html) {
    let headings = []
    let pets = []
    let $ = cheerio.load(html)
    $('tr')
        .slice(1) // first row is a header. skip it
        .each((row_index, row) => {
            let pet = {}

            $('td', row)
                .each((cell_index, cell) => {
                    if (cell_index === 0) { // Name and ID
                        pet.name = $(cell).text().trim()
                        pet.id = $(cell).html().match(/AnimalID=(\d+)/)[1]
                    }

                    if (cell_index === 1) { // Species and Breed
                        let matches = $(cell).text().trim().match(/(\S+) - (.+)/)
                        pet.species = matches[1]
                        pet.breed = matches[2]
                    }

                    if (cell_index === 2) { // Sex
                        pet.sex = $(cell).text().trim()
                    }

                    if (cell_index === 3) { // Image
                        let image_matches = $(cell).html().match(/src="([^"]+)"/)
                        pet.image = image_matches && image_matches[1]
                    }
                })

            pets.push(pet) // add pet except for first row
        })

    return pets
}


module.exports.findNewPets =
function findNewPets(old_pets, new_pets) {
    return new_pets.filter(new_pet => {
        let pet_found = old_pets.find(old_pet => old_pet.id === new_pet.id)
        return !pet_found
    })
}


module.exports.parseImageFromPage =
function parseImageFromPage(html) {
    throw new Error('not implemented!')
}