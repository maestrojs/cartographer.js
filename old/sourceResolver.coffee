SourceResolver = () ->
  self = this
  sources = []

  checkPage = (name) ->
    templateElement = $( '#' + name + '-template > :only-child' )
    if templateElement.length > 0
      templateElement[0]
    else
      null

  @appendSource = (source) ->
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

  if infuser
    self.appendSource
        resolve: (name, success, fail) ->
            infuser.get name,
                (x) -> success x,
                fail

  self

resolver = new SourceResolver()