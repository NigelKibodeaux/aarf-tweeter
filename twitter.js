'use strict'

var twitterAPI = require('node-twitter-api')
var twitter_creds = require('./twitter_creds')

var twitter = new twitterAPI({
    consumerKey: twitter_creds.consumerKey,
    consumerSecret: twitter_creds.consumerSecret,
})


exports.tweetAPet =
function tweetAPet(pet_object, callback) {
    media_ids = []
    console.log('tweeting this')
    console.dir(pet_object)

    // TODO: upload a photo if there is one
        // get the fullsize one from the website
        // download it
        // upload it to twitter and get id
        // push that id to media_ids

    let message =
`${pet_object.name}
${pet_object.breed}
${pet_object.sex}
http://www.alaskananimalrescuefriends.org/animals/detail?AnimalID=${pet_object.id}`

    twitter.statuses(
        'update',
        {
            status: message,
            media_ids,
        },
        twitter_creds.access_token,
        twitter_creds.access_token_secret,
        (err, data, response) => {
            console.log('twitter response:')
            callback(err, data)
        }
    )
}