/*jsl:import ../../foundation.js*/

coherent.Timer= Class._create({

  constructor: function(interval, scope, method, userArguments, repeats, scheduled)
  {
    if ('object'===typeof(interval))
    {
      Object.extend(this, interval);
    }
    else
    {
      this.interval= parseInt(interval, 10);
      this.scope= scope;
      this.method= method;
      this.userArguments= userArguments;
      this.repeats= !!repeats;
      this.scheduled= !!scheduled;
    }

    if ('string'===typeof(this.method))
      this.method= (this.scope||coherent.global)[this.method];
    if ('function'!==typeof(this.method))
      throw new Error("Invalid method for Timer");
      
    this.__timerMethod= this.__timerMethod.bind(this);
    if (this.scheduled)
      this.start();
  },
  
  start: function()
  {
    if (this.__timer)
      window.clearTimeout(this.__timer);

    this.__timer= window.setTimeout(this.__timerMethod, this.interval);
    this.scheduled= true;
  },
  
  stop: function()
  {
    if (this.__timer)
      window.clearTimeout(this.__timer);
    this.__timer= null;
    this.scheduled= false;
  },
  
  __timerMethod: function()
  {
    if (this.method)
      this.method.apply(this.scope||coherent.global, this.userArguments||[]);
    if (this.repeats && this.scheduled)
      this.start();
  }
  
});
