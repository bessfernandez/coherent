/*jsl:import test-helpers.js*/

Test.create('controller-selection', {

    setup: function()
    {
    },

    testSelectionDirect: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        
        controller.setContent(content);

        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selection.name');
        
        controller.selection().setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },

    testSelectedObjectsChangeToContent: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();

        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selectedObjects');
        
        controller.setContent(content);
        
        t.assertTrue(observer.called);
        t.assertEqual(observer.count, 1);
    },

    testSelectionChangeToContent: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        
        controller.setContent(content);

        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selection.name');
        
        content.setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },

    testSelectionChangeToContent1: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selection.name');

        controller.setContent(content);
        
        content.setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },


    /** Test case for Ticket #3.
     */
    testSelectedObjectsAndChange1: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        var newContent= new coherent.KVO();
        
        controller.setContent(content);
        controller.setContent(newContent);
        
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selectedObjects.name');
        
        content.setValueForKey('Bob', 'name');
        
        t.assertFalse(observer.called);
    },

    /** Test case for Ticket #3.
     */
    testSelectedObjectsAndChange2: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        var newContent= new coherent.KVO();
        
        controller.setContent(content);

        controller.setContent(newContent);
        
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selectedObjects.name');
        
        newContent.setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },

    /** Test case for Ticket #3.
     */
    testSelectedObjectsAndChange3: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        var newContent= new coherent.KVO();
        var newestContent= new coherent.KVO();
        
        controller.setContent(content);

        controller.setContent(newContent);
        controller.setContent(newestContent);

        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selectedObjects.name');
        
        newContent.setValueForKey('Bob', 'name');
        
        t.assertFalse(observer.called);
    },

    testSelectionViaGlobal: function(t)
    {
        var controller= new coherent.ObjectController();
        var observer= new TestObserver();
        var content= new coherent.KVO();
        
        controller.registerWithName('sample');
        controller.setContent(content);

        coherent.dataModel.addObserverForKeyPath(observer, observer.observeChange,
                                                 'sample.selection.name');
        
        controller.selection().setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },

    testArraySelectionDirect: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
        var content= [new coherent.KVO(), new coherent.KVO()];
        
        controller.setContent(content);
        controller.setSelectedObjects([content[0]]);
        
        controller.addObserverForKeyPath(observer, observer.observeChange,
                                         'selection.name');
        
        controller.selection().setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },

    testArraySelectionViaGlobal: function(t)
    {
        var controller= new coherent.ArrayController();
        var observer= new TestObserver();
        var content= [new coherent.KVO(), new coherent.KVO()];
        
        controller.registerWithName('sample');
        controller.setContent(content);
        controller.setSelectedObjects([content[0]]);

        coherent.dataModel.addObserverForKeyPath(observer, observer.observeChange,
                                                 'sample.selection.name');
        
        controller.selection().setValueForKey('Bob', 'name');
        
        t.assertTrue(observer.called);
    },
    
    testDanglingReferences1: function(t)
    {
        var Person= Class.create(coherent.KVO, {

            constructor: function(name)
            {
                this.mother= null;
                this.father= null;
                this.name=name||'No Name';
            },
    
            keyDependencies: {
                parents: ['mother', 'father']
            },

            getParents: function()
            {
                var parents= [];
        
                if (this.mother)
                    parents.push(this.mother);
                if (this.father)
                    parents.push(this.father);
                return parents;
            }

        });

        var observer= new TestObserver();
    
        var bob= new Person('bob');
        var dad= new Person('bill');
        var mom= new Person('stephanie');

        bob.setValueForKey(dad, 'father');
        bob.setValueForKey(mom, 'mother');
    
        bob.addObserverForKeyPath(observer, observer.observeChange,
                                  'parents.name');
                              
        dad.setValueForKey('william', 'name');
        t.assertTrue(observer.called);
    },

    testDanglingReferences2: function(t)
    {
        var Person= Class.create(coherent.KVO, {

            constructor: function(name)
            {
                this.mother= null;
                this.father= null;
                this.name=name||'No Name';
            },
    
            keyDependencies: {
                parents: ['mother', 'father']
            },

            getParents: function()
            {
                var parents= [];
        
                if (this.mother)
                    parents.push(this.mother);
                if (this.father)
                    parents.push(this.father);
                return parents;
            }

        });

        var observer= new TestObserver();

        var bob= new Person('bob');
        var dad= new Person('bill');
        var mom= new Person('stephanie');
        var stepdad= new Person('gregory');

        bob.initialiseKeyValueObserving();

        bob.setValueForKey(dad, 'father');
        bob.setValueForKey(mom, 'mother');

        bob.setValueForKey(stepdad, 'father');

        bob.addObserverForKeyPath(observer, observer.observeChange,
                                  'parents.name');
                      
        stepdad.setValueForKey('greg', 'name');
        t.assertTrue(observer.called);
    },

    testDanglingReferences3: function(t)
    {
        var Person= Class.create(coherent.KVO, {

            constructor: function(name)
            {
                this.mother= null;
                this.father= null;
                this.name=name||'No Name';
            },
    
            keyDependencies: {
                parents: ['mother', 'father']
            },

            getParents: function()
            {
                var parents= [];
        
                if (this.mother)
                    parents.push(this.mother);
                if (this.father)
                    parents.push(this.father);
                return parents;
            }

        });

        var observer= new TestObserver();

        var bob= new Person('bob');
        var dad= new Person('bill');
        var mom= new Person('stephanie');
        var stepdad= new Person('gregory');

        bob.initialiseKeyValueObserving();

        bob.setValueForKey(dad, 'father');
        bob.setValueForKey(mom, 'mother');
        bob.setValueForKey(stepdad, 'father');

        bob.addObserverForKeyPath(observer, observer.observeChange,
                                  'parents.name');
                      
        dad.setValueForKey('william', 'name');
        t.assertFalse(observer.called);
    }
    
    
});
