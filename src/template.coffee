Template = (id, name, model) ->
  self = this

  crawl = ( model, namespace, element, onDone, templates ) ->
    elementId = element?.attributes[configuration.elementIdentifier]?.value || ""
    elementId = if elementId == self.name then "" else elementId
    modelId = createFqn namespace, elementId, self.name, true
    missingElement = not element
    template = externalTemplate(model, elementId) || self.name
    templateLoaded = not templates[ namespace + '.' + modelId ]

    if ( templateLoaded and not isCurrent(modelId, namespace) and externalTemplate(model, elementId) ) or missingElement
      resolver.resolve(
        template,
        (x) ->
          templates[namespace + '.' + modelId] = true
          onElement(model, namespace, x, onDone, templates )
        ,
        () ->
          console.log "No template could be found for #{template}"
      )
    else
      onElement(model, namespace, element, onDone, templates )

  onElement = ( model, namespace, element, onDone, templates ) ->
    #guards
    if not element
      console.log "ELEMENT IS NULL AND SHOULDN'T BE!!!!!!"

    # get the element id, namespace and tag
    elementId = element?.attributes[configuration.elementIdentifier]?.value || ""
    fqn = createFqn namespace, elementId, true, self.name
    tag = element.tagName.toUpperCase()

    # if this element has a child collection, then we need to traverse it
    # this creates a function that will get called for each of this element's
    # children and stores the function in a collection
    childrenCount = element.children?.length
    if childrenCount > 0
      childrenToCreate = []
      onChildElement = (child) ->
        #add element to child collection
        childrenToCreate.push child

        # is this the last child element?
        if childrenToCreate.length == childrenCount

          #create closure around element creation
          createElement = ( elementModel, modelFqn, idx ) ->
            newId = if elementId == "" then idx else elementId
            newFqn = createFqn modelFqn, newId, true, self.name

            # a resilient approach to inferring what value to use
            # if we're on a 'leaf' in the model's tree, use the model as the value
            # otherwise try to access the model's property
            val = (if newId == newFqn or newId == undefined then elementModel else elementModel[newId]) || elementModel

            # if the current node has a .value property, use that as the value instead
            if val?.value then val = val.value

            # if the current value is a collection
            collection = if val?.length then val else val?.items
            if collection and collection.length
              list = []
              childFactory = childrenToCreate[0]

              # create a method for adding new elements to this template collection
              self.template[newFqn + "_add"] = ( newIndex, newModel ) ->
                childFactory( newModel, newFqn, newIndex )

              # create a list of element factories for each child in the model's
              # collection
              for indx in [0..collection.length-1]
                list.push ( factory( collection, newFqn, indx ) for factory in childrenToCreate )

              # get method for creating DOM element, store and return it
              childElement = makeTag( tag, element, newFqn, newId, list, model, elementModel )
              self[newFqn] = childElement
              childElement
            else
              controls = ( createElement( val, newFqn ) for createElement in childrenToCreate )

              # get method for creating DOM element, store and return it
              childElement = makeTag( tag, element, newFqn, newId, controls, model, elementModel )
              self[newFqn] = childElement
              childElement

          # store the template creation method
          self.template[fqn] = createElement
          onDone createElement

      # now that we have a collection of functions to call for each child,
      # time to traverse the list and make the calls
      childCallback = (x) -> onChildElement x
      ( crawl( model, fqn, child, childCallback, templates ) for child in element.children )
    else
      createElement = ( elementModel, modelFqn, idx ) ->
        newId = if elementId == "" then idx else elementId
        newFqn = createFqn modelFqn, newId, true, self.name

        # a resilient approach to inferring what value to use
        # if we're on a 'leaf' in the model's tree, use the model as the value
        # otherwise try to access the model's property
        val = if newId == newFqn or newId == undefined then elementModel else elementModel[newId]

        # if the current node has a .value property, use that as the value instead
        if val?.value then val = val.value

        # get method for creating DOM element, store and return it
        childElement = makeTag( tag, element, newFqn, newId, val, model, elementModel )
        self[newFqn] = childElement
        childElement

      self.template[fqn] = createElement
      onDone createElement

  makeTag = (tag, template, fqn, id, val, root, model ) ->
    properties = {}
    templateSource = if template.textContent then template.textContent else template.value
    content = if (val?[id]) or (val and id) or template.children.length > 1 then ( val || val?[id] ) else templateSource
    element = {}

    #console.log "#{tag} - #{content} vs #{val?.outterHTML || val}"

    if id or id == 0
      properties[configuration.elementIdentifier] = id

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

  handleTemplateChange = (message) ->
      control = self[message.key]
      op = message.operation

      lastIndex = message.key.lastIndexOf "."
      parentKey = message.key.substring 0, lastIndex
      childKey = message.key.substring ( lastIndex + 1 )

      if op == "add"
        addName = parentKey + "_add"
        if self.template[addName]
          newElement = self.template[addName](
            message.value,
            parentKey,
            childKey )
          postal.publish(
              "cartographer",
              "markup.added",
              {
                operation: "added",
                parent: parentKey,
                element: newElement
              }
          )
          #$(self[parentKey]).append newElement
      else if op = "change"
        self.template[message.key](
          message.value,
          parentKey,
          childKey,
          (x) -> postal.publish(
            "cartographer",
            "markup.created",
            {
              operation: "created",
              parent: parentKey,
              element: x
            }
          )
        )

  subscribe = ( ) ->
    if self.changeSubscription != undefined
      self.changeSubscription.unsubscribe()
    self.changeSubscription = postal.subscribe(
      "cartographer",
      "template." + self.id + ".*",
      handleTemplateChange
    )



  wireUp = () ->
    (self.watchEvent x) for x in self.watching

  @apply = (model, onResult) ->
    crawl model, "", self.element, (x) ->
      self.top = x( model, "" )
      wireUp()
      onResult self.top
    , {}

  @watchEvent = (eventName) ->
    self.top.on eventName, (ev) ->
      topic =
        self.id + '.' +
        ev.target.attributes[configuration.elementIdentifier]?.value + '.' +
        ev.type
      postal.publish(
        "cartographer",
        topic,
        ev.target
      )
    self.watching = _.uniq( self.watching.push eventName )


  @ignoreEvent = (eventName) ->
    self.top.off eventname
    self.watching = _.reject( self.watching, (x) -> x == eventName )

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
  subscribe( )
  self
