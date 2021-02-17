'use strict'

const test = require('ava')
const nock = require('nock')
const portafolio = require('../index')
const fixtures = require('./fixtures')

const options = {
  endpoints: {
    pictures: 'http://portafolio-digital.test/picture',
    users: 'http://portafolio-digital.test/user',
    auth: 'http://portafolio-digital.test/auth'
  }
}

test.beforeEach(t => {
  t.context.client = portafolio.createClient(options)
})

//  en este caso, solo vamos a validar que exista el cliente, por eso no utilizamos una función async
test('client', t => {
  //  creamos un metdo para que nos muestre una referencia de la librería
  const client = t.context.client

  //  el metodo getPicture solo nos hará el llamado a la ruta
  t.is(typeof client.getPicture, 'function')
  //  será encargado de hacer el http request post de la ruta
  t.is(typeof client.savePicture, 'function')
  //  esta llamará a la ruta like
  t.is(typeof client.likePicture, 'function')
  //  nos llamará a la ruta listar imágenes
  t.is(typeof client.listPictures, 'function')
  //  nos llamará a la ruta listar imagen por tag
  t.is(typeof client.listPicturesByTag, 'function')
  //  nos llamará a la ruta guardar usuario
  t.is(typeof client.saveUser, 'function')
  //  nos llamará a la ruta obtener usuario
  t.is(typeof client.getUser, 'function')
  //  nos llamará a la ruta de autenticar usuario
  t.is(typeof client.auth, 'function')
})

test('getPicture', async t => {
  const client = t.context.client

  const image = fixtures.getImage()

  nock(options.endpoints.pictures)
  //  con qué método lo voy a llamar
    .get(`/${image.publicId}`)
  //  y nos va a retornar
    .reply(200, image)

  const result = await client.getPicture(image.publicId)

  t.deepEqual(image, result)
})

test('savePicture', async t => {
  const client = t.context.client

  const token = 'xxx-xxx-xxx'
  const image = fixtures.getImage()
  const newImage = {
    src: image.src,
    description: image.description
  }

  nock(options.endpoints.pictures, {
    //  para definir cuales son los headers que voy a recibir
    reqheaders: {
      Authorization: `Bearer ${token}`
    }
  })
    .post('/', newImage)
    .reply(201, image)

  const result = await client.savePicture(newImage, token)

  t.deepEqual(result, image)
})

test('likePicture', async t => {
  const client = t.context.client

  const image = fixtures.getImage()
  image.liked = true
  image.likes = 1

  nock(options.endpoints.pictures)
    .post(`/${image.publicId}/like`)
  //  y nos va a retornar
    .reply(200, image)

  const result = await client.likePicture(image.publicId)

  t.deepEqual(image, result)
})

test('listPictures', async t => {
  const client = t.context.client

  const images = fixtures.getImages(3)

  nock(options.endpoints.pictures)
    .get('/list')
    .reply(200, images)

  const result = await client.listPictures()

  t.deepEqual(images, result)
})

test('listPicturesByTag', async t => {
  const client = t.context.client

  const images = fixtures.getImages(3)
  const tag = 'portafolio'

  nock(options.endpoints.pictures)
    .get(`/tag/${tag}`)
    .reply(200, images)

  const result = await client.listPicturesByTag(tag)

  t.deepEqual(images, result)
})

test('saveUser', async t => {
  const client = t.context.client

  const user = fixtures.getUser()
  const newUser = {
    username: user.username,
    name: user.name,
    email: 'jmontilla@portafolio',
    password: 'jmontilla123'
  }

  nock(options.endpoints.users)
    .post('/', newUser)
    .reply(201, user)

  const result = await client.saveUser(newUser)

  t.deepEqual(result, user)
})

test('getUser', async t => {
  const client = t.context.client

  const user = fixtures.getUser()

  nock(options.endpoints.users)
    .get(`/${user.username}`)
  //  y nos va a retornar
    .reply(200, user)

  const result = await client.getUser(user.username)

  t.deepEqual(result, user)
})

test('auth', async t => {
  const client = t.context.client

  const credentials = {
    username: 'jmontilla',
    password: 'jmontilla123'
  }

  const token = 'xxx-xxx-xxx'

  nock(options.endpoints.auth)
    .post('/', credentials)
    .reply(201, token)

  const result = await client.auth(credentials.username, credentials.password)

  t.deepEqual(result, token)
})
