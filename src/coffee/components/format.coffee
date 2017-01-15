app.directive('alignTo', ->
  require: 'ngModel'
  restrict: 'A'
  link: (scope, element, attributes, controller) ->
    return unless controller

    controller.$parsers.push (time) ->
      dateToAlign = new Date(attributes.alignTo)
      dateToAlign.setHours(time.getHours())
      dateToAlign.setMinutes(time.getMinutes())

      dateToAlign
)
