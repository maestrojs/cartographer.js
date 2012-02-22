Template = (name, namespace, target) ->
    self = this

    ###import "lists.coffee" ####

    conditionalCopy = ( source, target, sourceId, targetId ) ->
        if _.isArray(targetId)
          ( target[x] = source[sourceId] || target[x] ) for x in targetId
        else
          target[targetId] = source[sourceId] || target[targetId]

    copyProperties = ( source, target, list ) ->
      if source and target
        ( conditionalCopy source, target, x, list[x] ) for x in _.keys(list)

    crawl = ( context, root, namespace, element, onDone ) ->
        elementId = element?.id
        tmpId = createFqn namespace, elementId, true
        template = ""
        checkResource = true

        if not element
          template = self.name
        else if tmpId != namespace and root[tmpId]?.__template__
          template = root[tmpId].__template__
          checkResource = true
        else
          checkResource = false

        if not element or checkResource
          resolver.resolve template, (x) ->
            element = x
            element.nested = true
            onElement(context, root, namespace, element, onDone)
        else
          onElement(context, root, namespace, element, onDone)

    onElement = ( context, root, namespace, element, onDone ) ->
          id = element["id"]
          fqn = createFqn namespace, id
          tag = element.tagName.toUpperCase()
          context = context or root

          if element.children != undefined and element.children.length > 0
            createChildren = []
            onCall = (x) ->
              createChildren.push x
              if createChildren.length == element.children.length
                call = ( html, model, parentFqn, idx ) ->
                  actualId = if id == "" then idx else id
                  myFqn = createFqn parentFqn, actualId
                  val = if actualId == myFqn or actualId == undefined then model else model?[actualId]
                  if val?.value then val = val.value
                  collection = if val?.length then val else val?.items
                  if collection and collection.length
                      list = []
                      childFactory = createChildren[0]
                      context.template[myFqn + "_add"] = ( newIndex, newModel ) ->
                          childFactory( html, newModel, myFqn, newIndex )

                      for indx in [0..collection.length-1]
                          list.push ( call( html, collection, myFqn, indx ) for call in createChildren )

                      childElement = makeTag( context, html, tag, element, myFqn, actualId, list, root, model )
                      context[myFqn] = childElement
                      childElement
                  else
                      controls = ( call( html, val, myFqn ) for call in createChildren )
                      childElement = makeTag( context, html, tag, element, myFqn, actualId, controls, root, model )
                      context[myFqn] = childElement
                      childElement

                context.template[fqn] = call
                onDone call

            ( crawl( context, root, fqn, child, (x) -> onCall x ) for child in element.children )
          else
            call = ( html, model, parentFqn, idx ) ->
                actualId = if id == "" then idx else id
                myFqn = createFqn parentFqn, actualId, true
                val = if actualId == fqn then model else model?[actualId]
                childElement = makeTag( context, html, tag, element, myFqn, actualId, val, root, model )
                context[myFqn] = childElement
                childElement

            context.template[fqn] = call
            onDone call

    createFqn = ( namespace, id, filterName ) ->
        newNs = namespace || ""
        if filterName
          newNs = if newNs == self.name then "" else newNs
        newId = id || ""
        delimiter = if newNs != "" and newId != "" then "." else ""
        result = "#{newNs}#{delimiter}#{newId}"
        result

    makeTag = ( context, html, tag, template, myFqn, id, val, root, model ) ->
        properties = {}
        templateSource = if template.textContent then template.textContent else template.value
        content = if val then val else templateSource
        element = {}

        if id or id == 0
            properties.id = id

        if template
          copyProperties template, properties, templateProperties

        if tag == "INPUT"
            if not _.isObject content
              properties.value = content
            element = html[tag]( properties )
        else
          element = html[tag]( properties, content )

        if model?[id]
          if val instanceof Array
            copyProperties model[id], element, modelTargetsForCollections
          else
            copyProperties model[id], element, modelTargets
        #setupEvents( model?[id], root, myFqn, element, context )
        element

    @apply = (model, onResult) ->
        crawl self, model, "", self.element, (x) ->
          onResult x( self.html, model )

    @name = name
    @namespace = ""
    @fqn = ""
    @element = undefined
    @eventChannel = postal.channel(namespace + "_events")
    @html = DOMBuilder.dom
    @template = {}
    @changeSubscription = undefined
    @target = target or= name

    resolver.resolve name, (x) ->
      self.element = x
    #subscribe( self, namespace + "_model" )
    self


turlet = () ->

  handleModelEvent = (m) ->
    if m.event != "read"
      control = self[m.key]

      lastIndex = m.key.lastIndexOf "."
      parentKey = m.key.substring 0, lastIndex
      childKey = m.key.substring ( lastIndex + 1 )
      target = "value"
      accessKey = m.key

      if childKey == "value" or not control
        control = self[parentKey]
        target = childKey
        accessKey = parentKey

      if m.event == "wrote"
        if childKey == "__template__"
          cartographer.apply m.info.value, m.parent
        else if control and self.template[accessKey] and m.info.value and m.info.value.isProxy
          value = if m.info.value.getRoot then m.info.value.getRoot() else m.info.value
          $(self[accessKey]).replaceWith self.template[accessKey]( self.html, value, parentKey )
        else if m.info and control
          conditionalCopy m.info, control, "value", modelTargets[target]

      else if m.event == "added"
        addName = parentKey + "_add"
        if self.template[addName]
          newElement = self.template[addName]( childKey, m.parent )
          $(self[parentKey]).append newElement

  setupEvents = ( model, root, fqn, element, context ) ->
    if model
      (wireup x, eventHandlers[x], model, root, fqn, element, context ) for x in _.keys(eventHandlers)

  subscribe = ( context, channelName ) ->
    if self.changeSubscription != undefined
      self.changeSubscription.unsubscribe()
    self.changeSubscription = postal.channel( channelName ).subscribe handleModelEvent

  wireup = ( alias, event, model, root, fqn, element, context ) ->
    handler = model[alias]
    if handler
      handlerProxy = (x) -> handler.apply(
        model,
        [root, { id: fqn, control: context[fqn], event: event, context: context, info: x } ]
      )
      element[event] = handlerProxy
    else
      element[event] = (x) ->
        if event == "onchange"
          x.stopPropagation()
        context.eventChannel.publish( { id: fqn, model: model, control: context[fqn], event: event, context: context, info: x } )