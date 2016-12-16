'use strict'
const request = require('request')
const fs = require('fs')
const async = require('async')
const parser = require('./parser')
const twitter = require('./twitter')
const debug = require('debug')('aarf')

const DOG_SEARCH_URL = 'http://www.alaskananimalrescuefriends.org/animals/search_process?type=simple'

/** The main function */
exports.main = function main(callback){
    debug('Loading stored pets')
    let stored_pets = exports.getStoredPets()

    debug('Getting current pets from the AARF website')
    request.get(DOG_SEARCH_URL, (err, response, body) => {
        if (err) return callback(err)

        debug('Parsing pets')
        let current_pets = parser.parsePetsFromPage(body)

        debug('Storing current pets')
        exports.storeCurrentPets(current_pets)

        // We're done if there were no current pets
        // Don't want to tweet everything the first time this runs
        debug('Exiting after storing initial pet state')
        if (stored_pets === null) return callback()

        debug('Finding new pets')
        let new_pets = parser.findNewPets(stored_pets, current_pets)

        debug(new_pets.length + ' new pets found')

        // We're done if there are no new pets
        if (new_pets.length === 0) return callback()

        // Get large images for each new pet
        async.eachSeries(
            new_pets,
            (pet, callback) => {
                debug('Getting an image for ' + pet.name)

                // TODO: parse each fullsize picture from the pet detail page
                // TODO: save each fullsize picture to disk
                // TODO: save path to picture to the pet object

                twitter.tweetAPet(pet, callback)
            },
            callback
        )
    })
}


/** Fetch the stored pets from the JSON file on disk (or return an empty array).
 * Exporting this so it can be mocked for testing.
 */
exports.getStoredPets =
function getStoredPets() {
    let stored_pets

    try {
        stored_pets = require('./stored_pets')
    } catch(e) {
        stored_pets = null
    }

    return stored_pets
}


/** Save current pets to the JSON file on disk
 * Exporting this so it can be mocked for testing.
 */
exports.storeCurrentPets =
function storeCurrentPets(pets) {
    fs.writeFileSync(__dirname + '/stored_pets.json', JSON.stringify(pets))
}
