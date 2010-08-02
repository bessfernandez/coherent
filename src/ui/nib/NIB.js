/*jsl:import ../../ui.js*/

coherent.Nib= Class._create({

  SPECIAL_KEYS: {
    'owner': true,
    'application': true
  },

  constructor: function(name, def)
  {
    this.name= name;
    this.def= def;
    this.references= coherent.REF.__unresolved;
    coherent.REF.__unresolved= [];
  },

  /** Visit all elements in the node tree rooted at the view in depth first
      order. Call the view's awakeFromNib method only after calling the
      awakeFromNib method for all its subviews.
   */
  __awakeViewsFromNib: function(view)
  {
    var node= view.node;
    
    if (!node)
      return;
    var end= node.nextSibling||node.parentNode;
    var viewFromNode= coherent.View.fromNode;
    
    while (node!==end)
    {
      if (1===node.nodeType && node.firstChild)
      {
        node= node.firstChild;
        continue;
      }

      while (!node.nextSibling)
      {
        if (1===node.nodeType && (view= viewFromNode(node)) && view.awakeFromNib)
          view.awakeFromNib();
        node= node.parentNode;
        if (node===end)
          return;
      }

      if (1===node.nodeType && (view= viewFromNode(node)) && view.awakeFromNib)
        view.awakeFromNib();
      node= node.nextSibling;
    }
  },
  
  instantiateNibWithOwner: function(owner)
  {
    var oldDataModel= coherent.dataModel;
    var model= coherent.dataModel= new coherent.KVO();
    
    model.setValueForKey(owner, 'owner');
    model.setValueForKey(coherent.Application.shared, 'application');
  
    var v;
    var p;
    var ignore= coherent.KVO.typesOfKeyValuesToIgnore;
    var ctypeof= coherent.typeOf;
    var views= [];
    var awake= [];

    NIB.__currentNib= this;
    
    for (p in this.def)
    {
      //  Skip owner, because it's special
      if (p in this.SPECIAL_KEYS)
        continue;
  
      v= this.def[p];
      var type= ctypeof(v);

      if (v)
      {
        if ('function'===type && v.__factoryFn__)
        {
          v.__key= p;
          v.__nib= this;
          v= v.call(model);
        }
    
        if (v instanceof coherent.Asset)
          v= v.content();
    
        if ('array'===type || !(type in ignore || 'addObserverForKeyPath' in v))
          coherent.KVO.adaptTree(v);

        //  Remember all the views we've created, but don't add them to the list
        //  of things to awake, because we special process views.
        if (v instanceof coherent.View)
          views.push(v);
        else if ('awakeFromNib' in v)
          awake.push(v);
      }
      model.setValueForKey(v, p);
    }

    model.__views= views;

    //  Setup linkages to the special objects
    for (var key in this.SPECIAL_KEYS)
    {
      var specialDef= this.def[key];
      var special= model.valueForKey(key);
      
      if (!special)
        continue;
    
      for (p in specialDef)
      {
        v= specialDef[p];
        type= typeof(v);
        
        if ('function'===type && v.__factoryFn__)
        {
          v.__key= p;
          v= v.call(special);
        }
        special.setValueForKeyPath(v, p);
      }
    }

    var len= this.references.length;
    while (len--)
      this.references[len].resolve(model);
      
    len= awake.length;
    while (len--)
      awake[len].awakeFromNib();

    len= views.length;
    while (len--)
      this.__awakeViewsFromNib(views[len]);
    
    coherent.dataModel= oldDataModel;
    
    this.context= model;
    NIB.__currentNib= null;
  }
  
});

/** Creator for NIBs.
 */
function NIB(name, def)
{
  var nib= new coherent.Nib(name, def);
  nib.bundle= coherent.Bundle.__current;
  coherent.Bundle.__current.nibs[name]= nib;
}

Object.extend(NIB, {

  assetUrl: function(href)
  {
    return new coherent.Asset(href).href;
  },

  asset: function(href)
  {
    return new coherent.Asset(href);
  },
  
  withName: function(name)
  {
    return coherent.Bundle.mainBundle.nibs[name];
  },

  withNameInBundle: function(name, bundle)
  {
    return bundle.nibs[name];
  }
  
});

window.NIB= NIB;