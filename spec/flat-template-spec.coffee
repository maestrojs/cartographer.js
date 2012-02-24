
QUnit.specify "flat template", ->
  describe "flat template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat', 'flat', model

    expected = '<div map-id="flat"><h3>First Name</h3><span map-id="firstName">Alex</span><h3>Last Name</h3><span map-id="lastName">Robson</span></div>'

    it "should be there", async(() ->

      markup = ''
      flatTemplate.apply model, (x) ->
        markup = x.outerHTML

      setTimeout () ->
        assert(markup).equals expected
        resume()
      )


