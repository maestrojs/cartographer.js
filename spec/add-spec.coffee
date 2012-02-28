QUnit.specify "template add", ->
  describe "template add", ->

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
        newElement = ''

        iterativeTemplate.apply model, (id, op, x) ->
          markup = scrub(x.outerHTML)

        iterativeTemplate.add("iterative.listItems", { name: "granola", qty: "one feedbag" }, (id, op, x) ->
          newElement = scrub(x[1].outerHTML) )

        setTimeout () ->
          assert(markup).equals scrub(expected)
          assert(newElement).equals scrub('<div map-id="iterative.listItems.3"><span map-id="iterative.listItems.3.name">granola</span><span> - </span><span map-id="iterative.listItems.3.qty">one feedbag</span></div>')
          resume()
    )