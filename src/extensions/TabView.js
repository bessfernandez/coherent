/*jsl:import ../ui.js*/

coherent.TabView= Class.create(coherent.View, {

  exposedBindings: ['selectedIndex', 'selectedLabel'],
  
  __createTabMarkup: function(viewController)
  {
    var doc= this.node.ownerDocument;
    var li= doc.createElement('li');
    li.className= coherent.Style.kTabViewLabel;
    var extraClassName= viewController.valueForKey('tabLabelClassName');
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
    this.tabs= Element.query(node, '.' + coherent.Style.kTabViewLabelContainer);
    this.contents= Element.query(node, '.' + coherent.Style.kTabViewContentContainer);
    
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
      div.className= coherent.Style.kTabViewContent;
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
