app.factory 'UserService', ($resource, API_URL) ->
  new class UserService
    $r: $resource("#{API_URL}/api/v1/services/:id/:action.json", { id: '@id', action: '@action' }
          update:
            method:'PUT'
          post:
            method: 'POST'
        )

    $events: $resource("#{API_URL}/api/v1/services/:service_id/events/:action.json",
               service_id: '@service_id',
               action: '@action'
             )

    $service_photos: $resource("#{API_URL}/api/v1/services/:service_id/service_photos.json",
                       service_id: '@service_id'
                     )
