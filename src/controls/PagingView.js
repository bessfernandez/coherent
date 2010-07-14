/*jsl:import ../ui.js*/

coherent.PagingView= Class.create(coherent.View, {

  exposedBindings: ['selectedIndex'],

  animationOptions: {
    selection: {
      classname: coherent.Style.kSelectedClass
    },
    next: {
      classname: coherent.Style.kNext
    },
    previous: {
      classname: coherent.Style.kPrevious
    }
  },
  
  init: function()
  {
    //  find all the DIVs within the slideshow container
    var container= this.container();
    var children= container.children;
    var len= children.length;
    var node;
    var selectedClass= coherent.Style.kSelectedClass;
    var view;
    var fromNode= coherent.View.fromNode;
    var View= coherent.View;
    
    var selectedNode= null;
    
    this.__selectedIndex= -1;
    
    while (len--)
    {
      node= children[len];
      view= fromNode(node) || new View(node);
      
      if (Element.hasClassName(node, selectedClass))
      {
        if (-1!==this.__selectedIndex)
        {
          console.log('SlideshowView#init: more than one slide selected');
          Element.removeClassName(selectedNode, selectedClass);
          selectedNode.style.display='none';
        }
        selectedNode= node;
        this.__selectedIndex= len;
      }
      else
        node.style.display= 'none';
    }
    
    if (-1==this.__selectedIndex)
    {
      this.__selectedIndex=0;
      node= children[0];
      node.style.display='';
      Element.addClassName(node, selectedClass);
    }
  },
  
  selectedIndex: function()
  {
    return this.__selectedIndex;
  },
  
  setSelectedIndex: function(selectedIndex)
  {
    if (this.__selectedIndex===selectedIndex || 'number'!==typeof(selectedIndex))
      return;

    var selectionOptions= this.__animationOptionsForProperty('selection');
    var fromNode= coherent.View.fromNode;
    var container= this.container();
    var view;

    if (-1===this.__selectedIndex)
    {
      view= fromNode(container.children[selectedIndex]);
      view.setVisible(true);
      view.animateClassName(selectionOptions);
      return;
    }

    var old= fromNode(container.children[this.__selectedIndex]);
    old.animateClassName(selectionOptions, true);

    if (-1===selectedIndex)
    {
      old.setVisible(false);
      return;
    }

    view= fromNode(container.children[selectedIndex]);
    view.animateClassName(selectionOptions);
    
    var nextOptions= this.__animationOptionsForProperty('next');
    var prevOptions= this.__animationOptionsForProperty('previous');

    if (selectedIndex > this.__selectedIndex)
    {
      prevOptions.callback= function()
      {
        old.node.style.display='none';
        Element.removeClassName(old.node, prevOptions.classname||prevOptions.add);
      }
      old.animateClassName(prevOptions, false);
      
      Element.addClassName(view.node, nextOptions.classname||nextOptions.add);
      view.node.style.display='';
      view.animateClassName(nextOptions, true);
    }
    else
    {
      nextOptions.callback= function()
      {
        old.node.style.display='none';
        Element.removeClassName(old.node, nextOptions.classname||nextOptions.add);
      }
      old.animateClassName(nextOptions, false);
      
      Element.addClassName(view.node, prevOptions.classname||prevOptions.add);
      view.node.style.display='';
      view.animateClassName(prevOptions, true);
    }
    
    this.__selectedIndex= selectedIndex;
  },
  
  currentSlide: function()
  {
  }

});