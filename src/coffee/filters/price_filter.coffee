app.filter 'price', (currencyFilter) ->
  (price) ->
    return 'Free' if price == 0

    currencyFilter(price)
