SourceResolver = () ->
  self = this
  sources = []

  checkPage = (name) ->
    element = $( '#' + name )
    if element
      return element[0]
    else
      null

  checkSources = (name) ->
    result = _.find( sources, (s) -> s.resolve name )
    $(result)[0]

  @addSource = (source) ->
    sources.push source

  @resolve = (name) ->
    embedded = checkPage name
    embedded or= checkSources name

  self

resolver = new SourceResolver()