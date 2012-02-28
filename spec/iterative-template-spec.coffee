QUnit.specify "iterative template", ->
  describe "iterative template", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them" },
          { name: "apple", qty: "2"},
          { name: "oranges", qty: "three"},
        ]

    iterativeTemplate = new Template 'iterative', 'iterative', model

    expected = '<div map-id="iterative">
                  <h3>Grocery List</h3>
                  <div map-id="iterative.listItems">
                    <div>
                      <span map-id="iterative.listItems.0.name">banana</span>
                      <span> - </span>
                      <span map-id="iterative.listItems.0.qty">all of them</span>
                    </div>
                    <div>
                      <span map-id="iterative.listItems.1.name">apple</span>
                      <span> - </span>
                      <span map-id="iterative.listItems.1.qty">2</span>
                    </div>
                    <div>
                      <span map-id="iterative.listItems.2.name">oranges</span>
                      <span> - </span>
                      <span map-id="iterative.listItems.2.qty">three</span>
                    </div>
                  </div>
                </div>'



    it "should produce the correct markup", async(() ->

        markup = ''
        iterativeTemplate.apply model, (id, op, x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )