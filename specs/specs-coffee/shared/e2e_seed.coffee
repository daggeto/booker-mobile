request = require('request');

seedCallbacks = []

exports.seedCallbacks = =>
  seedCallbacks

seeds = {}

exports.let = (name, params) =>
  seeds[name] = params

exports.executeSeed = (callback) =>
  console.log('[Seeder] Registering callback')
  seedCallbacks.push(callback)

exports.reset = =>
  console.log('[Seeder] Reset seeds')
  seeds = {}
  seedCallbacks = []

call = (url, method, params) ->
  defer = protractor.promise.defer()
  console.log('[Seeder] Calling', url, method, params)
  request_params =
    url: url
    method: method
    json: params

  request(request_params, (error, message) ->
    console.log('[Seeder] Done call to', url)
    if (error || message.statusCode >= 400)
      defer.reject(error: error, message: message)
    else
      defer.fulfill(message)
    return
  )
  defer.promise

exports.call = call

purge = ->
  call('http://localhost:3000/api/seeds', 'DELETE')

exports.purge = purge

create = (params)->
  call('http://localhost:3000/api/seeds', 'POST', params)

exports.create = create

seed = ->
  create(factories: seeds)

exports.seed = seed
