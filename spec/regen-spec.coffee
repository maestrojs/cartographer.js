
QUnit.specify "template change", ->
  describe "template change", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat', 'flat', model

    expected =                '<div>
                                <h3>First Name</h3>
                                <span map-id="flat.firstName">Alex</span>
                                <h3>Last Name</h3>
                                <span map-id="flat.lastName">Trebec</span>
                              </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        newElement = ''

        flatTemplate.apply model, (id, op, x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          flatTemplate.update('flat.lastName', { lastName: 'Trebec'},
            (id, op, x) -> newElement = x.outerHTML
          )
          assert(newElement).equals '<span map-id="flat.lastName">Trebec</span>'
          resume()
    )