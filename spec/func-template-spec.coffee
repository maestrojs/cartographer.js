
QUnit.specify "flat template", ->
  describe "flat template", ->

    model =
      firstName: "Alex"
      lastName: "Robson"
      fullName: () -> "#{@.firstName}  #{@.lastName}"


    flatTemplate = new Template 'func'

    expected =                '<div data-id="func">
                                <h2 data-id="func.fullName">Alex Robson</h2>
                                <h3>First Name</h3>
                                <span data-id="func.firstName">Alex</span>
                                <h3>Last Name</h3>
                                <span data-id="func.lastName">Robson</span>
                              </div>'

    it "should produce the correct markup", async(() ->

      markup = ''

      flatTemplate.apply 'func', model, (id, op, x) ->
        markup = scrub(x.outerHTML)

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )