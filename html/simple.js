require.config({
    paths: {
      'require': '../ext/requirejs-1.0.5',
      'jquery': '../ext/jquery-1.7.1',
      'DOMBuilder': '../ext/DOMBuilder.min',
      'underscore': '../ext/underscore-1.3.1',
      'trafficcop': '../ext/trafficCop-0.3.0',
      'infuser': '../ext/infuser-0.2.0',
      'postal': '../ext/postal-0.4.0',
      'postal.diagnostics': '../ext/postal.diagnostics',
      'cartographer': '../lib/cartographer.amd',
      'postal.adapter': '../lib/postal.adapter.amd.min'
    }
});

require(
    [
        'require',
        'jquery',
        'underscore',
        'postal',
        //'postal.diagnostics',
        'infuser',
        'cartographer',
        'postal.adapter'],
    function(require, $, _, postal, infuser, cartographer) {
    var BuildIngredientList, BuildSteps, Ingredient, Recipe, Step, cart, dataBus, dom, recipe1, recipe2, recipes;
    dom = void 0;
    Ingredient = function(item, qty) {
        return {
          //__template__: 'ingredient',
          item: item,
          qty: qty
        };
    };
    Step = function(step, detail) {
      return {
        step: step,
        detail: detail
      };
    };
    BuildIngredientList = function(list, recipe) {
      var x, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        x = list[_i];
        _results.push(recipe.ingredients.value.push(new Ingredient(x[0], x[1])));
      }
      return _results;
    };
    BuildSteps = function(list, recipe) {
      var x, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        x = list[_i];
        _results.push(recipe.steps.value.push(new Step(x[0], x[1])));
      }
      return _results;
    };
    Recipe = function(Title, Description, Ingredients, Steps) {
      var recipe;
      recipe = {
        title: Title,
        __template__: "recipe",
        image: "http://placehold.it/360x268",
        description: Description,
        ingredients: {
          __template__: "ingredient",
          value: []
        },
        steps: {
          __template__: "steps",
          value: []
        }
      };
      BuildIngredientList(Ingredients, recipe);
      BuildSteps(Steps, recipe);
      return recipe;
    };
    recipe1 = new Recipe("Monkey Pot Pie", "Savory chunks of monkey under a crispy crust", [["pastry flour", "1 cup"], ["shortening", "1/2 cup"], ["milk", "1/2 cup"], ["egg", "1 large"], ["adult monkey", "1 lb"], ["carrots", "2 cups diced"], ["corn", "1 cup"], ["celery", "1 cup diced"], ["banana", "1 sliced"]], [["preheat", "the oven to 425."], ["combine", "everything in big friggen bowl."], ["trick", "the monkey into the bowl with the banana."], ["bake", "until the monkey stops screaming."]]);
    recipe2 = new Recipe("Beer cheese soup", "An excuse to eat beer", [["Pabst Blue Ribbon", "6 pack"], ["Mr. Block of Cheese", ""]], [["eat", "the entire Mr. Block of Cheese."], ["chug", "all the beer."]]);
    recipes = {
      list: [recipe1, recipe2]
    };
    cart = postal.channel("cartographer");
    dataBus = postal.channel("recipe_data");

    $(function() {
        infuser.defaults.templateUrl = '/tmpl';
        infuser.defaults.templateSuffix = '.html';

        postal.subscribe("cartographer", "render.*", function(message)
        {
            if( message.operation == "render" )
                $( '[data-id="'+ message.template +'"]' ).fadeOut( 200, function() {
                    $(this).html(message.markup).fadeIn(300)
                });
            else

                $('[data-id="'+message.parent+'"]').append( message.markup );
        });

        postal.publish("cartographer", "api", {
            name: "recipes",
            operation: "map"
        });

        postal.publish("cartographer", "api", {
            name: "recipe",
            operation: "map"
        });

        postal.publish("cartographer", "api", {
           name: "recipes",
           template: "recipe-list",
           model: recipes,
           operation: "apply"
        });

        postal.publish("cartographer", "api", {
            name: "recipe",
            template: "recipe",
            model: recipe1,
            operation: "apply"
        });

        postal.subscribe("cartographer.recipe", "recipe.newIngredient.btn.click", function(x) {
           console.log("SHA-CLACKITY!");
           postal.publish("cartographer", "api", {
              operation: 'add',
              template: 'recipe',
              id: 'recipe.ingredients',
              model: {
                  item: 'taters',
                  qty: 'BUSHEL BASKEEEEEET'
              }
           });
        });
    });
});
