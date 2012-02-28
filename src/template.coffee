Template = (id, name) ->
  self = this

  handleTemplate = ( template, templateId, onTemplate ) ->
    if self.templates[templateId]
      onTemplate self.templates[templateId]
      true
    else
      resolver.resolve(
        template,
        (x) ->
          self.templates[templateId] = x
          onTemplate(x)
        ,
        () -> console.log "Could not resolve tempalte #{template}")
      true

  elementTemplate = ( element ) ->
    element?.attributes[configuration.templateIdentifier]?.value

  crawl = ( namespace, element, templates, onDone ) ->

    if element?.nodeType and element.nodeType != 1
      onDone( () -> element.nodeValue )
    else
      template = elementTemplate(element) || (if not element then self.name else undefined )
      elementId = element?.attributes[configuration.elementIdentifier]?.value
      elementFqn = namespace + if elementId then ".#{elementId}" else ''

      # if there's a template here, it takes the place of the current element
      if template
        handleTemplate(
          template,
          elementFqn + "." + template,
          (x) -> crawl namespace, x, templates, onDone
        )
      else
        # otherwise, process this element directly
        # this requires a depth-first approach since we don't know
        # what it will take to produce this element until we know all
        # the children involved
        children = element.childNodes
        childFunctionsExpected = children.length

        continueProcessing = (contentList) ->
          factory = buildCreateElement element, elementId, elementFqn, contentList, templates
          self.factories[elementFqn] = factory
          onDone( factory )

        if children.length > 0
          childrenFunctions = []
          addChildFunction = ( factory ) ->
            childrenFunctions.push( factory )
            if childrenFunctions.length == childFunctionsExpected
              continueProcessing( childrenFunctions )
          ( crawl elementFqn, child, templates, addChildFunction ) for child in children
        else
          continueProcessing []

  buildCreateElement = ( element, elementId, elementFqn, childrenToCreate, templates ) ->
    #create closure around element creation
    tag = element.tagName.toUpperCase()
    return ( model, modelFqn, id ) ->
      newId = if id == undefined then elementId else id
      newFqn = createFqn modelFqn, newId, true, self.name
      val = if newId == undefined then model else model?[newId]
      val = val?.value || val

      template = val?.__template__ #|| model?.__template__
      # if there's a template here, it takes the place of the current element
      if template and not templates[newFqn]
        templates[newFqn] = true
        handleTemplate(
          template,
          template,
          (x) -> crawl elementFqn, x, templates, ( callback ) ->
            callback model, modelFqn, id
        )
      else
          #if the value is a collection, we'll need to do our work iteratively
          if childrenToCreate and childrenToCreate.length > 0
            # if the current value is a collection
            collection = if val?.length then val else val?.items
            if collection and collection.length
              list = []
              # create a method for adding new elements to this template collection
              children = childrenToCreate.slice(0)
              self.factories[newFqn + "_add"] = ( newIndex, newModel ) ->
                factory( newModel, newFqn, newIndex ) for factory in children
              # for each value in the collection
              # create the set of child elements for that value
              for indx in [0..collection.length-1]
                list.push ( factory( collection, newFqn, indx ) for factory in childrenToCreate )
              # get method for creating DOM element, store and return it
              makeTag( tag, element, newFqn, newId, elementId != undefined, list, model )
            else # the current value is not a collection, but there are still child elements
              controls = ( createElement( val, newFqn ) for createElement in childrenToCreate )
              makeTag( tag, element, newFqn, newId, elementId != undefined, controls, model )
          else # this element has no children, it only holds the value
            makeTag( tag, element, newFqn, newId, elementId != undefined, val, model )

  makeTag = (tag, originalElement, fqn, id, hasId, val, model ) ->
    properties = {}
    content = if _.isArray(val) and not _.isString(val) then val || val?[id] else val?[id] || val
    content = if originalElement.children.length == 0 and id == undefined then originalElement.textContent else content
    element = {}

    if hasId
      properties[configuration.elementIdentifier] = fqn
      #console.log "#{tag} - #{fqn} - #{id} - #{val}"
    if originalElement
      copyProperties originalElement, properties, templateProperties
    if tag == "INPUT"
      if not _.isObject content
        properties.value = content
      element = self.html[tag]( properties )
    else
      element = self.html[tag]( properties, content )

    if model?[id]
      if val instanceof Array
        copyProperties model[id], element, modelTargetsForCollections
      else
        copyProperties model[id], element, modelTargets

    if hasId
      self[fqn] = element
    element

  wireUp = () ->
    (self.watchEvent x.event, x.handler ) for x in self.watching

  @apply = (model, onResult) ->
      if not self.ready
        self.deferredApplyCalls.push( () -> self.apply(model, onResult ) );
      else
        self.top = self.render( model, self.id )
        $(self.top).attr(configuration.elementIdentifier, self.id)
        wireUp()
        onResult self.id, "render", self.top

  @watchEvent = (eventName, onEvent) ->
    if self.top #and not _.any(self.watching, (x) -> eventName == x.event )
      $(self.top).on eventName, (ev) ->
        elementId = ev.target.attributes[configuration.elementIdentifier]?.value
        onEvent self.id, elementId, ev.target, ev.type
    self.watching.push { event: eventName, handler: onEvent }
    self.watching = _.uniq( self.watching )

  @ignoreEvent = (eventName) ->
    if self.top
      self.top.off eventname
    self.watching = _.reject( self.watching, (x) -> x.event == eventName )

  @update = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    if self.factories[fqn]
      newElement = self.factories[fqn](
        model,
        parentKey,
        childKey
      )
      onResult fqn, "update", newElement

  @add = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    addName = fqn + "_add"
    if self.factories[addName]
      count = self[fqn].children.length
      newElement = self.factories[addName](
        count,
        model
      )
      onResult fqn, "add", newElement

  @name = name
  @id = id
  @fqn = ""
  @html = DOMBuilder.dom
  @templates = {}
  @top = undefined
  @changeSubscription = undefined
  @watching = []
  @deferredApplyCalls = []
  @render = () ->
  @ready = false
  @factories = {}
  crawl self.id, undefined, {}, (x) ->
    self.render = x
    self.ready = true
    if self.deferredApplyCalls.length > 0
      for call in self.deferredApplyCalls
        call()

  self
