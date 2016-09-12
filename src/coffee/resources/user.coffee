app.factory 'User', ($resource, API_URL) ->
  new class User
    $r: $resource("#{API_URL}/api/v1/users/:id.json", id: '@id')

    $a: $resource(
          "#{API_URL}/api/v1/users/:user_id/:assoc.json",
          user_id: '@user_id',
          assoc: '@assoc'
        )

    $session: $resource(
                "#{API_URL}/user/:action.json",
                id: '@id',
                action: '@action'
              )
