
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

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )
###

    <divmap-id="flat"><h3map-id="flat">FirstName</h3><spanmap-id="flat.firstName">Alex</span><h3map-id="flat">LastName</h3><spanmap-id="flat.lastName">Robson</span></div>
    <divmap-id="flat"><h3>FirstName</h3><spanmap-id="flat.firstName">Alex</span><h3>LastName</h3><spanmap-id="flat.lastName">Robson</span></div>"
  ###
