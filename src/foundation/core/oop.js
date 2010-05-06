/*jsl:import ../../foundation.js*/

/**
    @namespace
 */
var Class= (function(){

    /** Wrap a constructor function so that it may invoke the base constructor.
        @param {Function} construct - the original constructor function
        @param {Function} [superclass] - the superclass' constructor function
        @returns {Function} a wrapped function which sets up the base method
            correctly.

        @inner
     */
    function wrapConstructorForBase(construct, superclass)
    {
        /** Create a wrapped constructor
            @function
            @inner
         */
        var wrappedConstructor;
        
        if (!construct && !superclass)
            return construct;
            
        if (!construct)
            wrappedConstructor= function()
            {
                return superclass.apply(this, arguments);
            };
        else
        {
            var callsBase= /this\.base/.test(construct);

            if (!callsBase && !superclass)
                return construct;
                
            if (!callsBase)
                wrappedConstructor= function()
                {
                    superclass.call(this);
                    return construct.apply(this, arguments);
                };
            else
                wrappedConstructor= function()
                {
                    var prev= this.base;
                    this.base= superclass||function(){};
                    var result= construct.apply(this, arguments);
                    this.base= prev;
                    return result;
                };
        }
        
        wrappedConstructor.valueOf= function()
        {
            return construct;
        }
        wrappedConstructor.toString= function()
        {
            return String(construct);
        }
        wrappedConstructor.displayName='Constructor wrapper';
        
        return wrappedConstructor;
    }
    
    /** Call the factory method for a class.
    
        @inner
        
        @param {Class} klass - The class for which the factory function should
               be called.
        @param {Array} args - An array of arguments to pass to the factory.
        @returns {Function} A factory function which can be used to instantiate
                 new objects using the arguments supplied.
     */
    function callFactory(klass, args)
    {
        var fn= klass.prototype.__factory__.apply(klass, args);
        if ('function'!==typeof(fn))
            throw new Error('Factory function doesn\'t return a function');
        fn.__factoryFn__= true;
        return fn;
    }
    
    /** Create any declarative objects from the class definition. For example:
    
            var MyClass= Class.create({
                foo: AnotherClass({ parameter: value })
            });
            
        Assuming that AnotherClass declared a `__factory__` method, the `foo`
        property is defined as a factory function. When a new instance of
        `MyClass` is created, each of the factory functions will be called to 
        create proper values for the instance variables.
        
        If a class declares a `__createFactoryObjects` method, creation of its
        factory objects is delegated to that method. For an example of this,
        see {@link coherent.Bindable#__createFactoryObjects}.
        
        @inner
        @param {Object} obj - The object to create the factory objects for.
     */
    function createFactoryObjects(obj)
    {
        if (obj.__createFactoryObjects)
        {
            obj.__createFactoryObjects();
            return;
        }
        
        //  Create declarative objects
        var p;
        var v;
        for (p in obj.__factories__)
        {
            v= obj[p];
            if (!v.__factoryFn__)
                continue;
            obj[p]= v.call(obj);
        }
    }
    
    /** Create a constructor for a class. Depending on whether the constructor
        exists, the superclass exists, and whether the constructor calls its
        ancestor constructor, this function returns a wrapper function that
        is invoked first.
        
        @inner
        @param {Function} construct - The actual constructor for the new class.
        @param {Function} [superclass] - The constructor for the superclass, if
            there is a superclass.
        @returns {Function} a wrapped function which calls the `__postConstruct`
            hook if the class defines one.
     */
    function makeConstructor(construct, superclass)
    {
        if (construct && !(construct instanceof Function))
            throw new Error('Invalid constructor');
        if (superclass && !(superclass instanceof Function))
            throw new Error('Invalid superclass');
        
        //  Remove the postConstruct wrapping around the constructor for the
        //  superclass.
        superclass= superclass?superclass.valueOf():null;
        
        //  If the constructor calls this.base, wrap it with the appropriate
        //  stuff.
        construct= wrapConstructorForBase(construct, superclass);

        /** The wrapped constructor. This wrapper enables factory methods,
            declarative objects, and post construct hooks.
            @function
            @inner
         */
        var wrapped;
        
        if (construct)
        {
            construct.displayName='Constructor';
            wrapped= function()
            {
                if (!(this instanceof wrapped))
                    return callFactory(wrapped, arguments);
                    
                this.__uid= coherent.generateUid();

                var result= construct.apply(this, arguments);

                if (result)
                    return result;
            
                createFactoryObjects(this);
                
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();

                return this;
            };
        }
        else
            wrapped= function()
            {
                if (!(this instanceof wrapped))
                    return callFactory(wrapped, arguments);

                this.__uid= this.__uid||coherent.generateUid();

                createFactoryObjects(this);
                
                if (this.__postConstruct instanceof Function)
                    this.__postConstruct();

                return this;
            }
        
        //  make wrapped constructor look like the original
        wrapped.valueOf= function()
        {
            return construct;
        }
        wrapped.toString= function()
        {
            return String(construct||wrapped);
        }
        wrapped.displayName='Generated constructor';
        return wrapped;
    }

    /** Create a prototype with the minimum amount of closure baggage.
        @inner
        @param {Class} superclass - The constructor of the superclass which
            should be created as the prototype.
        @returns {Object} A new prototype based on the superclass.
     */
    function makePrototype(superclass)
    {
        function silent() {}
        silent.prototype= superclass.prototype;
        return new silent();
    }

    /** An empty function devoid of any closure baggage.
     */
    function emptyFn()
    {}
    
    /** Create a method wrapper that has access to the base method. Because
        of the wrapping of methods, I define a valueOf member on the wrapped
        method to return the original method. That allows the code to determine
        whether this method is the same as another.
        
        @inner

        @param {Function} method - A reference to the method which may call `this.base(...)`
        @param {String} name - The name of the method -- used for looking up the
               implementation in the superclass.
        @param {Object} superproto - The prototype of the superclass -- used to
               find the superclass implementation of the method.
               
        @returns a new function which sets up the base method
     */
    function wrapMethodForBase(method, name, superproto)
    {
        if (!method || !/this\.base/.test(method))
            return method;
        
        /** Wrap a method so that it may call the superclass implementation.
            @function
            @inner
         */
        function wrappedMethod()
        {
            this.base= superproto[name]||emptyFn;
            return wrappedMethod.method.apply(this, arguments);
        }
        wrappedMethod.valueOf= function()
        {
            return method;
        }
        wrappedMethod.toString= function()
        {
            return String(method);
        }
        wrappedMethod.method= method;
        
        //  Copy factory function marker
        if ('__factoryFn__' in method)
            wrappedMethod.__factoryFn__= method.__factoryFn__;
            
        //  Create a displayName property for the wrapped method
        wrappedMethod.displayName= method.displayName||name;
        
        return wrappedMethod;
    }
    
    /** Walk the class hierarchy to call the __subclassCreated__ hooks if
        present. Passes a reference to the newClass constructor.
        
        @TODO: Reverse the order of the method calls. The subclass hooks are
        called ascending the tree (from the superclass to the root of the tree),
        but it seems like they _should_ be called descending (from the root of
        the tree to the superclass).

        @inner
        
        @param {Class} newClass - The new class that is being created.
     */
    function postSubclassNotification(newClass)
    {
        var klass;
        for (klass= newClass.superclass; klass; klass=klass.superclass)
            if ('__subclassCreated__' in klass)
                klass.__subclassCreated__(newClass);
    }

    /** @scope Class */
    return {
    
        /** Create a class. This attempts to mimic classical OOP programming
            models in JavaScript. The first parameter (superclass) is optional
            and if not specified, the new class will have no superclass. The
            syntax is a bit awkward (what would you expect of trying to mimic
            a programming model that isn't _really_ supported), but it seems
            to be prevelant out there on the Internets.
            
                var Animal= Class.create( {
                    constructor: function(name)
                    {
                        ...
                    }
                });
            
            The constructor member of the class declaration is the method which
            will be invoked when your script executes: `new Animal(...)`. But
            there may be some wrapping magic going on to make inheritence work
            better. For example:
            
                var Cat= Class.create(Animal, {
                    constructor: function(name, breed)
                    {
                        this.base(name);
                        this.breed= breed;
                    }
                });
            
            There's no _real_ base member, but `Class.create` actually creates
            a wrapper function which temporarily stashes the ancestor method
            in base and removes it when the method is finished. This works for
            any method.
            
            Additionally, you may define a class method (`__subclassCreated__`)
            which will be called each time a new class is created using your
            class as a superclass or ancestor class. The following example
            defines a subclass hook function for the `Animal` class:
            
                Animal.__subclassCreated__= function(newClass)
                {
                ...
                }
            
            Finally, classes may define a `__postConstruct` method which will be
            called after all constructors are invoked. In the case of Views,
            the `__postConstruct` method invokes their `init` method if the
            DOM node is available or schedules the `init` method if the DOM has
            not finished loading.
            
            @param {Class} [superclass] - A reference to the super class for
                this class. If no superclass is specified, the new class will
                inherit from Object.
            @param {Object} decl - An object literal declaring the instance
                members for the class. These members will be created on the
                prototype for the class. So be careful about using object
                literals within this declaration, because they may not work as
                you might be expecting -- they will be shared among all
                instances.
            
            @returns {Class} A reference to a constructor function that will be
                used to initialise instances of this class.
         */
        create: function(superclass, decl)
        {
            var construct;
            var proto= {};

            switch (arguments.length)
            {
                case 0:
                    throw new TypeError('Missing superclass and declaration arguments');
            
                case 1:
                    decl= superclass;
                    superclass= undefined;
                    break;
                
                default:
                    proto= makePrototype(superclass);
                    break;
            }

            //  Allow decl to be a function that returns an object
            if ('function'==typeof(decl))
            {
                decl= decl();
                if (!decl)
                    throw new Error('Class declaration function did not return a prototype');
            }
            
            if (decl.hasOwnProperty('constructor'))
            {
                construct= decl['constructor'];
                delete decl['constructor'];
            }
            
            construct= makeConstructor(construct, superclass);
            
            construct.prototype= proto;
            construct.prototype.constructor= construct;
            construct.superclass= superclass;
            
            //  Prepare for factory functions in class decl.
            if (superclass)
                proto.__factories__= Object.clone(superclass.prototype.__factories__);
            else
                proto.__factories__= {};
            
            //  Create a unique ID for each class, helps the Dashcode indexer
            construct.__class_id__= coherent.generateUid();

            this.extend(construct, decl);
        
            postSubclassNotification(construct);
        
            return construct;
        },

        /** A **very** lightweight version of {@link Class.create}. This version
            does not support methods calling base implementations, the hook for
            post construction, nor creating factory objects. But if you just
            want to create a fast lightweight class, this is your tool.
         */
        _create: function(superclass, decl)
        {
            var proto= {};
            
            switch (arguments.length)
            {
                case 0:
                    throw new TypeError('Missing superclass and declaration arguments');
            
                case 1:
                    decl= superclass;
                    superclass= undefined;
                    break;
                
                default:
                    proto= makePrototype(superclass);
                    break;
            }

            var constructor= emptyFn;
            if (decl.hasOwnProperty('constructor'))
            {
                constructor= decl.constructor;
                delete decl.constructor;
            }

            constructor.prototype= proto;
            constructor.prototype.constructor= constructor;
            constructor.superclass= superclass;

			// Give the class a UID, for easier lookup
            constructor.__class_id__ = coherent.generateUid();
            
            Class.extend(constructor, decl);
            return constructor;
        },
        
        emptyFn: emptyFn,

        /** Add a member to the prototype for a new class. If the value is a
            function, determine whether it calls 'this.base' to access its ancestor
            method and if so, wrap it in a closure which provides access to the
            ancestor method.

            @inner
        
            @param {Object} proto - A reference to the prototype to which the member
                   should be added.
            @param {String} name - The name with which the member should be inserted.
            @param {Any} value - The value of the new member.
        
            @returns The value inserted as the new member (which might have been
                     wrapped if it was a function)
         */
        addMember: function(proto, name, value, superproto)
        {
            var isFunction= (value instanceof Function);

            if (isFunction)
            {
                value.displayName= name;
            
                //  wrap the method for calls to base()
                if (superproto)
                    value= wrapMethodForBase(value, name, superproto);
                
                if (value.__factoryFn__)
                    proto.__factories__[name]= value;
            }
        
            proto[name]= value;
        
            return value;
        },

        
        /** Extend a class definition with the elements of an object literal.
            If the host JavaScript environment supports getters and setters
            (Firefox 2.0, Safari 3, SpiderMonkey, and Rhino) then this function
            will create appropriate getters and setters rather than copying
            the value.
            
            @function
            
            @param {Class} klass - A reference to the constructor for the class
                   which should be extended with new members.
            @param {Object} decl - an object literal defining the members to add
                   to the class prototype.
            
            @returns {Class} The original `klass` value is augmented and then
                     returned.
         */
        extend: (function(){
            if (coherent.Support.Properties)
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            var superproto= klass.superclass && klass.superclass.prototype;
                            var v;
        
                            for (var p in decl)
                            {
                                var g= decl.__lookupGetter__(p);
                                var s= decl.__lookupSetter__(p);
                                if (g || s)
                                {
                                    g && proto.__defineGetter__(p, g);
                                    s && proto.__defineSetter__(p, s);
                                }
                                else
                                    Class.addMember(proto, p, decl[p], superproto);
                            }

                            return klass;
                        };
            else
                return function(klass, decl)
                        {
                            var proto= klass.prototype;
                            var superproto= klass.superclass && klass.superclass.prototype;
                            for (var p in decl)
                                Class.addMember(proto, p, decl[p], superproto);
                            if (decl.toString!=={}.toString)
                                Class.addMember(proto, 'toString', decl.toString, superproto);
                        };
        })()
    };
    
})();