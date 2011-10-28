SourceResolver = () ->
  self = this
  sources = []

  checkPage = (name) ->
    templateElement = $( '#' + name + '-template > :only-child' )
    defaultElement = $( '#' + name )
    if defaultElement
      defaultElement[0]
    else if templateElement
      templateElement[0]
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
      finder = () -> sources[index].resolve name, (x) -> onFound $(x)[0], () ->
          index++
          finder()

  self

resolver = new SourceResolver()