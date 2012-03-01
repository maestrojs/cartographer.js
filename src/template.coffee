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
      onDone( () ->
        arguments[4] element.nodeValue
      )
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
    return ( instance, model, modelFqn, id, onElement ) ->
      newId = if id == undefined then elementId else id
      newFqn = createFqn modelFqn, newId, true, self.name

      val = model?[newId] || model
      template = val.__template__
      delete val.__template__
      val = val?.value || val
      val = if _.isFunction(val) then val.call(model) else val


      # if there's a template here, it takes the place of the current element
      if template
        #delete templateSource.__template__
        templates[newFqn] = true
        if self.templates[template]
          self.templates[template]( instance, model, modelFqn, id, onElement)
        else
          handleTemplate(
            template,
            template,
            (x) -> crawl elementFqn, x, templates, ( callback ) ->
                self.templates[template] = callback
                callback instance, model, modelFqn, id, onElement
          )
      else
          #if the value is a collection, we'll need to do our work iteratively
          childrenToCreateCount = childrenToCreate.length
          if childrenToCreate and childrenToCreateCount > 0
            # if the current value is a collection
            collection = if val?.length then val else val?.items
            collectionCount = collection?.length
            if collection and collectionCount
              # create a method for adding new elements to this template collection
              children = childrenToCreate.slice(0)
              self.factories[newFqn + "_add"] = ( newIndex, newModel ) ->
                callback = arguments[4]
                childList = new Array(childrenToCreate)
                childIndex = 0
                onChildElement = (childElement) ->
                  childList[childIndex++] = childElement
                  if childIndex == childrenToCreateCount
                    callback childList
                factory( instance, newModel, newFqn, newIndex, onChildElement ) for factory in children
              # for each value in the collection
              # create the set of child elements for that value

              total = childrenToCreateCount * collectionCount
              list = new Array(total)
              listIndex = 0
              onChildElement = (childElement) ->
                list[listIndex++] = childElement
                if listIndex == total
                  onElement makeTag( tag, element, newFqn, newId, elementId != undefined, list, model, instance )

              for indx in [0..collectionCount-1]
                for factory in childrenToCreate
                  factory( instance, collection, newFqn, indx, onChildElement )

            else # the current value is not a collection, but there are still child elements
              list = new Array(childrenToCreateCount)
              listIndex = 0
              onChildElement = (childElement) ->
                list[listIndex++] = childElement
                if listIndex == childrenToCreateCount
                # get method for creating DOM element, store and return it
                  onElement makeTag( tag, element, newFqn, newId, elementId != undefined, list, model, instance)
              controls = ( createElement( instance, val, newFqn, undefined, onChildElement ) for createElement in childrenToCreate )
          else # this element has no children, it only holds the value
            onElement makeTag( tag, element, newFqn, newId, elementId != undefined, val, model, instance )

  makeTag = (tag, originalElement, fqn, id, hasId, val, model, templateInstance ) ->
    properties = {}
    content = if _.isArray(val) and not _.isString(val) then val || val?[id] else val?[id] || val
    content = if originalElement.children.length == 0 and id == undefined then originalElement.textContent else content
    element = {}

    if hasId
      properties[configuration.elementIdentifier] = fqn
      #console.log "#{tag} - #{fqn} - #{id} - #{val}, #{JSON.stringify(model)}"
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
        result = self.render( id, model, id, undefined, (x) ->
            element = $(x.toString())[0]
            $(element).attr(configuration.elementIdentifier, id)
            self.generated[id].top = element
            wireUp(id)
            onResult id, "render", element
        )

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
      self.factories[fqn](
        templateId
        model,
        parentKey,
        childKey,
        (dom) ->
          markup = dom.toString()
          newElement = $(markup)[0]
          onResult fqn, "update", newElement
      )

  @add = (fqn, model, onResult) ->
    lastIndex = fqn.lastIndexOf "."
    templateId = fqn.split('.')[0]
    parentKey = fqn.substring 0, lastIndex
    childKey = fqn.substring ( lastIndex + 1 )

    addName = fqn + "_add"
    if self.factories[addName]
      count = $(self.generated[templateId][fqn].toString())[0].children.length
      self.factories[addName](
        count,
        model,
        undefined,
        undefined,
        ((dom) ->
          markup = dom.toString()
          newElement = $(markup)[0]
          onResult fqn, "add", newElement)
      )

  @name = name
  @fqn = ""
  @html = DOMBuilder.html
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
