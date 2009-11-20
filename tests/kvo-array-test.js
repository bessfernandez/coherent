/*jsl:import test-helpers.js*/

Test.create('kvo-array', {

    setup: function()
    {
    },
    
    testSubArray: function(t)
    {
        var f= coherent.KVO.adaptTree({
            samples: [
                {
                    values: ['string1', 'string2', 'string3']
                },
                {
                    values: ['jkl', 'mno', 'pqr']
                }
            ]
        });
    
        var observer1= new TestObserver();
        var observer2= new TestObserver();
        
        f.addObserverForKeyPath(observer1, 'observeChange', 'samples');
        
        var obj= {
                    values: ['abc', 'def', 'ghi']
                };
        
        f.samples.addObject(coherent.KVO.adaptTree(obj));

        t.assertEqual(1, observer1.count);

        f.addObserverForKeyPath(observer2, 'observeChange', 'samples.values');
        
        f.samples[1].values.addObject('newstring');
        t.assertEqual(1, observer2.count);
    }

});
