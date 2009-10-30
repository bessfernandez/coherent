/*jsl:import test-helpers.js*/

Test.create('kvo-cycle', {

    testCreateCycle: function(t)
    {
        try
        {
            var kvo1= new coherent.KVO();
            var kvo2= new coherent.KVO();
        
            kvo1.setValueForKey(kvo2, 'kvo2');
            kvo2.setValueForKey(kvo1, 'kvo1');
        }
        catch (e)
        {
            t.fail('caught exception: ' + e);
        }
    },
    
    testModifyCycle: function(t)
    {
        try
        {
            var kvo1= new coherent.KVO();
            var kvo2= new coherent.KVO();
        
            kvo1.setValueForKey(kvo2, 'kvo2');
            kvo2.setValueForKey(kvo1, 'kvo1');
            kvo2.setValueForKey("Foobar", "name");
        }
        catch (e)
        {
            t.fail('caught exception: ' + e);
        }
    },

    testCreateArrayCycle: function(t)
    {
        try
        {
            var root= new coherent.KVO();
            var children= [new coherent.KVO(), new coherent.KVO()];
            
            root.setValueForKey(children, 'children');
            children[0].setValueForKey(root, 'parent');
        }
        catch (e)
        {
            t.fail('caught exception: ' + e);
        }
        
    },
    
    testModifyArrayCycle: function(t)
    {
        try
        {
            var root= new coherent.KVO();
            var children= [new coherent.KVO(), new coherent.KVO()];
            
            root.setValueForKey(children, 'children');
            children[0].setValueForKey(root, 'parent');
            
            root.setValueForKey("foo", 'name');
        }
        catch (e)
        {
            t.fail('caught exception: ' + e);
        }
        
    }

});
