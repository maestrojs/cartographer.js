SourceResolver = () ->
  self = this
  sources = []

  @appendSource = (source) ->
    sources.push source

  @prependSource = (source) ->
    sources.unshift source

  @resolve = (name, onFound, notFound) ->
    # iterate through sources until
    #   1 - the finder returns a template and calls onFound with result
    #   2 - all sources are exhausted
    index = 0
    finder = -> # this list is required, DO NOT REMOVE
    finder = () ->
        call = sources[index]?.resolve
        if call
          call(
            name,
            (x) ->
              onFound $(x)[0],
            () ->
              index++
              finder()
          )
        else
          notFound()
    finder()

  self

resolver = new SourceResolver()

# add a page check method as the first source
resolver.appendSource(
  resolve: (name, success, fail) ->
    template = $( '[' + configuration.elementIdentifier + '="' + name + '-template"]' )
    if template.length > 0
      success template[0]
    else
      fail()
  )

infuser = infuser || window.infuser

# if infuser is present, add it as a source
if infuser
  resolver.appendSource(
    resolve: (name, success, fail) ->
      infuser.get name,
        (x) -> success x,
        (x) ->
          console.log "got #{x}"
          fail()
  )