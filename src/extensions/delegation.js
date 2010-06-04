/*jsl:import ../foundation.js*/
/*jsl:declare Sizzle*/

Class.extend(coherent.Page, {

  __delegatesForEventType: function(eventType)
  {
    if (!this._delegates)
      this._delegates= {};
      
    if (eventType in this._delegates)
      return this._delegates[eventType];
    
    return (this._delegates[eventType]=[]);
  },
  
  delegate: function(selector, event, fn)
  {
    var delegates;
    
    this.onclick= this._fireDelegates;
  
    //  e.g. coherent.page.delegate('div a', 'click', function(event) {});
    if ('string'===typeof(event))
    {
      delegates= this.__delegatesForEventType(event);
      delegates.push({
          sel: selector,
          fn: fn
        });
    }
    else
    {
      //  e.g. coherent.page.delegate('div a', {
      //                  click: function(event) {}
      //                });
      for (var p in event)
      {
        delegates= this.__delegatesForEventType(event);
        delegates[p].push({
            sel: selector,
            fn: event[p]
          });
      }
    }
  },

  _fireDelegates: function(event)
  {
    var element= event.target||event.srcElement;
    var match= Element.match;
    var handlers= this.__delegatesForEventType(event.type);

    function visitDelegate(d)
    {
      if (match(element, d.sel))
        d.fn(event);
    }
    
    handlers.forEach(visitDelegate);
  },
  
  onclick: function(event)
  {
    this._fireDelegates(event);
  }

});

Object.extend(Element, {

  /** Determine whether the node matches a specific selector.
  
      @param {Element} node
      @param selector
      @returns true if the node matches the selector or false if not
   */
  match: function(node, selector)
  {
    return Sizzle.matches(selector, [node]).length==1;
  }
  
});