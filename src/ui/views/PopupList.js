/*jsl:import FormControl.js*/

/** A view that wraps the default browser popup list.

    @binding {coherent.KVO[]} content - The content to be displayed by the view.
  
    @binding {Any} contentObjects - An array of values that will be returned
            by the {@link #selectedObject} property and also used to fill out
            the value property that will be sent to a server should the popup
            list be submitted.
    
    @binding {Any} contentValues - An array containing the text that should be
            displayed for each item in the popup list.
    @binding {Number[]} selectionIndexes - The indexes of the selected items in
      the data array.

 */
coherent.PopupList= Class.create(coherent.FormControl, {

  exposedBindings: ['content', 'contentObjects', 'contentValues', 'selectedIndex',
                    'selectedObject', 'selectedValue'],

  constructor: function(node, parameters)
  {
    this.base(node, parameters);
    this.__content= [];
    this.__contentValues= [];
    this.__contentObjects= [];
    this.__selectedIndex= -1;
    this.__selectedValue= null;
    this.__selectedObject= null;
  },
  
  /** Should the view accept being the first responder?
   */
  acceptsFirstResponder: function()
  {
    var node= this.node;
    return !(node.disabled || node.readOnly);
  },
  
  onchange: function(event)
  {
    var node= this.node;
    var selectedIndex= node.selectedIndex;
   
    this.setSelectedIndex(selectedIndex);
    
    if (this.bindings.selectedIndex)
      this.bindings.selectedIndex.setValue(selectedIndex);
    if (this.bindings.selectedObject)
      this.bindings.selectedObject.setValue(this.selectedObject());
    if (this.bindings.selectedValue)
      this.bindings.selectedValue.setValue(this.selectedValue());
  },
  
  __findContentArrayController: function()
  {
    var binding= this.bindings.content;
    var parts= binding.keypath.split('.');
    var object= binding.object;
    var controller= object;
    
    var i, len= parts.length;
    
    for (i=0; i<len; ++i)
    {
      controller= controller.valueForKey(parts[i]);
      if (controller.newObject)
      {
        return this.__contentArrayController= controller;
      }
    }

    return null;
  },
  
  initialValueForContentBinding: function()
  {
    var controller= this.__findContentArrayController();
    
    if (!controller)
      return content;
    
    var contentKeyPathPlusDot= this.bindings.content.keypath + ".";
    var contentKeyPathPlusDotLen= contentKeyPathPlusDot.length;
    var bindings= this.bindings;
    
    var keypathForBinding= function(name)
    {
      var binding= bindings[name];
      if (!binding || !binding.shouldInitFromDOM() || !binding.keypath.beginsWith(contentKeyPathPlusDot))
        return null;
      return binding.keypath.substring(contentKeyPathPlusDotLen);
    };
    
    var content= [];
    
    var valueKeyPath= keypathForBinding('contentValues');
    var objectKeyPath= keypathForBinding('contentObjects');
    
    var node= this.node;
    var options= node.options;
    var len= options.length;
    var i;
    var o;
    var obj;

    this.__selectedIndex= node.selectedIndex;
    
    for (i=0; i<len; ++i)
    {
      o= options[i];
      obj= controller.newObject();
      if (valueKeyPath)
        obj.setValueForKeyPath(o.text, valueKeyPath);
      if (objectKeyPath)
        obj.setValueForKeyPath(o.value, objectKeyPath);
      content.push(obj);
    }

    controller.addObjects(content);
    
    //  deliberately return null, because adding the individual object has
    //  already updated the array controller associated with this view.
    return null;
  },
  
  initialValueForBinding: function(name)
  {
    switch (name)
    {
      case 'content':
        return this.initialValueForContentBinding();
      case 'contentValues':
      case 'contentObjects':
        //  return null to prevent updateBindings from actually setting the value
        return null;
      default:
        return this.valueForKey(name);
    }
  },
  
  content: function()
  {
    return this.__content;
  },
  
  setContent: function(newContent)
  {
    //  create a copy of the array
    this.__content= newContent ? newContent.copy() : [];
    this.__scheduleUpdate();
  },

  observeContentChange: function(change)
  {
    switch (change.changeType)
    {
      case coherent.ChangeType.setting:
        this.setContent(change.newValue);
        break;

      case coherent.ChangeType.insertion:
        this.__content.insertObjectsAtIndexes(change.newValue, change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.deletion:
        this.__content.removeObjectsAtIndexes(change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.replacement:
        this.__content.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.validationError:
        /*  There's no way to show the validation error here, so just
          ignore the notification.
         */
        break;

      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  },

  contentValues: function()
  {
    return this.__contentValues;
  },
  
  setContentValues: function(newContentValues)
  {
    //  create a copy of the array
    this.__contentValues= newContentValues ? newContentValues.copy() : [];
    this.__scheduleUpdate();
  },

  observeContentValuesChange: function(change)
  {
    switch (change.changeType)
    {
      case coherent.ChangeType.setting:
        this.setContentValues(change.newValue);
        break;

      case coherent.ChangeType.insertion:
        this.__contentValues.insertObjectsAtIndexes(change.newValue, change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.deletion:
        this.__contentValues.removeObjectsAtIndexes(change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.replacement:
        this.__contentValues.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.validationError:
        /*  Popup lists don't really have a way to show validation
            issues. So just ignore it.
         */
        break;

      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  },

  contentObjects: function()
  {
    return this.__contentObjects;
  },
  
  setContentObjects: function(newContentObjects)
  {
    //  create a copy of the array
    this.__contentObjects= newContentObjects ? newContentObjects.copy() : [];
    this.__scheduleUpdate();
  },

  observeContentObjectsChange: function(change)
  {
    switch (change.changeType)
    {
      case coherent.ChangeType.setting:
        this.setContentObjects(change.newValue);
        break;

      case coherent.ChangeType.insertion:
        this.__contentObjects.insertObjectsAtIndexes(change.newValue, change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.deletion:
        this.__contentObjects.removeObjectsAtIndexes(change.indexes);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.replacement:
        this.__contentObjects.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
        this.__scheduleUpdate();
        break;

      case coherent.ChangeType.validationError:
        /*  There's not much to do here with a validation error. One of
            the content objects is invalid. Boo hoo.
         */
        break;

      default:
        console.log("Unknown change type: "+change.changeType);
        break;
    }
  },

  selectedIndex: function()
  {
    return this.node.selectedIndex;
  },
  
  setSelectedIndex: function(newIndex)
  {
    var content= this.content();
    var contentValues= this.contentValues() || content.valueForKey('description');
    var node= this.node;
    
    this.__selectedIndex= Math.min(content.length-1, Math.max(-1, newIndex));
    node.selectedIndex= this.__selectedIndex;
    
    if (-1===this.__selectedIndex)
    {
      this.__selectedValue= null;
      this.__selectedObject= null;
    }
    else
    {
      this.__selectedObject= content[this.__selectedIndex];
      this.__selectedValue= contentValues[this.__selectedIndex];
    }
  },
  
  selectedValue: function()
  {
    return this.__selectedValue;
  },
  
  setSelectedValue: function(newValue)
  {
    var content= this.content();
    var contentValues= this.contentValues() || content.valueForKey('description');
    var node= this.node;
    
    this.__selectedValue= newValue;

    var index= contentValues.indexOf(newValue);
    node.selectedIndex= this.__selectedIndex= index;
    
    if (-1===index)
      this.__selectedObject= null;
    else
      this.__selectedObject= content[index];
  },

  selectedObject: function()
  {
    return this.__selectedObject;
  },
  
  setSelectedObject: function(newObject)
  {
    var content= this.content();
    var contentValues= this.contentValues() || content.valueForKey('description');
    var node= this.node;
    
    this.__selectedObject= newObject;

    var index= content.indexOf(newObject);
    node.selectedIndex= this.__selectedIndex= index;
    
    if (-1===index)
      this.__selectedValue= null;
    else
      this.__selectedValue= contentValues[index];
  },
  
  __updateOptions: function()
  {
    if (this.__updateTimer)
    {
      this.__updateTimer.cancel();
      this.__updateTimer=null;
    }

    var content= this.content() || [];
    var contentObjects= this.contentObjects() || content;
    var contentValues= this.contentValues() || content.valueForKey('description');
    
    var numberOfOptions= content.length;
    var node= this.node;
    var o;
    
    //  clear all the old options
    node.innerHTML="";
    node.options.length= numberOfOptions;
    
    for (var i=0; i<numberOfOptions; ++i)
    {
      o= node.options[i];
      o.innerText= contentValues[i];
      o.text= contentValues[i];
      o.value= String(contentObjects[i]);
      o.selected= false;
      
      if ((this.__selectedObject && content[i]===this.__selectedObject) ||
        (this.__selectedValue && contentObjects[i]===this.__selectedValue) ||
        (i===this.__selectedIndex))
      {
        this.__selectedIndex= i;
        this.__selectedValue= contentObjects[i];
        this.__selectedObject= content[i];
        o.selected= true;
      }
    }
    
    node.selectedIndex= this.__selectedIndex;
  },
  
  __scheduleUpdate: function()
  {
    if (this.__updateTimer)
      return;
    this.__updateTimer= Function.delay(this.__updateOptions, 0, this);
  }
  
});

if (!coherent.Support.ChangeBubbles)
  Class.extend(coherent.PopupList, {

    onfocus: function(event)
    {
      var node= this.node;
      Event.stopObserving(node, 'change', this.__onchangeHandler);
      this.__onchangeHandler= Event.observe(node, 'change', this.onchange.bind(this));
    },
  
    onblur: function(event)
    {
      Event.stopObserving(this.node, 'change', this.__onchangeHandler);
    }
  
  });