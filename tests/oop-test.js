/*jsl:import test-helpers.js*/

Test.create('oop', {

    testBase: function(t)
    {
        var value= 'original';
        
        var F= Class.create({

                    f: function()
                    {
                        return value;
                    }
                    
                });
                
        var Fsubclass= Class.create(F, {
        
                    f: function()
                    {
                        return this.base();
                    }
                    
                });

        var o= new Fsubclass();
        t.assertEqual(o.f(), value);
    },

    testMonkeyPatchAncestor: function(t)
    {
        var valueOriginal= 'original';
        var valueNew= 'new';
        
        var F= Class.create({

                    f: function()
                    {
                        return valueOriginal;
                    }
                    
                });
                
        var Fsubclass= Class.create(F, {
        
                    f: function()
                    {
                        return this.base();
                    }
                    
                });

        //  perform monkey patch
        Class.extend(F, {
        
                    f: function()
                    {
                        return valueNew;
                    }
                    
                });
                
        var o= new Fsubclass();
        t.assertEqual(o.f(), valueNew, "<rdar://problem/6682247> wrapMethodForBase doesn't actually work correctly");
    },

    testMonkeyPatchDerived: function(t)
    {
        var valueOriginal= 'original';
        var valueNew= 'new';
        
        var F= Class.create({

                    f: function()
                    {
                        return valueOriginal;
                    }
                    
                });
                
        var Fsubclass= Class.create(F, {
        
                    f: function()
                    {
                        return valueNew;
                    }
                    
                });

        //  perform monkey patch
        Class.extend(Fsubclass, {
        
                    f: function()
                    {
                        return this.base();
                    }
                    
                });
                
        var o= new Fsubclass();
        t.assertEqual(o.f(), valueOriginal, "<rdar://problem/6682247> wrapMethodForBase doesn't actually work correctly");
    },
    
    testAccessors: function(t)
    {
        var MyArrayController = Class.create(coherent.ArrayController, {
        
            setContent: function(newContent)
            {
                this.base(newContent);
                this.called= true;
            }
            
        });

        var myArrayController = new MyArrayController();
    
        myArrayController.setValueForKey([1,2],"content");
        t.assertTrue(myArrayController.called);
    },
    
    testConstructor: function(t)
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

    testConstructor: function(t)
    {
        var MyOtherClass= Class.create({
            
            constructor: function()
            {
                this.b= 10;
            }
            
        });
        
        var MyClass= Class.create({
            
            constructor: function()
            {
                return new MyOtherClass();
            }
        
        });
        
        var c= new MyClass();
        t.assertEqual(c.b, 10);
    }
    
    
});