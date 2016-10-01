app.filter 'price', (currencyFilter, translateFilter) ->
  (price) ->
    return translateFilter('free') if price == 0

    currencyFilter(price)
