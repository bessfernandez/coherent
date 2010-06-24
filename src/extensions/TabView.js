/*jsl:import ../ui.js*/

coherent.TabView= Class.create(coherent.View, {

  tabItemContainerClassName: 'ui-tabview-tabs',
  tabItemClassName: 'ui-tabview-tab-item',
  tabContentClassName: 'ui-tabview-tab-content',
  tabContentContainerClassName: 'ui-tabview-tab-container',
  
  __createTabMarkup: function(viewController)
  {
    var doc= this.node.ownerDocument;
    var li= doc.createElement('li');
    li.className= this.tabItemClassName;
    var extraClassName= viewController.valueForKey('tabItemClassName');
    if (extraClassName)
      li.className+= ' ' + extraClassName;
      
    var tabAnchor= doc.createElement('a');
    tabAnchor.innerText= viewController.title();
    tabAnchor.href= '#' + Element.assignId(viewController.view().node);
    tabAnchor.tabIndex= -1;
    li.appendChild(tabAnchor);
        
    return li;
  },
  
  viewControllers: function()
  {
    return this.__viewControllers;
  },
  
  setViewControllers: function(viewControllers)
  {
    viewControllers= viewControllers ? viewControllers.copy() : [];

    var node= this.node;
    this.tabs= Element.query(node, '.' + this.tabItemContainerClassName);
    this.contents= Element.query(node, '.' + this.tabContentContainerClassName);
    
    //  clear out the old markup
    this.tabs.innerHTML= "";
    this.contents.innerHTML= "";
    this.__viewControllers= viewControllers;
    
    var itemsFrag= this.node.ownerDocument.createDocumentFragment();
    var contentsFrag= this.node.ownerDocument.createDocumentFragment();
    
    var len= viewControllers.length;
    var item;
    var controller;
    
    var oldDataModel= coherent.dataModel;
    coherent.dataModel= this.__context;

    for (var i=0; i<len; ++i)
    {
      controller= viewControllers[i];
      if (controller.__factoryFn__)
        controller= controller.call();
      item= this.__createTabMarkup(controller);
      item.__index= i;
      itemsFrag.appendChild(item);
      
      var div= node.ownerDocument.createElement('div');
      div.className= this.tabContentClassName;
      div.appendChild(controller.view().node);
      contentsFrag.appendChild(div);
    }

    coherent.dataModel= oldDataModel;
    
    this.contents.appendChild(contentsFrag);
    this.tabs.appendChild(itemsFrag);
    
    this.__selectedIndex=-1;
    this.setSelectedIndex(0);
  },
  
  selectedIndex: function()
  {
    return this.__selectedIndex;
  },
  
  setSelectedIndex: function(selectedIndex)
  {
    if (this.__selectedIndex===selectedIndex)
      return;
    
    var item;
    var container;
    var selectedClass= coherent.Style.kSelectedClass;
    
    if (-1!==this.__selectedIndex)
    {
      item= this.tabs.children[this.__selectedIndex];
      Element.removeClassName(item, selectedClass);
      container= this.contents.children[this.__selectedIndex];
      Element.removeClassName(container, selectedClass);
    }
    
    this.__selectedIndex= selectedIndex;
    
    if (-1!==this.__selectedIndex)
    {
      item= this.tabs.children[this.__selectedIndex];
      Element.addClassName(item, selectedClass);
      container= this.contents.children[this.__selectedIndex];
      Element.addClassName(container, selectedClass);
    }
  },
  
  selectedViewController: function()
  {
    var index= this.__selectedIndex;
    if (-1==index)
      return null;
      
    return this.__viewControllers[index];
  },
  
  setSelectedViewController: function(viewController)
  {
    var index= this.__viewControllers.indexOf(viewController);
    if (-1==index)
      return;
    this.setSelectedIndex(index);
  },
  
  onclick: function(event)
  {
    var target= event.target||event.srcElement;
    var node= this.node;
    
    while (target!=node)
    {
      if ('__index' in target)
      {
        this.setSelectedIndex(target.__index);
        Event.preventDefault(event);
        return;
      }
      target= target.parentNode;
    }
    
    this.base(event);
  }
  
});
