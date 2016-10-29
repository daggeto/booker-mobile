app.filter 'actionButton', ->
  (text, icon, action, target) ->
    text = "<i class=\"icon #{icon}\"></i> #{text}"  if ionic.Platform.isAndroid()

    { text: text, icon, action: action, target: target }
