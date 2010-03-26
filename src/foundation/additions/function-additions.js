/** @class
    @name Function
 */
 
/** ES5 defines a bind method for functions, but that's not implemented by any
    current browsers, yet.
 */
if (!Function.prototype.bind)
    Function.prototype.bind= function(obj)
    {
        var self= this;
        if (!arguments.length)
            return self;
            
        if (1==arguments.length)
            return function()
            {
                return self.apply(obj, arguments);
            };

        var args= Array.from(arguments, 1);

        return function()
        {
            return self.apply(obj, args.concat(Array.from(arguments)));
        };
    }

if (!Function.prototype.bindAsEventListener)
    Function.prototype.bindAsEventListener = function(object)
    {
        var self = this;

        if (1==arguments.length)
            return function(event)
            {
                return self.call(object, event||window.event);
            };
            
        var args = Array.from(arguments);
        args.shift();

        return function(event) {
            return self.apply(object, [event || window.event].concat(args));
        };
    }


if (!Function.delay)
    Function.delay= function(fn, delay, scope, args)
    {
        function delayedFnWrapper()
        {
            delayedFnWrapper.timer= 0;
            delayedFnWrapper.fn.apply(delayedFnWrapper.scope,
                                      delayedFnWrapper.args);
        }
        function cancel()
        {
            if (!delayedFnWrapper.timer)
                return;
            window.clearTimeout(delayedFnWrapper.timer);
            delayedFnWrapper.timer= 0;
        }
        delayedFnWrapper.fn= fn;
        delayedFnWrapper.args= args||[];
        delayedFnWrapper.scope= scope||fn;
        delayedFnWrapper.cancel= cancel;
        delayedFnWrapper.timer= window.setTimeout(delayedFnWrapper, delay);
        return delayedFnWrapper;
    }

if (!Function.repeating)
    Function.repeat= function(fn, delay, scope, args)
    {
        function repeatingFnWrapper()
        {
            repeatingFnWrapper.timer= 0;
            repeatingFnWrapper.fn.apply(repeatingFnWrapper.scope,
                                      repeatingFnWrapper.args);
            repeatingFnWrapper.start();
        }
        function cancel()
        {
            if (!repeatingFnWrapper.timer)
                return;
            window.clearTimeout(repeatingFnWrapper.timer);
            repeatingFnWrapper.timer= 0;
        }
        function start(delay)
        {
            if (repeatingFnWrapper.timer)
                repeatingFnWrapper.cancel();
            if (!isNaN(delay))
                repeatingFnWrapper.delay= delay;
            repeatingFnWrapper.timer= window.setTimeout(repeatingFnWrapper, repeatingFnWrapper.delay);
        }
        repeatingFnWrapper.fn= fn;
        repeatingFnWrapper.args= args||[];
        repeatingFnWrapper.scope= scope||fn;
        repeatingFnWrapper.delay= delay;
        repeatingFnWrapper.cancel= cancel;
        repeatingFnWrapper.start= start;
        start();
        return repeatingFnWrapper;
    }
    
if (!Function.prototype.delay)
    Function.prototype.delay= function(delay)
    {
        var self = this;
        
        delay= delay||10;
        
        if (arguments.length<2)
        {
            /*  By default, the handler for setTimeout receives the timer
                event object. I've never seen any good use for this handler.
             */
            function noargs()
            {
                self();
            }
            return window.setTimeout(noargs, delay);
        }
        
        var args = Array.from(arguments, 1);
        
        function go()
        {
            self.apply(self, args);
        }
        return window.setTimeout(go, delay);
    }

if (!Function.prototype.bindAndDelay)
    Function.prototype.bindAndDelay= function(obj, delay)
    {
        var self = this;
        obj= obj||self;
        
        delay= delay||10;
        if (arguments.length<3)
        {
            function noargs()
            {
                self.call(obj);
            }
            return window.setTimeout(noargs, delay);
        }
        
        var args = Array.from(arguments, 2);
        
        function go()
        {
            self.apply(obj, args);
        }
        return window.setTimeout(go, delay);
    }




/** Provide synchronisation for functions.
 */
Function.prototype.sync= function()
{
    /** The function that will be called after all the sync points complete.
        @function
        @inner
     */
    var fn= arguments.length?this.bind.apply(this, arguments):this;
    var joinPoints= {};
    var cancelled= false;
    
    fn.stop= function()
    {
        cancelled= true;
    }

    fn.waitFor= function(point)
    {
        if (point in joinPoints)
            joinPoints[point]+=1;
        else
            joinPoints[point]= 1;
        
        return function()
        {
            //  this joinPoint hasn't been signaled
            if (0!==(joinPoints[point]-=1))
                return;

            if (cancelled)
                return;

            for (var p in joinPoints)
                if (joinPoints[p])
                    return;

            //  All join points have been triggered
            fn();
        };
    }
    
    return fn;
}
