/*jsl:import ../build/coherent-uncompressed.js*/
/*jsl:declare Test*/

var TestObserver= Class.create({

    constructor: function()
    {
        this.value= undefined;
        this.called= false;
        this.count= 0;
    },
    
    observeChange: function(change, keyPath, context)
    {
        this.value= change.newValue;
        this.called= true;
        this.change= change;
        this.keyPath= keyPath;
        this.context= context;
        ++this.count;
    },
    
    reset: function()
    {
        this.value= undefined;
        this.called= false;
        this.count= 0;
    }
});

var MethodCallCounter= Class.create({

    constructor: function(object, method)
    {
        var original= object[method];
        var self= this;
        
        //  This is all made necessary by the clever code in KVO to determine
        //  whether a setter is really a setter.
        switch (original.length)
        {
            case 0:
                object[method]= function()
                                {
                                    self.count++;
                                    return original.apply(this, arguments);
                                };
                break;
                
            case 1:
                object[method]= function(arg0)
                                {
                                    self.count++;
                                    return original.apply(this, arguments);
                                };
                break;
                
            default:
                object[method]= function(arg0, arg1)
                                {
                                    self.count++;
                                    return original.apply(this, arguments);
                                };
                break;
        }

        if (object.__keys)
        {
            var propname= method;
            if ('set'===propname.substr(0,3) || 'get'===propname.substr(0,3))
                propname= propname.charAt(3).toLowerCase() + propname.substr(4);
                
            delete object.__keys[propname];
        }
        
        this.count= 0;
    },
    
    reset: function()
    {
        this.count= 0;
    }
    
});
