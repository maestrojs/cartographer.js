
QUnit.specify "rootless template", ->
  describe "rootless template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"

    rootlessTemplate = new Template 'rootless'

    expected =                '<h3>First Name</h3>
                              <span data-id="flat.firstName">Alex</span>
                              <h3>Last Name</h3>
                              <span data-id="flat.lastName">Robson</span>'

    it "should produce the correct markup", async(() ->

      markup = ''

      rootlessTemplate.apply 'flat', model, (id, x, op) ->
        markup = scrub(x)

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )

