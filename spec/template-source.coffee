templates =
  anchor:                 '<div data-id="list" class="row">
                            <div>
                              <a></a>
                            </div>
                          </div>',
  flat:                   '<div>
                            <h3>First Name</h3>
                            <span data-id="firstName"></span>
                            <h3>Last Name</h3>
                            <span data-id="lastName"></span>
                          </div>',
  rootless:              '<h3>First Name</h3>
                          <span data-id="firstName"></span>
                          <h3>Last Name</h3>
                          <span data-id="lastName"></span>',
  func:                   '<div>
                              <h2 data-id="fullName"></h2>
                              <h3>First Name</h3>
                              <span data-id="firstName"></span>
                              <h3>Last Name</h3>
                              <span data-id="lastName"></span>
                            </div>',
  iterative:              '<div>
                             <h3>Grocery List</h3>
                             <div data-id="listItems">
                                <div>
                                  <span data-id="name"></span><span> - </span><span data-id="qty"></span>
                                </div>
                             </div>
                          </div>',
  nested:                 '<div>
                             <h3>Parent</h3>
                             <span data-id="firstName"></span><span> - </span>
                             <span data-id="lastName"></span>
                             <div data-id="child">
                               <h3>Child</h3>
                               <span data-id="firstName"></span><span> - </span>
                               <span data-id="lastName"></span>
                             </div>
                           </div>',
  'parent-child':         '<div>
                             <h2>Parent Template</h2>
                             <div data-id="parentValue"></div>
                             <div data-template="child"></div>
                           </div>',
  child:                  '<div>
                             <h2>Child Template</h2>
                             <div data-id="childValue"></div>
                           </div>',
  'iterative-external':   '<div>
                             <h3>Grocery List</h3>
                             <div data-id="listItems">
                                <div></div>
                             </div>
                          </div>',
  'iterative-item':      '<span data-id="name"></span><span> - </span><span data-id="qty"></span>',
  'interpol':           '<div><h3>O</h3>nce upon a time, there was a <span data-id="type"></span> named <span data-id="name"></span>.</div>'


window.scrub = (x) ->
  $('<div />').html(x).html().replace(/\s/g, "")

resolver.prependSource(
  (name, success, fail) ->
    if templates[name]
      success templates[name]
    else
      fail()
)

###
