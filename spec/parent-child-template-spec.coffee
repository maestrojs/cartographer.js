
QUnit.specify "parent-child template", ->
  describe "parent-child template", ->

    model =
      parentValue: "This is the parent value!"
      childValue:
        __template__: "child"
        value: "This is the child value!"

    parentChildTemplate = new Template 'parent-child', 'parent-child', model

    expected = '<div map-id="parent"><h2>Parent Template</h2><div map-id="parentValue">This is the parent value!</div><div><h2>Child Template</h2><div map-id="childValue">This is the child value!</div></div></div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        parentChildTemplate.apply model, (x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )