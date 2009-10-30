/*jsl:import test-helpers.js*/

Test.create('kvo', {

    setup: function()
    {
        this.kvo= new coherent.KVO();
        this.kvo.foo= "bar";
        this.kvo.__name= "zebra";
        coherent.registerModelWithName( this.kvo, "kvo" );
    
        this.kvo.name= function()
        {
            return this.__name;
        }
        this.kvo.setName= function( name )
        {
            this.__name= name;
        }
        this.kvo.immutable= function()
        {
            return this.__immutable;
        }
    },

    testValueForKey: function(t)
    {
        t.assertEqual( "bar", this.kvo.valueForKey('foo') );
        t.assertEqual( "zebra", this.kvo.valueForKey('name') );
        t.assertNull( this.kvo.valueForKey('zebra') );
    },

    testSetValueForKey: function(t)
    {
        this.kvo.setValueForKey( 5, "foo" );
        t.assertEqual( 5, this.kvo.foo );
    },

    testObserveChange: function(t)
    {
        var observer= {};
        var called= false;
    
        function observeChange(change, keyPath, context)
        {
            called= true;
        }
    
        this.kvo.addObserverForKeyPath(observer, observeChange, 'name');
        this.kvo.setName('bob');
        t.assertTrue(called);
    },

    testObserveSubKeyTypeChange: function(t)
    {
        var name= coherent.KVO.adapt({
            first: 'john',
            last: 'doe'
        });
    
        var observer= {};
        var called= false;
    
        function observeChange(change, keyPath, context)
        {
            called= true;
        }
    
        this.kvo.addObserverForKeyPath(observer, observeChange, 'name.first');
        this.kvo.setName(name);
    
        name.setValueForKey('jane', 'first');
        t.assertTrue(called);
    },

    testObserveSubKeyChangePriorToSwizzle: function(t)
    {
        var name= coherent.KVO.adapt({
            first: 'john',
            last: 'doe'
        });
    
        var observer= {};
        var called= false;
    
        function observeChange(change, keyPath, context)
        {
            called= true;
        }
        
        this.kvo.setName(name);
        this.kvo.addObserverForKeyPath(observer, observeChange, 'name.first');
    
        name.setValueForKey('jane', 'first');
        t.assertTrue(called);
    },
    
    testObserveKeyWithoutNotification: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var observer= {};
        var called= false;
        
        function observeChange(change, keyPath, context)
        {
            called= true;
        }
        
        this.kvo.addObserverForKeyPath(observer, observeChange, 'goober');
        this.kvo.goober= 5;
        
        t.assertTrue(called);
    },

    testObserveSubKeyWithoutNotification: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var observer= {};
        var called= false;
        var value;
        
        function observeChange(change, keyPath, context)
        {
            called= true;
            value= change.newValue;
        }
        
        this.kvo.goober= coherent.KVO.adapt({ baz: 'bazValue' });
        this.kvo.addObserverForKeyPath(observer, observeChange, 'goober.baz');
        this.kvo.goober.baz= 5;
        
        t.assertTrue(called);
        t.assertEqual(value, 5);
    },

    testObserveMissingSubKeyWithoutNotification: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var observer= {};
        var called= false;
        var value;
        
        function observeChange(change, keyPath, context)
        {
            called= true;
            value= change.newValue;
        }
        
        this.kvo.addObserverForKeyPath(observer, observeChange, 'goober.baz');
        this.kvo.goober= coherent.KVO.adapt({ baz: 'bazValue' });
        this.kvo.goober.baz= 5;
        
        t.assertTrue(called);
        t.assertEqual(value, 5);
    },

    testObserveSubKeyParentChangeWithoutNotification: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        var observer= {};
        var called= false;
        
        function observeChange(change, keyPath, context)
        {
            called= true;
        }
        
        this.kvo.goober= coherent.KVO.adapt({ baz: 'bazValue' });
        this.kvo.addObserverForKeyPath(observer, observeChange, 'goober.baz');
        this.kvo.goober= coherent.KVO.adapt({ baz: 'newValue' });
        
        t.assertTrue(called);
    },

    testInitBug: function(t)
    {
        var observeCalled= false;
        var observeValue= undefined;
        var observer= {};
    
        function observe( change, keyPath, context )
        {
            observeCalled= true;
            observeValue= change.newValue;
        }

        this.kvo.willChangeValueForKey( "immutable" );
        this.kvo.__immutable= { foo: "zebra", bar: "baz" };
        coherent.KVO.adapt(this.kvo.__immutable);
        this.kvo.didChangeValueForKey( "immutable" );
    
        this.kvo.addObserverForKeyPath( observer, observe, "immutable.foo" );
        this.kvo.setValueForKeyPath( "horse", "immutable.foo" );

        t.assertTrue( observeCalled );
        t.assertEqual( observeValue, 'horse' );
    },

    testBindingFromString: function(t)
    {
        t.skip("coherent.Binding.bindingFromString is no longer valid.");

        var binding= coherent.Binding.bindingFromString( "kvo.foo" );
        t.assertNotNull( binding );
        t.assertEqual( this.kvo.foo, binding.value() );
        binding.setValue( "goober" );
        t.assertEqual( this.kvo.foo, "goober" );
        t.assertEqual( binding.value(), "goober" );
    
        var observeCalled= false;
        var observeValue= undefined;
    
        function observe( change, keyPath, context )
        {
            observeCalled= true;
            observeValue= change.newValue;
        }
    
        binding.observerFn= observe;
        this.kvo.setValueForKey( "zebra", "foo" );
        t.assertTrue( observeCalled );
        t.assertEqual( observeValue, 'zebra' );
    
        //  reset observe
        observeCalled= false;
        this.kvo.setValueForKey( "zebra", "foo" );
        t.assertFalse( observeCalled );
    },

    testAndBindingFromString: function(t)
    {
        t.skip("CompoundBindings aren't supported any more.");

        this.kvo.left= true;
        this.kvo.right= false;
    
        var binding= coherent.Binding.bindingFromString( "kvo.left && kvo.right" );
        t.assertNotNull( binding );
        t.assertEqual( this.kvo.left, binding.left.value() );
        t.assertEqual( this.kvo.right, binding.right.value() );

        t.assertEqual( (this.kvo.left && this.kvo.right), binding.value() );
        try
        {
            binding.setValue( "goober" );
            t.fail("setting value on compound binding should fail");
        }
        catch (e)
        {
        }
    
        var observeCalled= false;
        var observeValue= undefined;
    
        function observe( change, keyPath, context )
        {
            observeCalled= true;
            observeValue= change.newValue;
        }
    
        binding.observerFn= observe;
        this.kvo.setValueForKey( true, "right" );
        t.assertTrue( observeCalled );
        t.assertEqual( observeValue, true );
    
        //  reset observe
        observeCalled= false;
        this.kvo.setValueForKey( true, "left" );
        t.assertFalse(observeCalled);
    },

    testOrBindingFromString: function(t)
    {
        t.skip("CompoundBindings aren't supported any more.");

        this.kvo.left= true;
        this.kvo.right= false;
    
        var binding= coherent.Binding.bindingFromString( "kvo.left || kvo.right" );
        t.assertNotNull( binding );
        t.assertEqual( this.kvo.left, binding.left.value() );
        t.assertEqual( this.kvo.right, binding.right.value() );

        t.assertEqual((this.kvo.left || this.kvo.right), binding.value());
        try
        {
            binding.setValue( "goober" );
            t.fail( "setting value on compound binding should fail" );
        }
        catch (e)
        {
        }
    
        var observeCalled= false;
        var observeValue= undefined;
    
        function observe( change, keyPath, context )
        {
            observeCalled= true;
            observeValue= change.newValue;
        }
    
        binding.observerFn= observe;
        this.kvo.setValueForKey( false, "left" );
        t.assertTrue( observeCalled );
        t.assertEqual( observeValue, false );
    
        //  reset observe
        observeCalled= false;
        this.kvo.setValueForKey( false, "right" );
        t.assertFalse(observeCalled);
    }

});
