/*jsl:import test-helpers.js*/

var PersonWithMutator;
var PersonWithProperties;

Test.create('kvo-dependent', {

    setup: function()
    {
        //  Create the PersonWithProperties class
        PersonWithProperties= Class.create(coherent.KVO, {

            keyDependencies: {
                fullName: ['firstName', 'lastName']
            },

            constructor: function(firstName, lastName)
            {
                this.firstName= firstName;
                this.lastName= lastName;
            },
            
            fullName: function()
            {
                var firstName= this.valueForKey('firstName');
                var lastName= this.valueForKey('lastName');
                if (!firstName)
                    return lastName;
                if (!lastName)
                    return firstName;
            
                return [firstName, lastName].join(' ');
            }
            
        });
        
        
        //  create the PersonWithMutator class
        PersonWithMutator= Class.create(coherent.KVO, {

            keyDependencies: {
                fullName: ['firstName', 'lastName']
            },

            constructor: function(firstName, lastName)
            {
                this.__firstName= firstName;
                this.lastName= lastName;
            },
            
            firstName: function()
            {
                return this.__firstName;
            },
            
            setFirstName: function(newFirstName)
            {
                this.__firstName= newFirstName;
            },
            
            fullName: function()
            {
                var firstName= this.valueForKey('firstName');
                var lastName= this.valueForKey('lastName');
                if (!firstName)
                    return lastName;
                if (!lastName)
                    return firstName;
            
                return [firstName, lastName].join(' ');
            }
            
        });

    },


    testObjDependentKeysWithSetValueForKey: function(t)
    {
        var dep= new coherent.KVO();
        
        dep.firstName='Bozo';
        dep.lastName='Clown';
        
        dep.fullName= function()
        {
            var firstName= this.valueForKey('firstName');
            var lastName= this.valueForKey('lastName');
            if (!firstName)
                return lastName;
            if (!lastName)
                return firstName;
            
            return [firstName, lastName].join(' ');
        }
        dep.setKeysTriggerChangeNotificationsForDependentKey(['firstName', 'lastName'],
                                                             'fullName');
        
        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }
        
        dep.addObserverForKeyPath(observer, observe, 'fullName');
        dep.setValueForKey('Clarabel', 'firstName');
        t.assertTrue(observeCalled);
    },

    testObjDependentKeysWithMutator: function(t)
    {
        var dep= new coherent.KVO();
        
        dep.firstName= function()
        {
            return this.__firstName;
        }
        dep.setFirstName= function(newFirstName)
        {
            this.__firstName= newFirstName;
        }
        dep.lastName='Clown';
        
        dep.fullName= function()
        {
            var firstName= this.valueForKey('firstName');
            var lastName= this.valueForKey('lastName');
            if (!firstName)
                return lastName;
            if (!lastName)
                return firstName;
            
            return [firstName, lastName].join(' ');
        }
        dep.setKeysTriggerChangeNotificationsForDependentKey(['firstName', 'lastName'],
                                                             'fullName');
        
        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }

        dep.addObserverForKeyPath(observer, observe, 'fullName');
        dep.setFirstName('Clarabel');
        t.assertTrue(observeCalled);
    },

    testObjDependentKeysWithProperty: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var dep= new coherent.KVO();
        
        dep.firstName='Bozo';
        dep.lastName='Clown';
        
        dep.fullName= function()
        {
            if (!this.firstName)
                return this.lastName;
            if (!this.lastName)
                return this.firstName;
            
            return [this.firstName, this.lastName].join(' ');
        }
        dep.setKeysTriggerChangeNotificationsForDependentKey(['firstName', 'lastName'],
                                                             'fullName');
        
        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }
        
        dep.addObserverForKeyPath(observer, observe, 'fullName');
        dep.firstName='Clarabel';
        t.assertTrue(observeCalled);
    },




    testClassDependentKeysWithSetValueForKey: function(t)
    {
        var person= new PersonWithProperties('Bozo', 'Clown');
        
        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }
        
        person.addObserverForKeyPath(observer, observe, 'fullName');
        person.setValueForKey('Clarabel', 'firstName');
        t.assertTrue(observeCalled);
    },

    testClassDependentKeysWithMutator: function(t)
    {
        var person= new PersonWithMutator('Bozo', 'Clown');

        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }
        
        person.addObserverForKeyPath(observer, observe, 'fullName');
        person.setFirstName('Clarabel');
        t.assertTrue(observeCalled);
    },
    
    testClassDependentKeysWithProperty: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var person= new PersonWithProperties('Bozo', 'Clown');
        
        var observeCalled= false;
        var observer= {};
        
        function observe(change, keyPath, context)
        {
            observeCalled= true;
        }
        
        person.addObserverForKeyPath(observer, observe, 'fullName');
        person.firstName= 'Clarabel';
        t.assertTrue(observeCalled);
    }
    
});
