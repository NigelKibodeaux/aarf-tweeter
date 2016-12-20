'use strict'

const fs = require('fs')
const twitterAPI = require('node-twitter-api')
const async = require('async')
const config = require('./config')

const twitter = new twitterAPI({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
})


exports.tweetAPet =
function tweetAPet(pet_object, callback) {
    let media_ids = []
    let image_path = `${config.pet_image_dir}/${pet_object.id}.jpg`
    console.log('tweeting this')
    console.dir(pet_object)

    // upload a photo if there is one
    let is_photo = false
    try {
        fs.statSync(image_path)
        is_photo = true
    } catch (e) { /* oh well */ }

    async.waterfall([
        // Upload image
        (cb) => {
            if (!is_photo) return cb()

             twitter.uploadMedia(
                { media: image_path },
                config.twitter.access_token,
                config.twitter.access_token_secret,
                cb
            )
        },

        // Tweet it
        (upload, cb) => {
            console.dir(upload, {depth:5, colors:1})
            if (upload && upload.media_id_string)
                media_ids.push(upload.media_id_string)

            let message = ([
                pet_object.name,
                pet_object.breed,
                pet_object.sex,
                `${config.detail_page_prefix}${pet_object.id}`,
            ]).join('\n')


            twitter.statuses(
                'update',
                {
                    status: message,
                    media_ids,
                },
                config.twitter.access_token,
                config.twitter.access_token_secret,
                (err, data, response) => {
                    // console.log('twitter data:', data)
                    callback(err, data)
                }
            )
        }
    ], callback)
}
