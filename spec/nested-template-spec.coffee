QUnit.specify "nested template", ->
  describe "nested template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"
      child:
        firstName: "Dexter"
        lastName: "Robson"

    nestedTemplate = new Template 'nested'

    expected = '<div data-id="nested">
                  <h3>Parent</h3>
                  <span data-id="nested.firstName">Alex</span>
                  <span> - </span>
                  <span data-id="nested.lastName">Robson</span>
                  <div data-id="nested.child">
                    <h3>Child</h3>
                    <span data-id="nested.child.firstName">Dexter</span>
                    <span> - </span>
                    <span data-id="nested.child.lastName">Robson</span>
                  </div>
                </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        nestedTemplate.apply 'nested', model, (id, x, op) ->
          markup = scrub(x)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )