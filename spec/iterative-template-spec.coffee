QUnit.specify "iterative template", ->
  describe "iterative template", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them" },
          { name: "apple", qty: "2"},
          { name: "oranges", qty: "three"},
        ]

    iterativeTemplate = new Template 'iterative', 'iterative', model

    expected = '<div map-id="iterative"><h3>Grocery List</h3><div map-id="listItems"><div map-id="0"><span map-id="name">banana</span><span> - </span><span map-id="qty">all of them</span></div><div map-id="1"><span map-id="name">apple</span><span> - </span><span map-id="qty">2</span></div><div map-id="2"><span map-id="name">oranges</span><span> - </span><span map-id="qty">three</span></div></div></div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        iterativeTemplate.apply model, (x) ->
          markup = x.outerHTML

        setTimeout () ->
          assert(markup).equals expected
          resume()
    )