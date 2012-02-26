QUnit.specify "utility functions", ->
  describe "naming", ->

    it "should include template in namespace", () ->
      fqn = createFqn '', 'iterative', 'iterative', true
      assert(fqn).equals('iterative')

    it "should include template in namespace", () ->
      fqn = createFqn 'iterative', 'id', 'iterative', true
      assert(fqn).equals('iterative.id')