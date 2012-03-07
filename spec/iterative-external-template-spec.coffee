QUnit.specify "iterative external template", ->
  describe "iterative external template", ->

    model =
        listItems: [
          { name: "banana", qty: "all of them", __template__: 'iterative-item' },
          { name: "apple", qty: "2", __template__: 'iterative-item'},
          { name: "oranges", qty: "three", __template__: 'iterative-item'}
        ]

    iterativeExternalTemplate = new Template 'iterative-external'

    expected = '<div data-id="iterative2">
                      <h3>Grocery List</h3>
                      <div data-id="iterative2.listItems">
                        <div>
                          <span data-id="iterative2.listItems.0.name">banana</span>
                          <span> - </span>
                          <span data-id="iterative2.listItems.0.qty">all of them</span>
                        </div>
                        <div>
                          <span data-id="iterative2.listItems.1.name">apple</span>
                          <span> - </span>
                          <span data-id="iterative2.listItems.1.qty">2</span>
                        </div>
                        <div>
                          <span data-id="iterative2.listItems.2.name">oranges</span>
                          <span> - </span>
                          <span data-id="iterative2.listItems.2.qty">three</span>
                        </div>
                      </div>
                    </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        iterativeExternalTemplate.apply 'iterative2', model, (id, x, op) ->
          markup = scrub(x)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          assert(model.listItems[0].__template__).equals("iterative-item")
          assert(model.listItems[1].__template__).equals("iterative-item")
          assert(model.listItems[2].__template__).equals("iterative-item")
          resume()
    )