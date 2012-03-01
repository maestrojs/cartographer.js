
QUnit.specify "parent-child template", ->
  describe "parent-child template", ->

    model =
      parentValue: "This is the parent value!"
      childValue: "This is the child value!"

    parentChildTemplate = new Template 'parent-child'

    expected = '<div data-id="parentChildTest">
                  <h2>Parent Template</h2>
                  <div data-id="parentChildTest.parentValue">This is the parent value!</div>
                  <div>
                    <h2>Child Template</h2>
                    <div data-id="parentChildTest.childValue">This is the child value!</div>
                    </div>
                  </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        parentChildTemplate.apply 'parentChildTest', model, (id, op, x) ->
          markup = scrub(x)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )

