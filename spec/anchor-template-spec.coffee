
QUnit.specify "anchor template", ->
  describe "anchor template", ->

    model = {
      top: {
        __value__: "top",
        link: "http://thisislame.com"
      }
      list: [
        { __value__: "one", link: "#one" },
        { __value__: "two", link: "#two" },
        { __value__: "three", link: "#three" }
      ]
    }

    anchorTemplate = new Template 'anchor'

    expected =                '<a data-id="anchor.top" href="http://thisislame.com" alt="top">top</a>
                              <div data-id="anchor.list" class="row">
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

      anchorTemplate.render 'anchor', model, (id, x, op) ->
        markup = scrub(x)

      setTimeout (() ->
        assert(markup).equals scrub(expected)
        resume()
        ), 200
      )
###
<adata-id="anchor.top"href="http://thisislame.com"alt="top">top</a><divdata-id="anchor.list"class="row"><div><ahref="#one"alt="one">one</a></div><div><ahref="#two"alt="two">two</a></div><div><ahref="#three"alt="three">three</a></div></div>
<adata-id="anchor.top"href="http://thisislame.com"alt="top">top</a><divdata-id="anchor"class="row"><div><ahref="#one"alt="one">one</a></div><div><ahref="#two"alt="two">two</a></div><div><ahref="#three"alt="three">three</a></div></div>"