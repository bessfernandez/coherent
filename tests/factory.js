/*jsl:import test-helpers.js*/

Test.create('factory', {

    testSimple: function(t)
    {
        var F= Class.create({
        
                    constructor: function(size)
                    {
                        this.size= size;
                    },
                    
                    __factory__: function(size)
                    {
                        var klass= this;
                        
                        return function()
                        {
                            return new klass(size);
                        };
                    }
                    
                });
                
        var C= Class.create({
        
                    constructor: function()
                    {
                    },
                    
                    f: F(5)
                
                });
                
        var c= new C();
        
        t.assertEqual(c.f.size, 5);
    },
    
    testBindable: function(t)
    {
        var B= Class.create(coherent.Bindable, {
                    exposedBindings: ['foo'],
                    
                    constructor: function(parameters)
                    {
                        this.base(parameters);
                    }
                    
                });
        
        var C= Class.create(coherent.Bindable, {
        
                    constructor: function()
                    {
                        this.zebra= 5;
                    },
                    
                    b: B({
                            fooBinding: 'zebra'
                        })
                        
                });
        
        var c= new C();
        t.assertEqual(c.b.foo, c.zebra);
        
        c.setValueForKey(10, 'zebra');
        t.assertEqual(c.b.foo, 10);
    }
    
});