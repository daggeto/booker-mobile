app.factory 'UsersService', ($cacheFactory, User) ->
  new class UsersService
    findById: (id) ->
      User.$r.get(id: id).$promise

    reservations: (params) ->
      params.assoc = 'reservations'
      User.$a.get(params).$promise
