'use strict'

require('../index').main((err, data) => {
    if (err) throw err
    if (data) console.dir(data)
})
