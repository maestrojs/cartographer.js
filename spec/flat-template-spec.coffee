
QUnit.specify "flat template", ->
  describe "flat template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat'

    expected =                '<div data-id="flat">
                                <h3>First Name</h3>
                                <span data-id="flat.firstName">Alex</span>
                                <h3>Last Name</h3>
                                <span data-id="flat.lastName">Robson</span>
                              </div>'

    it "should produce the correct markup", async(() ->

      markup = ''

      flatTemplate.apply 'flat', model, (id, x, op) ->
        markup = scrub(x)

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )
