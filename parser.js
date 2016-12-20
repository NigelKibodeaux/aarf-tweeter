'use strict'
const cheerio = require('cheerio')
const request = require('request')
const fs = require('fs')
const config = require('./config')


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
    let $ = cheerio.load(html)
    let url = null
    try {
        url = $('meta[property="og:image"]')[0].attribs['content']
    }
    catch (e) { console.log('No large image found') }

    return url
}


module.exports.saveImageToDisk =
function saveImageToDisk(pet_id, image_url, callback) {
    let save_location = `${config.pet_image_dir}/${pet_id}.jpg`
    let statusCode

    // Do nothing if there is no image URL
    if (!image_url) return callback()

    request
        .get(image_url)
        .on('response', (response) => {
            statusCode = response.statusCode
        })
        .on('error', callback)
        .on('end', () => {
            let err = null
            if (statusCode != 200) err = new Error(statusCode)
            callback(err)
        })
        .pipe(fs.createWriteStream(save_location))
}


module.exports.removeImageFromDisk
= function removeImageFromDisk(pet_id, callback) {
    let save_location = `${config.pet_image_dir}/${pet_id}.jpg`

    fs.unlink(save_location, (err) => callback())
}
