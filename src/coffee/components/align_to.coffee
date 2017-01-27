app.directive('alignTo', ->
  require: 'ngModel'
  restrict: 'A'
  link: (scope, element, attributes, controller) ->
    return unless controller

    markAsRequired = ->
      controller[attributes.name] =
        $error: {}

      controller[attributes.name].$error.required = true

    controller.$parsers.push (time) =>
      return markAsRequired() unless time

      dateToAlign = new Date(attributes.alignTo)
      dateToAlign.setHours(time.getHours())
      dateToAlign.setMinutes(time.getMinutes())

      dateToAlign
)
