Template = (id, name) ->
  self = this

  handleTemplate = ( predicate, template, templateId, templates, onTemplate ) ->
    if predicate() and not templates[templateId]
      resolver.resolve(
        template,
        (x) ->
          templates[templateId] = true
          onTemplate(x)
        ,
        () -> console.log "Could not resolve tempalte #{template}")
      true
    else
      false

  crawl = ( model, namespace, element, onDone, templates ) ->
    if element and element.nodeType and element.nodeType != 1
      onDone () -> element
    else
      elementId = element?.attributes[configuration.elementIdentifier]?.value || ""
      modelId = (createFqn namespace, elementId, self.name, true) || self.id
      missingElement = not element
      template = externalTemplate(model, elementId) || self.name
      useTemplate = () -> ( not isCurrent(modelId, namespace) and externalTemplate(model, elementId) or missingElement)
      namespace = if ! namespace or namespace == "" then self.id else namespace
      templateId = namespace + '.' + modelId

      onTemplate = (x) -> processElement model, namespace, x, onDone, templates
      if not handleTemplate useTemplate, template, templateId, templates, onTemplate
        processElement(model, namespace, element, onDone, templates )

  buildCreateElement = ( tag, element, elementId, model, childrenToCreate ) ->
    #create closure around element creation
    createElement = ( elementModel, modelFqn, idx ) ->
      newId = if elementId == "" then idx else elementId
      newFqn = createFqn modelFqn, newId, true, self.name

      # a resilient approach to inferring what value to use
      # if we're on a 'leaf' in the model's tree, use the model as the value
      # otherwise try to access the model's property
      val = (if newId == newFqn or newId == undefined then elementModel else elementModel[newId]) || elementModel

      # if the current node has a .value property, use that as the value instead
      val = val?.value || val

      # if this element has child nodes
      if childrenToCreate
        # if the current value is a collection
        collection = if val?.length then val else val?.items
        if collection and collection.length
          list = []

          # create a method for adding new elements to this template collection
          children = childrenToCreate.slice(0)
          self.template[newFqn + "_add"] = ( newIndex, newModel ) ->
            factory( newModel, newFqn, newIndex ) for factory in children

          # for each value in the collection
          # create the set of child elements for that value
          for indx in [0..collection.length-1]
            list.push ( factory( collection, newFqn, indx ) for factory in childrenToCreate )

          # get method for creating DOM element, store and return it
          childElement = makeTag( tag, element, newFqn, newId, list, model, elementModel )
          self[newFqn] = childElement
          childElement
        else # the current value is not a collection, but there are still child elements
          controls = ( createElement( val, newFqn ) for createElement in childrenToCreate )

          # get method for creating DOM element, store and return it
          childElement = makeTag( tag, element, newFqn, newId, controls, model, elementModel )
          self[newFqn] = childElement
          childElement
      else # this element has no children, it only holds the value
        childElement = makeTag( tag, element, newFqn, newId, val, model, elementModel )
        self[newFqn] = childElement
        childElement

  # if this element has a child collection, then we need to traverse it
  # this creates a function that will get called for each of this element's
  # children and stores the function in a collection
  processElementChildren = (tag, model, fqn, element, elementId, children, onDone, templates) ->
      childrenCount = children.length
      childrenToCreate = []
      onChildElement = (child) ->
          if child.nodeType == undefined || child.nodeType == 1
            #add element to child collection
            childrenToCreate.push child
            # is this the last child element?
            if childrenToCreate.length == childrenCount
              # store the template creation method
              createElement = buildCreateElement tag, element, elementId, model, childrenToCreate
              self.template[fqn] = createElement
              onDone createElement
          else
            onDone child

      # now that we have a collection of functions to call for each child,
      # time to traverse the list and make the calls
      ( crawl( model, fqn, child, onChildElement, templates ) for child in children )

  processElement = ( model, namespace, element, onDone, templates ) ->
    # get the element id, namespace and tag
    elementId = element?.attributes[configuration.elementIdentifier]?.value || ""
    fqn = createFqn namespace, elementId, true, self.name
    tag = element.tagName.toUpperCase()

    # if this model / id maps to a model collection, check for external element templates
    template = externalItemTemplate(model, elementId)
    templateId = namespace + '.' + elementId
    predicate = () -> template
    onTemplate = (x) ->
      children = if x.length > 1 then x else [x]
      processElementChildren tag, model, fqn, element, elementId, children, onDone, templates

    if not handleTemplate( predicate, template, templateId, templates, onTemplate)
      children = element.childNodes
      childrenCount = children.length

      if childrenCount > 0
        processElementChildren tag, model, fqn, element, elementId, children, onDone, templates
      else
        createElement = buildCreateElement tag, element, elementId, model
        self.template[fqn] = createElement
        onDone createElement

  makeTag = (tag, template, fqn, id, val, root, model ) ->
    properties = {}
    content = if _.isArray(val) and not _.isString(val) then val || val?[id] else val?[id] || val
    content = if template.children.length == 0 and id == undefined then template.textContent else content
    element = {}

    console.log "#{tag} - #{fqn} - #{id} - #{content}"

    if id or id == 0
      properties[configuration.elementIdentifier] = fqn

    if template
      copyProperties template, properties, templateProperties

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
    element

  wireUp = () ->
    (self.watchEvent x.event, x.handler ) for x in self.watching

  @apply = (model, onResult) ->
    crawl model, self.id, self.element, (x) ->
      self.top = x( model, self.id )
      $(self.top).attr(configuration.elementIdentifier, self.id)
      wireUp()
      onResult self.id, "render", self.top
    , {}

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

    if self.template[fqn]
      newElement = self.template[fqn](
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
    if self.template[addName]
      count = self[fqn].children.length
      newElement = self.template[addName](
        count,
        model
      )
      onResult fqn, "add", newElement

  @name = name
  @id = id
  @fqn = ""
  @element = undefined
  @html = DOMBuilder.dom
  @template = {}
  @top = undefined
  @changeSubscription = undefined
  @watching = []

  resolver.resolve(
      name,
      (x) ->
        self.element = x
      ,() ->
        console.log "No template could be found for #{name}"
  )
  self
