/*jsl:import FormControl.js*/

coherent.PopupList= Class.create(coherent.FormControl, {

    exposedBindings: ['content', 'contentObjects', 'contentValues', 'selectedIndex',
                      'selectedObject', 'selectedValue'],

    constructor: function(view, parameters)
    {
        this.base(view, parameters);
        this.__content= [];
        this.__selectedIndex= -1;
        this.__selectedValue= null;
        this.__selectedObject= null;
        //  The onchange event handler gets installed when focusing the control
        this.__onchangeHandler= this.onchange.bind(this);
    },
    
    /** Should the view accept being the first responder?
     */
    acceptsFirstResponder: function()
    {
        var view= this.viewElement();
    
        if (view.disabled || view.readOnly)
            return false;
        return true;
    },
    
    onchange: function(event)
    {
        var view= this.viewElement();
        var selectedIndex= view.selectedIndex;
     
        this.setSelectedIndex(selectedIndex);
        
        if (this.bindings.selectedIndex)
            this.bindings.selectedIndex.setValue(selectedIndex);
        if (this.bindings.selectedObject)
            this.bindings.selectedObject.setValue(this.selectedObject());
        if (this.bindings.selectedValue)
            this.bindings.selectedValue.setValue(this.selectedValue());
    },
    
    content: function()
    {
        return this.__content;
    },
    
    setContent: function(newContent)
    {
        //  create a copy of the array
        this.__content= newContent ? newContent.concat() : [];
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
                this.__content.replaceObjectsAtIndexes(change.newValue, change.indexes);
                this.__scheduleUpdate();
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
        this.__contentValues= newContentValues ? newContentValues.concat() : [];
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
                this.__contentValues.replaceObjectsAtIndexes(change.newValue, change.indexes);
                this.__scheduleUpdate();
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
        this.__contentObjects= newContentObjects ? newContentObjects.concat() : [];
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
                this.__contentObjects.replaceObjectsAtIndexes(change.newValue, change.indexes);
                this.__scheduleUpdate();
                break;
            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
    },

    selectedIndex: function()
    {
        return this.__selectedIndex;
    },
    
    setSelectedIndex: function(newIndex)
    {
        var content= this.content();
        var contentValues= this.contentValues() || content.valueForKey('description');
        var view= this.viewElement();
        
        this.__selectedIndex= Math.min(content.length-1, Math.max(-1, newIndex));
        view.selectedIndex= this.__selectedIndex;
        
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
        var view= this.viewElement;
        
        this.__selectedValue= newValue;

        var index= contentValues.indexOf(newValue);
        view.selectedIndex= this.__selectedIndex= index;
        
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
        var view= this.viewElement;
        
        this.__selectedObject= newObject;

        var index= content.indexOf(newObject);
        view.selectedIndex= this.__selectedIndex= index;
        
        if (-1===index)
            this.__selectedValue= null;
        else
            this.__selectedValue= contentValues[index];
    },
    
    __updateOptions: function()
    {
        if (this.__updateTimer)
        {
            window.clearTimeout(this.__updateTimer);
            this.__updateTimer= null;
        }
            
        var content= this.content() || [];
        var contentObjects= this.contentObjects() || content;
        var contentValues= this.contentValues() || content.valueForKey('description');
        
        var numberOfOptions= content.length;
        var view= this.viewElement();
        var o;
        
        //  clear all the old options
        view.innerHTML="";
        view.options.length= numberOfOptions;
        
        for (var i=0; i<numberOfOptions; ++i)
        {
            o= view.options[i];
            if (coherent.Browser.IE)
                o.innerText= contentValues[i];
            else
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
        
        view.selectedIndex= this.__selectedIndex;
    },
    
    __scheduleUpdate: function()
    {
        if (this.__updateTimer)
            return;
        this.__updateTimer= this.__updateOptions.bindAndDelay(this, 0);
    }
    
});

if (coherent.Browser.IE)
    Class.extend(coherent.PopupList, {

        onfocus: function(event)
        {
            var view= this.viewElement();
            Event.stopObserving(view, 'change', this.__onchangeHandler);
            Event.observe(view, 'change', this.__onchangeHandler);
        },
    
        onblur: function(event)
        {
            Event.stopObserving(this.viewElement(), 'change', this.__onchangeHandler);
        }
    
    });