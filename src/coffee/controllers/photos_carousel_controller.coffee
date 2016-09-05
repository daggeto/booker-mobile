class PhotosCarouselController
  constructor: ($scope) ->
    [@scope] = arguments

    @imageClicked = false

    this

  onImageClick: ->
    @imageClicked = !@imageClicked


  clickedClass: (clazz)->
    return "#{clazz}__clicked" if @imageClicked

app.controller('PhotosCarouselController', PhotosCarouselController)
