/*jsl:import test-helpers.js*/

Test.create('kvo-adapt-tree', {

    setup: function()
    {
    },

    testAdaptAndObserve: function(t)
    {
    
        var tree= {
            branch: {
                leaf: "It isn't easy being green."
            }
        };
        
        coherent.KVO.adaptTree(tree);
        var observer= new TestObserver();
        var value;
        var ob
        
        tree.addObserverForKeyPath(observer, observer.observeChange, "branch.leaf");
        tree.setValueForKeyPath('You are what you eat.', 'branch.leaf');
        t.assertTrue(observer.called);
    }
    
});
