templates =
  flat:             '<div map-id="flat">
                      <h3>First Name</h3>
                      <span map-id="firstName"></span>
                      <h3>Last Name</h3>
                      <span map-id="lastName"></span>
                    </div>',
  iterative:        '<div map-id="flat">
                       <h3>Grocery List</h3>
                       <div map-id="items">
                         <span map-id="name"></span> - <span map-id="qty"></span>
                       </div>
                    </div>'

resolver.prependSource(
  resolve: (name, success, fail) ->
    if templates[name]
      success templates[name]
    else
      fail()
)