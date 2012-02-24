# conditionally combine the current namespace and the current element id
createFqn = ( namespace, id, name, filterName ) ->
  newNs = namespace || ""
  if filterName
    if namespace == "" and id == name
      return ""
    else
      newNs = if newNs == name then "" else newNs
  newId = id || ""
  delimiter = if newNs != "" and newId != "" then "." else ""
  result = "#{newNs}#{delimiter}#{newId}"
  result

conditionalCopy = ( target, targetId, value ) ->
  original = target[targetId]
  if original || value
    target[targetId] = value || original

propertyCopy = ( source, target, sourceId, targetId ) ->
  if _.isArray(targetId)
    ( conditionalCopy target, x, source[sourceId] ) for x in targetId
  else
    conditionalCopy target, targetId, source[sourceId]

copyProperties = ( source, target, list ) ->
  if source and target
    ( propertyCopy source, target, x, list[x] ) for x in _.keys(list)

isCurrent = ( id, namespace ) -> id == namespace

externalTemplate = ( model, id ) -> model[id]?.__template__