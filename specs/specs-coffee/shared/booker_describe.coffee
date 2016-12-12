window.Booker = {}
window.Booker.describe = ->
  exampleName = arguments[0]
  innerBlock = arguments[1]

  describe(exampleName, ->
    beforeEach( ->
      module('booker')
      module(($provide, $urlRouterProvider) ->
        $provide.value('$ionicTemplateCache',-> )
        $urlRouterProvider.deferIntercept()
      )
    )

    innerBlock()
  )
