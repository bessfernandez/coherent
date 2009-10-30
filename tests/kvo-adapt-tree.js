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
        var observer= {};
        var value;
        var called= false;
        
        function observeChange(change, keyPath, context)
        {
            value= change.newValue;
            called= true;
        }
        
        tree.addObserverForKeyPath(observer, observeChange, "branch.leaf");
        tree.setValueForKeyPath('You are what you eat.', 'branch.leaf');
        t.assertTrue(called);
    }
    
});
