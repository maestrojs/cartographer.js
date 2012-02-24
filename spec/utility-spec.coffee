QUnit.specify "utility functions", ->
  describe "naming", ->

    it "should not include template in namespace", () ->
      fqn = createFqn '', 'iterative', 'iterative', true
      assert(fqn).equals('')

    it "should not include template in namespace", () ->
      fqn = createFqn 'iterative', 'id', 'iterative', true
      assert(fqn).equals('id')