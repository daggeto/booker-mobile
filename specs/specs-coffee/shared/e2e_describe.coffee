Seeder = require('./e2e_seed');

exports.executeSeed = (callback) =>
  Seeder.executeSeed(callback)

exports.let = (name, params) ->
  Seeder.let(name, params)

exports.describe = ->
  Seeder.reset()

  exampleName = arguments[0]
  innerBlock = arguments[1]

  describe(exampleName, =>
    beforeEach =>
      flow = protractor.promise.controlFlow()

      flow.execute Seeder.purge
      flow.execute Seeder.seed
      flow.execute seedCallback for seedCallback in Seeder.seedCallbacks()

    innerBlock()
  )
