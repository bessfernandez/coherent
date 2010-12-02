/*jsl:import coherent*/

coherent.Toolbar= Class.create(coherent.View, {

  constructor: function(node, params)
  {
    this.base(node, params);
    this.node.setAttribute('role', 'toolbar');
  },
  
  items: function()
  {
    return this.__items;
  },

  templateNode: function()
  {
    if (this.__templateNode)
      return this.__templateNode;
      
    if (this.node.children.length)
      this.__templateNode= this.node.children[0].cloneNode(true);
    else
    {
      var templateTagName;
      
      // try to determine what kind of node to use
      switch (this.node.tagName)
      {
        case 'UL':
        case 'OL':
          templateTagName= 'li';
          break;
        
        case 'DIV':
          templateTagName= 'div';
          break;
          
        case 'SPAN':
        default:
          templateTagName= 'span';
          break;
      }
      
      this.__templateNode= document.createElement(templateTagName);
    }
    
    Element.addClassName(this.__templateNode.className, coherent.Style.ToolbarItem);
    
    //  Set up aria roles
    this.__templateNode.setAttribute('role', 'button');
    return this.__templateNode;
  },
  
  __viewForBarItem: function(barItem)
  {
    if (barItem.customView)
      return barItem.customView;
      
    var node= Element.clone(this.templateNode());

    var item= new coherent.KVO.Proxy(this.__context);
    
    var oldDataModel= coherent.dataModel;
    coherent.dataModel= item;

    item.setValueForKey(barItem, 'representedObject');
    
    var view= new coherent.View(node, {
                    barItem: barItem,
                    enabledBinding: 'representedObject.enabled',
                    textBinding: 'representedObject.text',
                    classBinding: 'representedObject._class',
                    action: 'toolbarButtonClicked',
                    target: this
                  });

    coherent.dataModel= oldDataModel;
    
    return view;
  },
  
  setItems: function(items)
  {
    if (!items || !items.length)
      return;

    var len= items.length;
    var item;
    var node= this.node;
    
    this.__items= [];
    //  clear out existing markup
    node.innerHTML= "";
    
    for (var i=0; i<len; ++i)
    {
      item= items[i];
      if (item && item.__factoryFn__)
        item= item.call(this);
      else if (!(item instanceof coherent.BarButtonItem))
        item= new coherent.BarButtonItem(item);

      this.__items.push(item);
      this.addSubview(this.__viewForBarItem(item));
    }
  },

  toolbarButtonClicked: function(sender)
  {
    console.log(sender.barItem);
  }
  
});
