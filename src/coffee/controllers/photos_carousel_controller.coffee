app.controller 'PhotosCarouselController', ->
  new class PhotosCarouselController
    constructor: ->
      @imageClicked = false

    onImageClick: ->
      @imageClicked = !@imageClicked

    clickedClass: (clazz)->
      return "#{clazz}__clicked" if @imageClicked
