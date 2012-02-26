
QUnit.specify "flat template", ->
  describe "flat template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat', 'flat', model

    expected =                '<div map-id="flat">
                                <h3>First Name</h3>
                                <span map-id="flat.firstName">Alex</span>
                                <h3>Last Name</h3>
                                <span map-id="flat.lastName">Robson</span>
                              </div>'

    it "should produce the correct markup", async(() ->

      markup = ''

      flatTemplate.apply model, (id, op, x) ->
        markup = scrub(x.outerHTML)

      setTimeout () ->
        assert(markup).equals scrub(expected)
        resume()
      )