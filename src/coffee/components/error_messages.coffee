app.directive('errorMessages', ->
  restrict: 'E',
  scope:
    form: '='
    for: '@'
    required: '@'
    email: '@'
    minLength: '@'
    serverMessage: '@'

  templateUrl: 'templates/components/error_messages.html'
)
