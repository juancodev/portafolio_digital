'use strict'

const uuid = require('uuid-base62')

const fixtures = {
  getImage () {
    const id = uuid.uuid()
    return {
      description: 'es #increible las fotos con #tags #portafolio',
      tags: ['increible', 'tags', 'portafolio'],
      url: `https://portafolio_digital.test/${uuid.v4()}.jpg`,
      likes: 0,
      liked: false,
      userId: uuid.uuid(),
      publicId: uuid.encode(id),
      id: id,
      createdAt: new Date().toString()
    }
  },

  getImages (n) {
    const images = []
    while (n-- > 0) {
      images.push(this.getImage())
    }

    return images
  },

  getUser () {
    return {
      name: 'JUANCMS',
      username: `jmontilla_${uuid.v4()}`,
      createdAt: new Date().toString()
    }
  }
}

module.exports = fixtures
//  en este caso utilizaremos commonjs, ya que no utilizaremos transpilación
