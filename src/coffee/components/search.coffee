app.directive('search', ($ionicModal) ->
  {
    restrict: 'E'
    replace: true
    controller: 'SearchController'
    controllerAs: 'vm'
    bindToController:
      getData: '&source'
    scope:
      minLength: '=?'
      placeholder: '=?'
    templateUrl: 'templates/components/search.html'
  }
)
