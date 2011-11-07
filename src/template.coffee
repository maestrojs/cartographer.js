Template = (name, namespace) ->
    self = this

    ###import "lists.coffee" ####

    conditionalCopy = ( source, target, sourceId, targetId ) ->
      val = source[sourceId]
      if val != undefined
        if _.isArray(targetId)
          ( target[x] = val ) for x in targetId
        else
          target[targetId] = val

    copyProperties = ( source, target, list ) ->
      ( conditionalCopy source, target, x, list[x] ) for x in _.keys(list)

    crawl = ( context, root, namespace, element, onDone ) ->
        tmpId = createFqn namespace, element?.id
        if root[tmpId]?.__template__ && element && element.id && not element.nested
          resolver.resolve root[tmpId].__template__, (x) ->
            element = x
            console.log "*** #{namespace} - #{element.id} - #{element.tagName} ***"
            element.nested = true
            onElement(context, root, namespace, element, onDone)
        else
          onElement(context, root, namespace, element, onDone)

    createFqn = ( namespace, id ) ->
        if id == undefined or id == ""
            result = namespace
        else if namespace == undefined or namespace == ""
            result = id
        else if namespace == id
            result = namespace
        else
            result = "#{namespace}.#{id}"
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
        setupEvents( model?[id], root, myFqn, element, context )
        element

    onElement = ( context, root, namespace, element, onDone ) ->
          id = element["id"]
          fqn = createFqn namespace, id
          tag = element.tagName.toUpperCase()

          console.log "#{namespace} - #{id} - #{tag}"

          context = context or root
          if element.children != undefined and element.children.length > 0
            createChildren = []
            onCall = (x) ->
              createChildren.push x
              if createChildren.length == element.children.length
                call = ( html, model, parentFqn, idx ) ->
                  actualId = if id == "" then idx else id
                  myFqn = createFqn parentFqn, actualId
                  val = if actualId == fqn or actualId == undefined then model else model?[actualId]

                  console.log "#{namespace} - #{id} - #{myFqn} - #{actualId} - #{val} - #{model} "

                  collection = if val.length then val else val?.items
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
                myFqn = createFqn parentFqn, actualId
                val = if actualId == fqn then model else model?[actualId]
                childElement = makeTag( context, html, tag, element, myFqn, actualId, val, root, model )
                context[myFqn] = childElement
                childElement

            context.template[fqn] = call
            onDone call

    setupEvents = ( model, root, fqn, element, context ) ->
      if model
        (wireup x, eventHandlers[x], model, root, fqn, element, context ) for x in _.keys(eventHandlers)

    subscribe = ( context, channelName ) ->
      if @changeSubscription and @changeSubscription.unsubscribe
        @changeSubscription.ubsubscribe();
      @changesSubscription = postal.channel( channelName ).subscribe (m) ->
        if m.event != "read"
          control = context[m.key]

          lastIndex = m.key.lastIndexOf "."
          parentKey = m.key.substring 0, lastIndex
          childKey = m.key.substring ( lastIndex + 1 )
          target = "value"

          if childKey == "value" or not control
              control = context[parentKey]
              target = childKey

          if m.event == "wrote"
              if control
                if m.info.value.isProxy
                  $(context[m.key]).replaceWith context.template[m.key]( self.html, m.info.value.getRoot(), parentKey )
                else
                  conditionalCopy m.info, control, "value", modelTargets[target]

          else if m.event == "added"
            addName = parentKey + "_add"
            newElement = context.template[addName]( childKey, m.parent )
            $(context[parentKey]).append newElement

    trimFqn = (fqn) ->
      last = fqn.lastIndexOf('.')
      fqn.substring 0, last

    wireup = ( alias, event, model, root, fqn, element, context ) ->
      element[event] = (x) ->
        if event == "onchange"
              x.stopPropagation()
        context.eventChannel.publish(
          alias: alias
          id: fqn
          info: x
          control: context[fqn]
          context: context
          event: event
          model: model
          root: root
        )

    @apply = (model, onResult) ->
        crawl self, model, namespace, self.element, (x) ->
          onResult x( self.html, model )
    @name = name
    @fqn = namespace
    @element = {}
    @eventChannel = postal.channel(@fqn + "_events")
    @html = DOMBuilder.dom
    @template = {}

    resolver.resolve name, (x) ->
      self.element = x
      console.log x
    subscribe( self, self.fqn + "_model" )

    self