QUnit.specify "iterative throughput", ->
  describe "iterative throughput", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them" },
          { name: "apple", qty: "2"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
          { name: "oranges", qty: "three"},
        ]

    iterativeTemplate = new Template 'iterative', 'iterative'

    started = new Date().getTime()

    it "should complete 100 iterations in under 1 second", async(() ->
        total = 100
        iterations = total

        for i in [0..total]
          do () ->
            iterativeTemplate.apply model, (id, op, x) ->
              iterations = iterations - 1
              if iterations <= 0
                elapsed = new Date().getTime() - started
                console.log "#{elapsed} ms"
                assert( elapsed < total ).isTrue()
                resume()
    )