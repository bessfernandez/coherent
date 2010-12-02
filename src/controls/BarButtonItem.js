/*jsl:import coherent*/

/**
  class coherent.BarButtonItem
  
  This is a placeholder object that is used for displaying items in a toolbar or
  similar views.
  
  BarButtonItems may have the following properties:
  
  - title (String) : The title that should be displayed in this BarButton.
  - image (String) : The URL of the image that should be displayed in the BarButton.
  - target (String) : The target object to which the action message should be sent.
  - action (String|Function) : Either a function to be called when the visitor invokes
      the bar button item, or a string representing the method to call on the first
      responder that implements it.
  - class (String) : The class name that should be applied to the bar button's DOM
      node for styling.
  - enabled (Boolean) : Whether the button is enabled or not.
  - customView (coherent.View) : A custom view to display instead of this button.
 */
coherent.BarButtonItem= Class.create(coherent.KVO, {

  constructor: function(params)
  {
    if (!('enabled' in params))
      params.enabled= true;
    this.base(params);
  },
  
  title: function()
  {
    return this.__title;
  },

  setTitle: function(title)
  {
    this.__title= title;
  },
  
  'class': function()
  {
    return this.__class;
  },

  setClass: function(klass)
  {
    this.__class= klass;
    this.forceChangeNotificationForKey('_class');
  },
  
  enabled: function()
  {
    return this.__enabled;
  },

  setEnabled: function(enabled)
  {
    this.__enabled= enabled;
  },
  
  _class: function()
  {
    var classes= ['ui-bar-item'];
    if (this.__class)
      classes.push(this.__class);
      
    return classes.join(' ');
  }
});
