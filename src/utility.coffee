# conditionally combine the current namespace and the current element id
createFqn = ( namespace, id, name, filterName ) ->
  newNs = namespace || ""
  if filterName
    newNs = if newNs == name then "" else newNs
  newId = id || ""
  delimiter = if newNs != "" and newId != "" then "." else ""
  result = "#{newNs}#{delimiter}#{newId}"
  result

conditionalCopy = ( source, target, sourceId, targetId ) ->
  if _.isArray(targetId)
    ( target[x] = source[sourceId] || target[x] ) for x in targetId
  else
    target[targetId] = source[sourceId] || target[targetId]

copyProperties = ( source, target, list ) ->
  if source and target
    ( conditionalCopy source, target, x, list[x] ) for x in _.keys(list)

isCurrent = ( id, namespace ) -> id == namespace

externalTemplate = ( model, id ) -> model[id]?.__template__