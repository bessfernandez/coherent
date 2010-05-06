Test.spec("Classes", {

    "will call constructor when created": function(t)
    {
        var MyClass= Class.create({
            
            constructor: function()
            {
                this.a= 5;
            }
        
        });
        
        var c= new MyClass();
        t.assertEqual(c.a, 5);
    },
    
    "can have a constructor that returns a value": function(t)
    {
        var returnValue= { foo: "bar" };
        
        var MyClass= Class.create({
            
            constructor: function()
            {
                return returnValue;
            }
        
        });
        
        var c= new MyClass();
        t.assertEqual(c, returnValue);
    },
    
    "can derive from another class": function(t)
    {
        var SuperClass= Class.create({});
        var DerivedClass= Class.create(SuperClass, {});
    },
    
    "when derived from another class": Test.spec({
    
        "can override method of super class": function(t)
        {
            var SuperClass= Class.create({
                    f: function()
                    {
                        return 5;
                    }
                });
            
            var DerivedClass= Class.create(SuperClass, {
                    f: function()
                    {
                        return 10;
                    }
                });
                
            var o= new DerivedClass();
            t.assertEqual(o.f(), 10);
        },
        
        "can invoke methods of super class via this.base()": function(t)
        {
            var SuperClass= Class.create({
                    f: function()
                    {
                        return 5;
                    }
                });
            
            var DerivedClass= Class.create(SuperClass, {
                    f: function()
                    {
                        return this.base()+5;
                    }
                });
                
            var o= new DerivedClass();
            t.assertEqual(o.f(), 10);
        }
        
    })

});
