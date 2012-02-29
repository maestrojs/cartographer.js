Template = (name) ->
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
      template = elementTemplate(element) || (if not element then namespace else undefined )
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
    return ( instance, model, modelFqn, id ) ->
      newId = if id == undefined then elementId else id
      newFqn = createFqn modelFqn, newId, true, self.name

      val = model?[newId] || model
      template = val.__template__
      delete val.__template__
      val = val?.value || val
      val = if _.isFunction(val) then val.call(model) else val


      # if there's a template here, it takes the place of the current element
      if template
        console.log "#{template}"
        #delete templateSource.__template__
        templates[newFqn] = true
        if self.templates[template]

          self.templates[template]( instance, model, modelFqn, id )
        else
          console.log "create element found template: #{template} and has #{JSON.stringify(templates)}"
          callback = undefined
          handleTemplate(
            template,
            template,
            (x) -> crawl elementFqn, x, templates, ( y ) ->
                self.templates[template] = y
                callback = y
          )
          while not callback
            setTimeout (() -> ), 0
          callback instance, model, modelFqn, id
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
                factory( instance, newModel, newFqn, newIndex ) for factory in children
              # for each value in the collection
              # create the set of child elements for that value
              for indx in [0..collection.length-1]
                list.push ( factory( instance, collection, newFqn, indx, modelFqn ) for factory in childrenToCreate )
              # get method for creating DOM element, store and return it
              makeTag( tag, element, newFqn, newId, elementId != undefined, list, model, instance )
            else # the current value is not a collection, but there are still child elements
              controls = ( createElement( instance, val, newFqn, undefined, modelFqn ) for createElement in childrenToCreate )
              makeTag( tag, element, newFqn, newId, elementId != undefined, controls, model, instance)
          else # this element has no children, it only holds the value
            makeTag( tag, element, newFqn, newId, elementId != undefined, val, model, instance )

  makeTag = (tag, originalElement, fqn, id, hasId, val, model, templateInstance ) ->
    properties = {}
    content = if _.isArray(val) and not _.isString(val) then val || val?[id] else val?[id] || val
    content = if originalElement.children.length == 0 and id == undefined then originalElement.textContent else content
    element = {}

    if hasId
      properties[configuration.elementIdentifier] = fqn
      #console.log "#{tag} - #{fqn} - #{id} - #{val}, #{JSON.stringify(model)}"
      console.log "#{tag} - #{fqn} - #{id} - #{val}"
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
      self.generated[templateInstance][fqn] = element
    element

  wireUp = (id) ->
    (self.watchEvent id, x.event, x.handler ) for x in self.watching

  @apply = (id, originalModel, onResult) ->
      model = $.extend(true, {}, originalModel);
      self.generated[id] = {}
      if not self.ready
        self.deferredApplyCalls.push( () -> self.apply(id, model, onResult ) );
      else
        result = self.render( id, model, id )
        $(result).attr(configuration.elementIdentifier, id)
        self.generated[id].top = result
        wireUp(id)
        onResult id, "render", result

  @watchEvent = (id, eventName, onEvent) ->
    if self.generated[id].top #and not _.any(self.watching, (x) -> eventName == x.event )
      $(self.generated[id].top).on eventName, (ev) ->
        elementId = ev.target.attributes[configuration.elementIdentifier]?.value
        onEvent self.id, elementId, ev.target, ev.type
    self.watching.push { event: eventName, handler: onEvent }
    self.watching = _.uniq( self.watching )

  @ignoreEvent = (id, eventName) ->
    if self.generated[id].top
      self.generated[id].top.off eventname
    self.watching = _.reject( self.watching, (x) -> x.event == eventName )

  @update = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    if self.factories[fqn]
      newElement = self.factories[fqn](
        templateId
        model,
        parentKey,
        childKey
      )
      onResult fqn, "update", newElement

  @add = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    addName = fqn + "_add"
    if self.factories[addName]
      count = self.generated[templateId][fqn].children.length
      newElement = self.factories[addName](
        count,
        model
      )
      onResult fqn, "add", newElement

  @name = name
  @fqn = ""
  @html = DOMBuilder.dom
  @templates = {}
  @generated = {}
  @changeSubscription = undefined
  @watching = []
  @deferredApplyCalls = []
  @render = () ->
  @ready = false
  @factories = {}

  crawl self.name, undefined, {}, (x) ->
    self.render = x
    self.ready = true
    if self.deferredApplyCalls.length > 0
      for call in self.deferredApplyCalls
        call()

  self
