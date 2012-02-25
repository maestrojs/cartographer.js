
QUnit.specify "template change", ->
  describe "template change", ->

    model =
      firstName: "Alex"
      lastName: "Robson"


    flatTemplate = new Template 'flat', 'flat', model

    expected =                '<div map-id="flat">
                                    <h3>First Name</h3>
                                    <span map-id="firstName">Alex</span>
                                    <h3>Last Name</h3>
                                    <span map-id="lastName">Trebec</span>
                                  </div>'

    it "should produce the correct markup", async(() ->

        markup = ''
        newElement = ''

        flatTemplate.apply model, (x) ->
          markup = scrub(x.outerHTML)

        setTimeout () ->
          flatTemplate.update('flat.lastName', { lastName: 'Trebec'}, (x) -> newElement = x.outerHTML)
          assert(newElement).equals '<span map-id="lastName">Trebec</span>'
          resume()
    )