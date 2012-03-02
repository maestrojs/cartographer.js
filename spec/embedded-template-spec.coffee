QUnit.specify "embedded template", ->
  describe "embedded template", ->

    model =
      message: "Hi"


    expected =                '<div id="page-template" data-id="embedded-template">
                                <span data-id="embedded-template.message">Hi</span>
                              </div>'

    it "should produce the correct markup", async(() ->

      markup = ''
      $( () ->
        flatTemplate = new Template 'page'
        flatTemplate.apply 'embedded-template', model, (id, x, op) ->
          markup = scrub(x)
      )

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
      ), 10
    )