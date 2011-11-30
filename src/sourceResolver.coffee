SourceResolver = () ->
  self = this
  sources = []

  checkPage = (name) ->
    templateElement = $( '#' + name + '-template > :only-child' )
    defaultElement = $( '#' + name )
    if templateElement.length > 0
      templateElement[0]
    else if defaultElement.length > 0 and defaultElement[0].children.length > 1
      defaultElement[0]
    else
      null

  @addSource = (source) ->
    sources.push source

  @resolve = (name, onFound, notFound) ->
    onPage = checkPage name
    if onPage
      onFound onPage
    else
      index = 0
      finder = ->
      finder = () -> sources[index].resolve name, (x) -> onFound $(x)[0], () ->
          index++
          finder()
      finder()

  self

resolver = new SourceResolver()