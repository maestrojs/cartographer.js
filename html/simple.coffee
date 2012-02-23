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
