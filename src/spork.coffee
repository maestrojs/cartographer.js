
forkJoin = (work, done, iterations) ->
  if not iterations
    iterations = 1
  total = work.length * iterations
  list = new Array(total)
  count = 0
  onList = (index, result) ->
    count++
    list[index] = result
    if count == total
      done list

  callCounter = 0
  for iteration in [0..iterations-1]
    for fx in work
      fx ( y ) ->
        onList callCounter, y
      callCounter++

queueByArgList = (context, worker, argList) ->
  count = argList.length
  list = new Array(count)
  for index in [0..count-1]
    list[index] = createCallback context, worker, argList[index]
  list

queueByFunctionList = (context, workers, args) ->
  count = workers.length
  list = new Array(count)
  for index in [0..count-1]
    list[index] = createCallback context, workers[index], args
  list

createCallback = (context, callback, args) ->
  (x) -> callback.apply(context, args.concat(x) )