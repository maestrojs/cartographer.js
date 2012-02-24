
QUnit.specify "parent-child template", ->
  describe "parent-child template", ->

    model =
      parentValue: "This is the parent value!"
      childValue:
        __template__: "child"
        value: "This is the child value!"


    parentChildTemplate = new Template 'parent-child', 'parent-child', model

    expected = '<div map-id="parent-child"><h3>Parent Template</h3><div map-id="parentValue">This is the parent value!</div><div><h2>Child Template</h2><div map-id="childValue">This is the child value!</div></div></div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        parentChildTemplate.apply model, (x) ->
          markup = x.outerHTML

        setTimeout () ->
          assert(markup).equals expected
          resume()
    )