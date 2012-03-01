
QUnit.specify "template change", ->
  describe "template change", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat'

    expected =                '<div>
                                <h3>First Name</h3>
                                <span data-id="flat.firstName">Alex</span>
                                <h3>Last Name</h3>
                                <span data-id="flat.lastName">Trebec</span>
                              </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        newElement = ''

        flatTemplate.apply 'flat', model, (id, op, x) ->
          markup = scrub(x)

        setTimeout () ->
          flatTemplate.update('flat.lastName', { lastName: 'Trebec'},
            (id, op, x) -> newElement = scrub(x)
          )
          assert(newElement).equals scrub('<span data-id="flat.lastName">Trebec</span>')
          resume()
    )