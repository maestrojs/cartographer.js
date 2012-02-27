QUnit.specify "iterative external template", ->
  describe "iterative external template", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them", __template__: 'iterative-item' },
          { name: "apple", qty: "2", __template__: 'iterative-item'},
          { name: "oranges", qty: "three", __template__: 'iterative-item'},
        ]

    iterativeExternalTemplate = new Template 'iterative', 'iterative-external', model

    expected = '<div map-id="iterative">
                      <h3>Grocery List</h3>
                      <div map-id="iterative.listItems">
                        <div map-id="iterative.listItems.0">
                          <span map-id="iterative.listItems.0.name">banana</span>
                          <span> - </span>
                          <span map-id="iterative.listItems.0.qty">all of them</span>
                        </div>
                        <div map-id="iterative.listItems.1">
                          <span map-id="iterative.listItems.1.name">apple</span>
                          <span> - </span>
                          <span map-id="iterative.listItems.1.qty">2</span>
                        </div>
                        <div map-id="iterative.listItems.2">
                          <span map-id="iterative.listItems.2.name">oranges</span>
                          <span> - </span>
                          <span map-id="iterative.listItems.2.qty">three</span>
                        </div>
                      </div>
                    </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        iterativeExternalTemplate.apply model, (id, op, x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )