
QUnit.specify "anchor template", ->
  describe "anchor template", ->

    model = {
      list: [
        { __value__: "one", link: "#one" },
        { __value__: "two", link: "#two" },
        { __value__: "three", link: "#three" }
      ]
    }

    anchorTemplate = new Template 'anchor'

    expected =                '<div data-id="anchor" class="row">
                                <div>
                                  <a href="#one" alt="one">one</a>
                                </div>
                                <div>
                                  <a href="#two" alt="two">two</a>
                                </div>
                                <div>
                                  <a href="#three" alt="three">three</a>
                                </div>
                              </div>'

    it "should produce the correct markup", async(() ->

      markup = ''

      anchorTemplate.apply 'anchor', model, (id, x, op) ->
        markup = scrub(x)

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )
