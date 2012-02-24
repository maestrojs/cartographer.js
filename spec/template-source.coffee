templates =
  flat:             '<div map-id="flat">
                      <h3>First Name</h3>
                      <span map-id="firstName"></span>
                      <h3>Last Name</h3>
                      <span map-id="lastName"></span>
                    </div>',
  iterative:        '<div map-id="iterative">
                       <h3>Grocery List</h3>
                       <div map-id="listItems">
                          <div>
                            <span map-id="name"></span><span> - </span><span map-id="qty"></span>
                          </div>
                       </div>
                    </div>',
  nested:          '<div map-id="nested">
                      <h3>Parent</h3>
                      <span map-id="firstName"></span><span> - </span>
                      <span map-id="lastName"></span>
                      <div map-id="child">
                        <h3>Child</h3>
                        <span map-id="firstName"></span><span> - </span>
                        <span map-id="lastName"></span>
                      </div>
                    </div>'
  parent:           '<div map-id="parent">
                      <h2>Parent Template</h2>
                      <div map-id="parentValue"></div>
                      <div map-id="childValue"></div>
                    </div>',
  child:           '<div>
                      <h2>Child Template</h2>
                      <div map-id="childValue"></div>
                    </div>',


resolver.prependSource(
  resolve: (name, success, fail) ->
    if templates[name]
      success templates[name]
    else
      fail()
)