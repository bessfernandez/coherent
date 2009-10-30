/*jsl:import test-helpers.js*/

var PersonWithMutator;
var PersonWithProperties;
var Person;

Test.create('kvo-subkey', {

    setup: function()
    {
        //  create the PersonWithMutator class
        Person= Class.create(coherent.KVO, {

            keyDependencies: {
                fullName: ['firstName', 'lastName']
            },

            constructor: function(firstName, lastName)
            {
                this.__firstName= firstName;
                this.__lastName= lastName;
            },
            
            lastName: function()
            {
                return this.__lastName;
            },
            
            setLastName: function(newLastName)
            {
                this.__lastName= newLastName;
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
                if (!this.__firstName)
                    return this.__lastName;
                if (!this.__lastName)
                    return this.__firstName;
            
                return [this.__firstName, this.__lastName].join(' ');
            }
            
        });

    },
    
    testSubKeyNotificationCount: function(t)
    {
        var momObserver= new TestObserver();
        var dadObserver= new TestObserver();
        
        var mom= new Person('Mom', 'Person');
        var dad= new Person('Dad', 'Person');
        var baby= new Person('Baby', 'Person');
        var daughter= new Person('Daughter', 'Person');
        
        mom.setValueForKey(daughter, 'daughter');
        dad.setValueForKey(daughter, 'daughter');
        
        mom.addObserverForKeyPath(momObserver, momObserver.observeChange,
                                  'daughter.baby.firstName');
        dad.addObserverForKeyPath(dadObserver, dadObserver.observeChange,
                                  'daughter.baby.firstName');
        
        daughter.setValueForKey(baby, 'baby');
        
        t.assertEqual(momObserver.count, 1);
        t.assertEqual(dadObserver.count, 1);                          
    },
    
    testSubKeyNotificationCount2: function(t)
    {
        var bossObserver= new TestObserver();
        var bffeObserver= new TestObserver();
        
        var bob= new Person('Bob', 'Jones');
        var sam= new Person('Sam', 'Smith');
        var baby= new Person('Baby', 'Person');

        bob.setValueForKey(sam, 'boss');
        bob.setValueForKey(sam, 'bestFriend');
        
        bob.addObserverForKeyPath(bossObserver, bossObserver.observeChange,
                                  'boss.baby.firstName');
        bob.addObserverForKeyPath(bffeObserver, bffeObserver.observeChange,
                                  'bestFriend.baby.firstName');

        sam.setValueForKey(baby, 'baby');
        
        t.assertEqual(bossObserver.count, 1);
        t.assertEqual(bffeObserver.count, 1);                          
    }
    
    
    
});
