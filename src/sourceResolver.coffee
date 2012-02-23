SourceResolver = () ->
  self = this
  sources = []

  @addSource = (source) ->
    sources.push source

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
resolver.addSource(
  resolve: (name, success, fail) ->
    template = $( '[' + configuration.elementIdentifier + '="' + name + '-template"]' )
    if template.length > 0
      success template[0]
    else
      fail()
  )

# if infuser is present, add it as a source
if infuser
  resolver.addSource(
    resolve: (name, success, fail) ->
      infuser.get name,
        (x) -> success x,
        (x) ->
          console.log "got #{x}"
          fail()
  )