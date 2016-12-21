'use strict'

console.log(new Date())
require('../index').main((err, data) => {
    if (err) {
        if (typeof err === Error) throw err

        console.error('--- ERROR ---')
        console.dir(err, {depth:5, color:1})
    }

    if (data) console.dir(data)
})
