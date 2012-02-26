QUnit.specify "nested template", ->
  describe "nested template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"
      child:
        firstName: "Dexter"
        lastName: "Robson"

    nestedTemplate = new Template 'nested', 'nested', model

    expected = '<div map-id="nested">
                  <h3>Parent</h3>
                  <span map-id="nested.firstName">Alex</span>
                  <span> - </span>
                  <span map-id="nested.lastName">Robson</span>
                  <div map-id="nested.child">
                    <h3>Child</h3>
                    <span map-id="nested.child.firstName">Dexter</span>
                    <span> - </span>
                    <span map-id="nested.child.lastName">Robson</span>
                  </div>
                </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        nestedTemplate.apply model, (id, op, x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )