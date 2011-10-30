SourceResolver = () ->
  self = this
  sources = []

  checkPage = (name) ->
    templateElement = $( '#' + name + '-template > :only-child' )
    defaultElement = $( '#' + name )
    if templateElement.length > 0
      templateElement[0].clone()
    else if defaultElement.length > 0
      defaultElement[0].clone()
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