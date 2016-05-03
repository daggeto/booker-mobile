app.factory('UserSession', ($resource, AuthService) ->
  return $resource("#{API_URL}//users/sign_in.json");
)
