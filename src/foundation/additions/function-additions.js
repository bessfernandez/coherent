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
    delayedFnWrapper.timer= window.setTimeout(delayedFnWrapper, delay||0);
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
