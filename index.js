'use strict'
const request = require('request')
const fs = require('fs')
const async = require('async')
const parser = require('./parser')
const twitter = require('./twitter')
const config = require('./config')
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
            (pet, each_callback) => {
                debug('Getting an image for ' + pet.name)

                async.waterfall([
                    // get pet detail page
                    (cb) => {
                        request.get(
                            `${config.detail_page_prefix}${pet.id}`,
                            (err, response, body) => cb(err, body)
                        )
                    },

                    // parse the fullsize picture from the pet detail page
                    (html, cb) => {
                        try {
                            cb(null, parser.parseImageFromPage(html))
                        }
                        catch (e) {
                            // output error but don't fail the whole thing
                            console.error('Could not parse image from detail page')
                            cb()
                        }
                    },

                    // save picture to disk
                    (image_url, cb) => parser.saveImageToDisk(pet.id, image_url, cb),

                    // tweet it
                    (cb) => twitter.tweetAPet(pet, cb),

                    // delete picture
                    (twitter_stuff, cb) => parser.removeImageFromDisk(pet.id, cb),

                ], each_callback)
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
