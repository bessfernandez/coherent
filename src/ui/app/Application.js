/*jsl:import Responder.js*/
/*jsl:import ../nib/NIB.js*/
/*jsl:import hash.js*/

/** An application class.
 */
coherent.Application= Class.create(coherent.Responder, {

  constructor: function()
  {
    if (coherent.Application.shared)
      return coherent.Application.shared;
      
    // coherent.hash.addObserverForKeyPath(this, 'observeHashChange', 'value');
    
    distil.onready(function() {
      var app= coherent.Application.shared;
      app.loaded= true;
      app.__loadMainNib();
      app.callDelegate('applicationDidFinishLaunching');
      //  Remove a startup notice
      var startup= Element.query('.ui-startup');
      if (startup)
        startup.parentNode.removeChild(startup);
        
      function removeLoading()
      {
        Element.removeClassName(document.documentElement, 'ui-loading');
      }
      Function.delay(removeLoading,0);
    });
    
    return void(0);
  },

  /** Handle changes to the URL hash. If a {@link #delegate} has been set, this
      method calls the delegate's `hashDidChange` method.
    
      @param {coherent.ChangeNotification} change - The change notification with
        the new and old value for the URL hash.
   */
  observeHashChange: function(change)
  {
    this.callDelegate('hashDidChange', change.newValue);
  },
    
  mainNib: function()
  {
    return this.__mainNib;
  },
  
  setMainNib: function(newMainNib)
  {
    this.__mainNib= newMainNib;
    if (this.loaded)
      this.__loadMainNib();
  },
  
  __loadMainNib: function()
  {
    if (!this.__mainNib)
      return;

    var nib= NIB.withName(this.__mainNib);
    if (!nib)
      throw new Error("Could not find NIB with name \""+this.__mainNib +"\"");
      
    nib.instantiateNibWithOwner(this);

    var context= nib.context;

    var body= document.body;
    var views= context.__views;
    var numberOfViews= views.length;
    var view;

    for (var i=0; i<numberOfViews; ++i)
    {
      view= views[i];
      if (!view.node.parentNode || view.node.parentNode===coherent.View.__holdingArea)
      {
        body.appendChild(view.node);
        view.setVisible(true);
      }
    }
  }
  
});


coherent.Application.shared= new coherent.Application();