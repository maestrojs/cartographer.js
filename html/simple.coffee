###
<script type="text/javascript" src="../ext/jquery-1.6.4.min.js"></script>
    <script type="text/javascript" src="../ext/DOMBuilder.min.js"></script>
    <script type="text/javascript" src="../ext/underscore-min.js"></script>
    <script type="text/javascript" src="../ext/postal.min.js"></script>
    <script type="text/javascript" src="../ext/infuser-0.2.0.js"></script>
    <script type="text/javascript" src="../ext/trafficCop.js"></script>
    <script type="text/javascript" src="../lib/cartographer.js"></script>
    <script type="text/javascript" src="../html/simple.coffee"></script>
###

require.config(
  paths:
    'require':          '../ext/requirejs-1.0.5'
    'require-text':     '../ext/requirejs-text-1.0.2'
    'jquery':           '../ext/jquery-1.7.1'
    'DOMBuilder':       '../ext/DOMBuilder.min'
    'underscore':       '../ext/underscore-1.3.1'
    'trafficcop':       '../ext/trafficCop-0.3.0'
    'infuser':          '../ext/infuser-0.2.0'
    'postal':           '../ext/postal-0.4.0'
    'postal.diagnostics': '../ext/postal.diagnostics'
    'arbiter':          '../ext/arbiter-0.1.0'
    'cartographer':     '../lib/cartographer'
)

require(
  [
    'require'
    'require-text'
    'jquery'
    'underscore'
    'postal'
    'postal.diagnostics'
    'infuser'
    'cartographer'
  ],
  (require, requireText, $, _, postal, diagnostics, infuser, cartographer) ->

    dom = undefined
    Ingredient = ( item, qty ) ->
    item: item

    qty: qty


    Step = ( step, detail ) ->
      step: step
      detail: detail

    BuildIngredientList = ( list, recipe ) ->
      recipe.ingredients.value.push( new Ingredient( x[0],x[1] ) ) for x in list

    BuildSteps = ( list, recipe ) ->
      recipe.steps.value.push( new Step( x[0], x[1] ) ) for x in list

    Recipe = ( Title, Description, Ingredients, Steps ) ->
      recipe =
        title: Title
        __template__: "recipe"
        description: Description
        ingredients:
          __template__: "ingredient"
          value: []
        steps:
          __template__: "steps"
          value: []

      BuildIngredientList( Ingredients, recipe )
      BuildSteps( Steps, recipe )

      recipe

    recipe1 = new Recipe(
      "Monkey Pot Pie",
      "Savory chunks of monkey under a crispy crust",
      [
        ["pastry flour","1 cup"],
        ["shortening","1/2 cup"],
        ["milk","1/2 cup"],
        ["egg","1 large"],
        ["adult monkey","1 lb"],
        ["carrots","2 cups diced"],
        ["corn","1 cup"],
        ["celery","1 cup diced"],
        ["banana","1 sliced"],
      ],
      [
        ["preheat","the oven to 425."],
        ["combine","everything in big friggen bowl."],
        ["trick","the monkey into the bowl with the banana."],
        ["bake","until the monkey stops screaming."]
      ]
    )

    recipe2 = new Recipe(
      "Beer cheese soup",
      "An excuse to eat beer",
      [
        ["Pabst Blue Ribbon","6 pack"],
        ["Mr. Block of Cheese",""],
      ],
      [
        ["eat","the entire Mr. Block of Cheese."],
        ["chug","all the beer."],
      ]
    )

    recipes =
      list: [ recipe1, recipe2 ]

    cart = postal.channel("cartographer")

    dataBus = postal.channel("recipe_data")

    $( ->
        infuser.config.templateUrl = "/tmpl"
        infuser.config.templateSuffix = ".html"

        ###repl = postal.channel("replicant")
   repl.publish
       create: true,
       target: recipes,
       namespace: "recipes"###

        cart.publish
          map: true
          name: "recipes"
          namespace: "recipes"

        cart.publish
          map: true
          name: "recipe"
          namespace: "recipe"

        cart.publish
          map: true
          name: "alt-recipe"
          namespace: "recipe"

        cart.publish
          apply: true
          template: "recipes"
          proxy: recipes

        cart.publish
          apply: true
          template: "recipe"
          proxy: recipe1



    )
  )
