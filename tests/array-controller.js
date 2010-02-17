/*jsl:import test-helpers.js*/

Test.create('array-controller', {

    setup: function()
    {
        coherent.dataModel= new coherent.KVO();
    },

    testSetContent: function(t)
    {
        var controller= new coherent.ArrayController();
        var content= [];
        
        controller.setContent(content);
        t.assertEqual(content, controller.content());
    },
    
    testObserveSetContent: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
        var content= [];
        
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'content');
    
        controller.setContent(content);
        
        t.assertTrue(observer.called);
    },
    
    testObserveAddObject: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
    
        controller.setContent([]);
    
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'content');
    
        controller.addObject(new coherent.KVO());
        
        t.assertTrue(observer.called);
    
        observer.reset();
        
        controller.add();
        t.assertTrue(observer.called);
    },
    
    testObserveBoundContentAddObject: function(t)
    {
        var observer= new TestObserver();
        var source= new coherent.KVO();
        
        source.setValueForKey([], 'array');
        coherent.registerModelWithName(source, 'source');
        
        var controller= new coherent.ArrayController({
                                    contentBinding: 'source.array'
                                });
    
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'content');
    
        source.array.addObject(new coherent.KVO());
        t.assertTrue(observer.called);
        t.assertEqual(observer.count, 1);
        t.assertEqual(observer.change.changeType, coherent.ChangeType.insertion);
    },
    
    testObserveBoundContentChange: function(t)
    {
        var observer= new TestObserver();
        var source= new coherent.KVO();
        
        source.setValueForKey([], 'array');
        coherent.registerModelWithName(source, 'source');
        
        var controller= new coherent.ArrayController({
                                    contentBinding: 'source.array'
                                });
    
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'content');
    
        source.setValueForKey([], 'array');
        
        t.assertTrue(observer.called, '<rdar://problem/6279486>');
        t.assertEqual(observer.count, 1);
    },
    
    testObserveSelectedObjectsAddObject: function(t)
    {
        var controller= new coherent.ArrayController({
                                selectsInsertedObjects: true
                            });
        var observer= new TestObserver();
    
        controller.setContent([]);
    
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selectedObjects');
    
        controller.addObject(new coherent.KVO());
        
        t.assertTrue(observer.called);
        
        observer.reset();
        
        controller.add();
        t.assertTrue(observer.called);
    },
    
    testObserveArrangedObjectsAddObject: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
    
        controller.setContent([]);
    
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'arrangedObjects');
    
        controller.addObject(new coherent.KVO());
        
        t.assertTrue(observer.called);
    },

    testSetValueForKeySelectionNotificationCount: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
        var objects= [
                        {
                            name: 'foo'
                        },
                        {
                            name: 'bar'
                        },
                        {
                            name: 'goober'
                        },
                        {
                            name: 'baz'
                        }
                    ];
                    
        controller.setContent(coherent.KVO.adaptTree(objects));
        //  Don't select more than one item, or you'll run across issue #6.
        controller.setSelectionIndexes([1]);
        
        t.assertEqual(1, controller.selectedObjects().length);
        
        controller.addObserverForKeyPath(observer, 'observeChange', 'selection.name');
        
        var selection= controller.selection();
        selection.setValueForKey('zebra', 'name');
        
        t.assertEqual(['zebra'], controller.valueForKeyPath('selectedObjects.name'));
        
        t.assertEqual(1, observer.count);
    }
    
});
