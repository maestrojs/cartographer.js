QUnit.specify "iterative external template", ->
  describe "iterative external template", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them", __template__: 'iterative-item' },
          { name: "apple", qty: "2", __template__: 'iterative-item'},
          { name: "oranges", qty: "three", __template__: 'iterative-item'},
        ]

    iterativeExternalTemplate = new Template 'iterative-external', 'iterative-external', model

    expected = '<div map-id="iterative-external"><h3>Grocery List</h3><div map-id="listItems"><div map-id="0"><span map-id="name">banana</span><span> - </span><span map-id="qty">all of them</span></div><div map-id="1"><span map-id="name">apple</span><span> - </span><span map-id="qty">2</span></div><div map-id="2"><span map-id="name">oranges</span><span> - </span><span map-id="qty">three</span></div></div></div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        iterativeExternalTemplate.apply model, (x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )