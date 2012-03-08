
QUnit.specify "interpolation template", ->
  describe "interpolation template", ->

    model =
      type: "geek"
      name: "Alex"


    interpolationTemplate = new Template 'interpol'

    expected = '<div data-id="interpol">
                  <h3>O</h3>nce upon a time, there was a <span data-id="interpol.type">geek</span> named <span data-id="interpol.name">Alex</span>.
                </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        interpolationTemplate.render 'interpol', model, (id, x, op) ->
          markup = scrub(x)

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )