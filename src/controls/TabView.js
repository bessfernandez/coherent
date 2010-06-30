/*jsl:import ../ui.js*/

coherent.TabView= Class.create(coherent.View, {

  exposedBindings: ['selectedIndex', 'selectedLabel'],
  
  init: function()
  {
    var node= this.node;
    this.tabs= Element.query(node, '.' + coherent.Style.kTabViewLabelContainer);
    this.contents= Element.query(node, '.' + coherent.Style.kTabViewContentContainer);
    
    this.tabs.setAttribute("role", "tablist");
  },
  
  __createTabMarkup: function(viewController)
  {
    var doc= this.node.ownerDocument;
    var node= viewController.view().node;
    
    var li= doc.createElement('li');
    li.className= coherent.Style.kTabViewLabel;
    var extraClassName= viewController.valueForKey('tabLabelClassName');
    if (extraClassName)
      li.className+= ' ' + extraClassName;
      
    var tabAnchor= doc.createElement('a');
    var anchorId= Element.assignId(tabAnchor);
    
    tabAnchor.innerText= viewController.title();
    tabAnchor.href= '#' + Element.assignId(node);
    tabAnchor.tabIndex= -1;
    tabAnchor.setAttribute("role", "tab");
    li.appendChild(tabAnchor);
    
    var div= doc.createElement('div');
    div.className= coherent.Style.kTabViewContent;
    div.setAttribute("role", "tabpanel");
    div.setAttribute("aria-labelledby", anchorId);
    div.appendChild(node);
    
    return [li, div];
  },
  
  viewControllers: function()
  {
    return this.__viewControllers;
  },
  
  setViewControllers: function(viewControllers)
  {
    viewControllers= viewControllers ? viewControllers.copy() : [];

    var node= this.node;
    this.tabs= Element.query(node, '.' + coherent.Style.kTabViewLabelContainer);
    this.contents= Element.query(node, '.' + coherent.Style.kTabViewContentContainer);
    
    //  clear out the old markup
    this.tabs.innerHTML= "";
    this.contents.innerHTML= "";
    this.__viewControllers= viewControllers;
    
    var itemsFrag= this.node.ownerDocument.createDocumentFragment();
    var contentsFrag= this.node.ownerDocument.createDocumentFragment();
    
    var len= viewControllers.length;
    var markup;
    var controller;
    
    var oldDataModel= coherent.dataModel;
    coherent.dataModel= this.__context;

    for (var i=0; i<len; ++i)
    {
      controller= viewControllers[i];
      if (controller.__factoryFn__)
        controller= controller.call();
      markup= this.__createTabMarkup(controller);
      markup[0].__index= i;
      
      itemsFrag.appendChild(markup[0]);
      contentsFrag.appendChild(markup[1]);
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
    var anchor;
    var container;
    var selectedClass= coherent.Style.kSelectedClass;
    
    if (-1!==this.__selectedIndex)
    {
      item= this.tabs.children[this.__selectedIndex];
      anchor= item.getElementsByTagName('a')[0];
      if (anchor)
        anchor.tabIndex=-1;
      Element.removeClassName(item, selectedClass);
      container= this.contents.children[this.__selectedIndex];
      Element.removeClassName(container, selectedClass);
    }
    
    this.__selectedIndex= selectedIndex;
    
    if (-1!==this.__selectedIndex)
    {
      item= this.tabs.children[this.__selectedIndex];
      anchor= item.getElementsByTagName('a')[0];
      if (anchor)
        anchor.tabIndex=0;
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
  
  selectedLabel: function()
  {
    var index= this.__selectedIndex;
    if (-1==index)
      return null;
    return this.__viewControllers[index].title();
  },

  setSelectedLabel: function(selectedLabel)
  {
    var controllers= this.__viewControllers;
    var len= controllers.length;
    
    while (len--)
    {
      if (controllers[len].title()!==selectedLabel)
        continue;
        
      this.setSelectedIndex(len);
      return;
    }
  },
  
  onclick: function(event)
  {
    var target= event.target||event.srcElement;
    var node= this.node;
    
    while (target!=node)
    {
      if ('__index' in target)
      {
        var index= target.__index;
        this.setSelectedIndex(index);

        if (this.bindings.selectedIndex)
          this.bindings.selectedIndex.setValue(index);
        if (this.bindings.selectedLabel)
          this.bindings.selectedLabel.setValue(this.__viewControllers[index].title());
          
        Event.preventDefault(event);
        return;
      }
      target= target.parentNode;
    }
    
    this.base(event);
  }
  
});
