templates =
  flat:                   '<div>
                            <h3>First Name</h3>
                            <span map-id="firstName"></span>
                            <h3>Last Name</h3>
                            <span map-id="lastName"></span>
                          </div>',
  iterative:              '<div>
                             <h3>Grocery List</h3>
                             <div map-id="listItems">
                                <div>
                                  <span map-id="name"></span><span> - </span><span map-id="qty"></span>
                                </div>
                             </div>
                          </div>',
  nested:                 '<div>
                             <h3>Parent</h3>
                             <span map-id="firstName"></span><span> - </span>
                             <span map-id="lastName"></span>
                             <div map-id="child">
                               <h3>Child</h3>
                               <span map-id="firstName"></span><span> - </span>
                               <span map-id="lastName"></span>
                             </div>
                           </div>',
  'parent-child':         '<div>
                             <h2>Parent Template</h2>
                             <div map-id="parentValue"></div>
                             <div map-id="childValue"></div>
                           </div>',
  child:                  '<div>
                             <h2>Child Template</h2>
                             <div map-id="childValue"></div>
                           </div>',
  'iterative-external':   '<div>
                             <h3>Grocery List</h3>
                             <div map-id="listItems">
                                <span></span>
                                Nothing to see here :(
                             </div>
                          </div>',
  'iterative-item':      '<div>
                             <span map-id="name"></span><span> - </span><span map-id="qty"></span>
                          </div>',
  'interpol':$           '<div><h3>O</h3>nce upon a time, there was a <span map-id="type"></span> named <span map-id="name"></span>.</div>'


window.scrub = (x) ->
  x.replace(/[ ]/g, "")


resolver.prependSource(
  (name, success, fail) ->
    if templates[name]
      success templates[name]
    else
      fail()
)