QUnit.specify "fork join", ->
  describe "time to join the forks...", ->

    argList = [
      ['a','b','c'],
      ['d','e','f'],
      ['g','h','i'],
    ]

    worker1 = (x, y, z, done) ->
      done "#{x}.#{y}.#{z}"

    worker2 = (x, y, z, done) ->
      done "#{x}-#{y}-#{z}"

    worker3 = (x, y, z, done) ->
      done "#{x}+#{y}+#{z}"

    result = ""

    it "argument queues should assemble results in order", async(() ->
        workQueue1 = queueByArgList this, worker1, argList
        forkJoin workQueue1, (list) ->
          result = "#{list[0]}.#{list[1]}.#{list[2]}"

        setTimeout () ->
          assert(result).equals "a.b.c.d.e.f.g.h.i"
          resume()
    )


    it "function queues should assemble results in order", async(() ->
        workQueue2 = queueByFunctionList this, [worker1, worker2, worker3], [1,2,3]
        forkJoin workQueue2, (list) ->
          result = "#{list[0]} #{list[1]} #{list[2]}"

        setTimeout () ->
          assert(result).equals "1.2.3 1-2-3 1+2+3"
          resume()
    )