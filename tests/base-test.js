/*jsl:import test-helpers.js*/

Test.create('base', {

    testTitleCase: function(t)
    {
        t.assertEqual( 'fooBar'.titleCase(), "FooBar" );
    
        //  passing anything but a string to titleCase should throw some sort of
        //  exception, which exception depends on your JavaScript engine.
        //  @TODO: 0 seems to work OK. I'm not certain whether this should be fixed.
        try
        {
            (50).titleCase();
            t.fail( "Shouldn't have been able to complete titleCase with non-string values" );
        }
        catch (e)
        {
            //  I was expecting an exception.
        }
    },

    testClone: function(t)
    {
        var obj= { foo: 1, bar: "baz" };
        var c= Object.clone(obj);
    
        t.assertNotEqual( obj, c );
        t.assertEqual( obj.foo, c.foo );
        t.assertEqual( obj.bar, c.bar );
    },

    testRealTypeOf: function(t)
    {
        function FooBar()
        {
        }

        t.assertEqual( "number", coherent.typeOf(5) );
        t.assertEqual( "string", coherent.typeOf("foo") );
        t.assertEqual( "regexp", coherent.typeOf(/foo/) );
        t.assertEqual( "string", coherent.typeOf(new String("foo")) );
        t.assertEqual( "date", coherent.typeOf(new Date()) );
        t.assertEqual( "function", coherent.typeOf(FooBar) );
        t.assertEqual( "array", coherent.typeOf([]) );
        t.assertEqual( "undefined", coherent.typeOf(undefined) );
        t.assertEqual( "null", coherent.typeOf(null) );
        t.assertEqual( "boolean", coherent.typeOf(true) );
        t.assertEqual( "boolean", coherent.typeOf(false) );
        t.assertEqual( "object", coherent.typeOf({}) );
        t.assertEqual( "object", coherent.typeOf(new FooBar()) );
    },

    testCompareValues: function(t)
    {
        t.assertEqual( -1, coherent.compareValues(1,2) );
        t.assertEqual( 1, coherent.compareValues(2,1) );
        t.assertEqual( 0, coherent.compareValues( "foo", "foo" ) );
        t.assertNotEqual( 0, coherent.compareValues( "foo", "bar" ) );
        t.assertEqual( 0, coherent.compareValues( "1", 1 ) );
        t.assertNotEqual( 0, coherent.compareValues( true, false ) );
        t.assertEqual( 0, coherent.compareValues( [1,2,3], [1,2,3] ) );
        t.assertEqual( -1, coherent.compareValues( [1,2], [1,2,3] ) );
        t.assertEqual( 1, coherent.compareValues( [1,2,3], [1,2] ) );
        t.assertEqual( -1, coherent.compareValues( [1,2], [1,4] ) );
    },

    testArrayDistinct: function(t)
    {
        t.assertEqual( [1,2], [1,2].distinct() );
        t.assertEqual( [1,2], [1,2,1].distinct() );
        t.assertEqual( [1], [1,1,1].distinct() );
    },

    testSet: function(t)
    {
        var s= new Set( "abc", "foo", "bar", 1 );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    testSetArray: function(t)
    {
        var s= new Set( ["abc", "foo", "bar", 1] );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    testSetFn: function(t)
    {
        var s= Set( "abc", "foo", "bar", 1 );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    testSetFnArray: function(t)
    {
        var s= Set( ["abc", "foo", "bar", 1] );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    test$S: function(t)
    {
        var s= $S( "abc", "foo", "bar", 1 );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    test$SArray: function(t)
    {
        var s= $S( ["abc", "foo", "bar", 1] );
        t.assertTrue( 'abc' in s );
        t.assertFalse( 'zebra' in s );
        t.assertTrue( 'foo' in s );
        t.assertTrue( 'bar' in s );
        t.assertTrue( 1 in s );
        t.assertFalse( 2 in s );
    },

    testSetUnion: function(t)
    {
        var s1= $S( "abc", "123" );
        var s2= $S( "xyz", "234" );
    
        var s3= Set.union( s1, s2 );
        t.assertTrue( "abc" in s3 );
        t.assertTrue( "123" in s3 );
        t.assertTrue( "xyz" in s3 );
        t.assertTrue( "234" in s3 );
        t.assertFalse( "qwe" in s3 );
    },

    testSetAdd: function(t)
    {
        var s= $S( "abc", "123" );
        t.assertFalse( "xyz" in s );
        Set.add( s, "xyz" );
        t.assertTrue( "xyz" in s );
    },

    testSetToArray: function(t)
    {
        var s= $S( "abc", "123", "xyz" );
        var a= Set.toArray(s);

        //  I don't want to compare the array against a constant array, because
        //  there's no t.assertion that the array will be in any order.
        t.assertTrue( -1!=a.indexOf('abc') );
        t.assertTrue( -1!=a.indexOf('123') );
        t.assertTrue( -1!=a.indexOf('xyz') );
    },
    
    testPushReassign: function(t)
    {
        var oldPush= Array.prototype.push;
        var pushed= false;
        Array.prototype.push= function()
        {
            pushed= true;
            oldPush.apply(this, arguments);
        }
        var a= [1,2];
        a.push(4);
        t.assertTrue(pushed);
    },
    
    testPropDelete: function(t)
    {
        if (!coherent.Support.Properties)
            t.skip('properties not supported.');
            
        function MyClass()
        {
        }
        MyClass.prototype.__defineGetter__('value',
            function()
            {
                return this._value;
            }
        );
        MyClass.prototype.__defineSetter__('value',
            function(newValue)  
            {
                this._value= newValue;
            }
        );
    
        var my= new MyClass();
        
        //  Check that it really has a value
        my.value= "foo";
        t.assertEqual("foo", my.value);
        
        //  Determine whether it's possible to delete the getter/setter via
        //  the instance.
        delete my.value;
        t.assertTrue('value' in my);
        t.assertEqual("foo", my.value);
        
        //  Should be able to delete the getter/setter via the prototype
        delete MyClass.prototype.value;
        t.assertFalse('value' in my);
    }
});
