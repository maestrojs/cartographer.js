
QUnit.specify "interpolation template", ->
  describe "interpolation template", ->

    model =
      type: "geek"
      name: "Alex"


    interpolationTemplate = new Template 'interpol', 'interpol'

    expected = '<div>
                  <h3>O</h3>nce upon a time, there was a <span map-id="type">geek</span> named <span map-id="name">Alex</span>.
                </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        interpolationTemplate.apply model, (x) ->
          markup = scrub(x.outerHTML)
          console.log markup

        setTimeout () ->
          assert(markup).equals scrub(expected)
          resume()
    )