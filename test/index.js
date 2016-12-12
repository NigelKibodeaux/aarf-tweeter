'use strict'

const fs = require('fs')
const sinon = require('sinon')
const request = require('request')
const assert = require('assert')

const parser = require('../parser')
const index = require('../index')
const twitter = require('../twitter')


describe('parser.js', () => {
    let first_page
    let second_page

    before(() => {
        first_page = fs.readFileSync(__dirname + '/fixtures/1.html', 'utf8')
        second_page = fs.readFileSync(__dirname + '/fixtures/2.html', 'utf8')
    })

    describe('parsePetsFromPage', () => {
        let first_pet = {
            name: 'Amira',
            id: '9850688',
            species: 'Dog',
            breed: 'Belgian Shepherd Malinois / German Shepherd Dog / Mixed',
            sex: 'Female',
            image: 'https://s3.amazonaws.com/filestore.rescuegroups.org/7989/pictures/animals/9850/9850688/39770821_100x150.jpg'
        }
        let last_pet = {
            name: 'Zoey',
            id: '10828853',
            species: 'Dog',
            breed: 'Australian Cattle Dog/Blue Heeler / Labrador Retriever / Mixed',
            sex: 'Female',
            image: 'https://s3.amazonaws.com/filestore.rescuegroups.org/7989/pictures/animals/10828/10828853/40734777_100x133.jpg'
        }
        let no_image_pet = {
            name: 'Teddie',
            id: '10866783',
            species: 'Dog',
            breed: 'Shar Pei / Pit Bull Terrier / Mixed',
            sex: 'Female',
            image: null
        }

        it('should work', () => {
            let pets = parser.parsePetsFromPage(first_page)

            assert.equal(pets.length, 67)
            assert.deepEqual(pets[0], first_pet)
            assert.deepEqual(pets[pets.length - 1], last_pet)
            assert.deepEqual(
                pets.find(p => p.id === '10866783'),
                no_image_pet
            )
        })
    })

    describe('findNewPets', () => {
        let new_pet = {
            name: 'NewDog',
            id: '666',
            species: 'Dog',
            breed: 'New Breed',
            sex: 'Female',
            image: 'https://s3.amazonaws.com/filestore.rescuegroups.org/666.jpg'
        }
        it('should work', () => {
            let first_pets = parser.parsePetsFromPage(first_page)
            let second_pets = parser.parsePetsFromPage(second_page)

            let new_pets = parser.findNewPets(first_pets, second_pets)
            assert.deepEqual(new_pets, [ new_pet ])
        })
    })
})

describe('index.js', () => {
    let sandbox = sinon.sandbox.create()
    let twitter_stub
    let getStoredPets_stub
    let parsePetsFromPage_stub
    let fake_pets = [
        {
            name: 'NewDog',
            id: '666',
            species: 'Dog',
            breed: 'New Breed',
            sex: 'Female',
            image: 'https://s3.amazonaws.com/filestore.rescuegroups.org/666.jpg'
        }
    ]

    beforeEach(() => {
        // stub this stuff so we don't actually request the page
        sandbox.stub(request, 'get').yields(null, null, 'fake body')
        parsePetsFromPage_stub = sandbox.stub(parser, 'parsePetsFromPage')
        parsePetsFromPage_stub.returns(fake_pets)

        // and this stuff so we don't write to or read from stored_pets.json
        getStoredPets_stub = sandbox.stub(index, 'getStoredPets')
        getStoredPets_stub.returns([])
        sandbox.stub(index, 'storeCurrentPets')

        // and this so we don't actually tweet
        twitter_stub = sandbox.stub(twitter, 'tweetAPet').yields()
    })
    afterEach(() => sandbox.restore())

    it('should work with one new pet', done => {
        index.main((err, output) => {
            assert(twitter_stub.calledOnce)
            done(err)
        })
    })

    it('should not tweet with no new pets', done => {
        getStoredPets_stub.returns(fake_pets)

        index.main((err, output) => {
            assert(!twitter_stub.called)
            done(err)
        })
    })

    it('should tweet twice with 2 new pets', done => {
        parsePetsFromPage_stub.returns(fake_pets.concat(fake_pets))

        index.main((err, output) => {
            assert.equal(twitter_stub.callCount, 2)
            done(err)
        })
    })
})