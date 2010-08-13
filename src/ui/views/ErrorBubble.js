/*jsl:import Button.js*/
/*jsl:import Bubble.js*/
/*jsl:import CollectionView.js*/

/** A specialisation of the {@link coherent.Bubble} view that displays the
    contents of a {@link coherent.Error} object and offers buttons to attempt
    recovery from the error.
 */
coherent.ErrorBubble= Class.create(coherent.Bubble, {

  markup: '<div class="ui-bubble"></div>',
  innerHTML: '<span class="ui-bubble-chrome ui-bubble-tl"></span><span class="ui-bubble-chrome ui-bubble-tr"></span><span class="ui-bubble-chrome ui-bubble-top"></span><span class="ui-bubble-chrome ui-bubble-left"></span><span class="ui-bubble-chrome ui-bubble-right"></span><span class="ui-bubble-chrome ui-bubble-bottom"></span><span class="ui-bubble-chrome ui-bubble-bl"></span><span class="ui-bubble-chrome ui-bubble-br"></span><a href="#" class="close">close</a><span class="ui-bubble-chrome ui-bubble-center"></span><div class="ui-bubble-container"><div class="ui-bubble-content"></div><ul class="ui-bubble-buttons"><li><button></button></li></ul></div><span class="ui-bubble-chrome ui-bubble-arrow"></span>',

  __structure__: {
    '.buttons': coherent.CollectionView({
              visibleBinding: 'recoveryOptions',
              contentBinding: 'recoveryOptions',
              action: 'recoveryButtonClicked',
              viewTemplate: VIEW_TEMPLATE({
                  'button': coherent.Button({
                      textBinding: 'representedObject.text'
                    })
                })
            })
  },
  
  /** Retrieve the error being displayed in this bubble.
      @type coherent.Error
   */
  error: function()
  {
    return this.__error;
  },
  
  /** Set the error object associated with this bubble.
      @param {coherent.Error} newError
   */
  setError: function(newError)
  {
    this.__error= newError;
  },
  
  /** Override of the default {@link coherent.Bubble#updateContent} method that
      displays the error description and buttons.
   */
  updateContent: function()
  {
    if (!this.__error)
      return;

    var error= this.__error;
    var container= this.container();
    var textnode;

    textnode= document.createTextNode(error.description);
    container.innerHTML="";
    container.appendChild(textnode);
    
    if (error.recoveryOptions && error.recoveryAttempter)
    {
      function makeOptionKVO(o)
      {
        var kvo= new coherent.KVO();
        kvo.text= o;
        return kvo;
      }
      
      var options= error.recoveryOptions.map(makeOptionKVO);
      this.setValueForKey(options, 'recoveryOptions');
    }
  }

});
