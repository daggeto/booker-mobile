window.Booker = {};

window.Booker.describe = function() {
  var exampleName, innerBlock;
  exampleName = arguments[0];
  innerBlock = arguments[1];
  return describe(exampleName, function() {
    beforeEach(function() {
      module('booker');
      return module(function($provide, $urlRouterProvider) {
        $provide.value('$ionicTemplateCache', function() {});
        return $urlRouterProvider.deferIntercept();
      });
    });
    return innerBlock();
  });
};
