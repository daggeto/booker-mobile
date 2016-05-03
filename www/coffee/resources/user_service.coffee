app.factory('UserService', ($resource, API_URL) ->
  $resource("#{API_URL}/api/v1/services/:id.json", { id: '@id' }
    update: { method:'PUT' }
  )
)
