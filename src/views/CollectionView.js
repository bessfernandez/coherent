/*jsl:import View.js*/
/*jsl:import ../controllers/ArrayController.js*/

coherent.CollectionView= Class.create(coherent.View, {

    animationOptions: {
        selection: {
            classname: coherent.Style.kSelectedClass
        }
    },
    
    exposedBindings: ['content', 'selectionIndexes'],

    allowsEmptySelection: true,

    multiple: false,
    
    init: function()
    {
        //  Call base init
        this.base();

        this.__content= [];
        this.__items=[];
        this.__selectionIndexes= [];
    
        var node= this.node;
        var container;
        var templateNode;
        
        if ('TABLE'===node.tagName)
        {
            container= this.setContainer(node.tBodies[0]);
            templateNode= container.rows.length && container.rows[0];
        }
        else
        {
            container= this.container();
            templateNode= node.children[0];
        }

        if (templateNode)
            this.templateNode= Element.clone(templateNode);
        
        //  remove all children, can't use innerHTML on MSIE.
        while (container.firstChild)
            container.removeChild(container.firstChild);
        
        if (!this.viewTemplate)
            throw new Error('No view template specified for CollectionView');
        
        //  If the viewTemplate is specified as simply a class (rather than a
        //  factory function, via a declarative constructor), then convert it
        //  to a factory function. This makes the logic less complex later.
        if (this.viewTemplate && !this.viewTemplate.__factoryFn__)
            this.viewTemplate= this.viewTemplate();
    },

    /** Should the view accept being the first responder?
     */
    acceptsFirstResponder: function()
    {
        var node= this.node;
        return !(node.disabled || node.readOnly);
    },

    newItemForRepresentedObject: function(representedObject)
    {
        var oldDataModel= coherent.dataModel;
        var item= Object.clone(this.__context);
        
        item.initialiseKeyValueObserving();
        item.__keys= {};
        coherent.dataModel= item;
        
        var node;
        if (this.templateNode)
            node= Element.clone(this.templateNode);
        
        item.representedObject= representedObject;
        item.view= this.viewTemplate(node, null);
        item.node= node||item.view.node;

        coherent.dataModel= oldDataModel;
        
        return item;
    },
    
    content: function()
    {
        return this.__content;
    },
    
    setContent: function(newContent)
    {
        var container= this.container();

        this.__content= newContent= newContent ? newContent.concat() : [];
        
        var items= this.__items;
        var numberOfItems= items.length;

        var newContentLength= newContent.length;
        var numberToReuse= Math.min(numberOfItems, newContentLength);
        
        var i=0;
        var item;
        
        while (i<numberToReuse)
        {
            items[i].setValueForKey(newContent[i], 'representedObject');
            ++i;
        }
        
        //  Create new wrapper items for new content items
        if (i<newContentLength)
        {
            var frag= document.createDocumentFragment();
            
            while (i<newContentLength)
            {
                item= this.newItemForRepresentedObject(newContent[i]);
                items.push(item);
                frag.appendChild(item.node);
                ++i;
            }

            container.appendChild(frag);
        }
        else
        {
            while (i<numberOfItems)
            {
                this.removeChild(items[i].node);
                ++i;
            }
            
            //  trim content array
            items.length= newContentLength;
        }
    },

    observeContentChange: function(change)
    {
        if (change.changeType===coherent.ChangeType.setting)
        {
            this.setContent(change.newValue);
            return;
        }
        
        var container= this.container();
        var children= Array.from(container.children);
        var items= this.__items;
        var newItems;
        var index;
        var len= change.indexes.length;
        var beforeNode;
        var nodeIndex;
        var indexes= change.indexes;
        
        switch (change.changeType)
        {
            case coherent.ChangeType.insertion:
                newItems= change.newValue.map(this.newItemForRepresentedObject, this);
                
                //  add the specific indexes.
                for (index=0; index<len; ++index)
                {
                    nodeIndex= indexes[index];
                    beforeNode= nodeIndex<len ? items[nodeIndex].node : null;
                    container.insertBefore(newItems[index].node, beforeNode);
                }
                this.__content.insertObjectsAtIndexes(change.newValue, indexes);
                items.insertObjectsAtIndexes(newItems, indexes);
                break;

            case coherent.ChangeType.deletion:
                indexes.sort(coherent.reverseCompareNumbers);
                for (index=0; index<len; ++index)
                {
                    nodeIndex= indexes[index];
                    this.removeChild(items[nodeIndex].node);
                }
                items.removeObjectsAtIndexes(indexes);
                this.__content.removeObjectsAtIndexes(indexes);
                break;

            case coherent.ChangeType.replacement:
                for (index=0; index<len; ++index)
                {
                    items[indexes[index]].setValueForKey(change.newValue[index], 'representedObject');
                }
                this.__content.replaceObjectsAtIndexes(change.newValue, indexes);
                break;

            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
    },

    selectionIndexes: function()
    {
        return this.__selectionIndexes;
    },
    
    setSelectionIndexes: function(newSelectionIndexes)
    {
        var items= this.__items;
        var len= items.length;
        var index;
        var item;
        var selection;
        var nextSelected;
        var animationOptions= this.__animationOptionsForProperty('selection');
        
        if (newSelectionIndexes)
            this.__selectionIndexes= newSelectionIndexes.sort(coherent.compareNumbers);
        else
            this.__selectionIndexes= [];
        
        //  create a copy
        selection= this.__selectionIndexes.concat();
        nextSelected= selection.shift();
        
        for (index=0; index<len; ++index)
        {
            item= items[index];
            if ((item.selected= (index===nextSelected)))
                nextSelected= selection.shift();

            item.view.updateClassName(animationOptions, !item.selected);
        }
    },

    observeSelectionIndexesChange: function(change)
    {
        if (coherent.ChangeType.setting===change.changeType)
        {
            this.setSelectionIndexes(change.newValue);
            return;
        }
        
        var animationOptions= this.__animationOptionsForProperty('selection');
        var items= this.__items;
        var item;
        
        switch (change.changeType)
        {
            case coherent.ChangeType.insertion:
                this.__selectionIndexes.insertObjectsAtIndexes(change.newValue, change.indexes);
                change.newValue.forEach(function(i) {
                                    item= items[i];
                                    item.selected= true;
                                    item.view.updateClassName(animationOptions);
                                });
                break;
            case coherent.ChangeType.deletion:
                this.__selectionIndexes.removeObjectsAtIndexes(change.indexes);
                change.oldValue.forEach(function(i) {
                                    item= items[i];
                                    item.selected= false;
                                    item.view.updateClassName(animationOptions, true);
                                });
                break;
            case coherent.ChangeType.replacement:
                this.__selectionIndexes.replaceObjectsAtIndexes(change.newValue, change.indexes);
                change.oldValue.forEach(function(i) {
                                    item= items[i];
                                    item.selected= false;
                                    item.view.updateClassName(animationOptions, true);
                                });
                change.newValue.forEach(function(i) {
                                    item= items[i];
                                    item.selected= true;
                                    item.view.updateClassName(animationOptions);
                                });
                break;
            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
    },

    itemNodeFromEvent: function(event)
    {
        var e = event.target||event.srcElement;
        var container= this.container();
        
        if (e===container)
            return null;
            
        while (e && e.parentNode!=container)
            e = e.parentNode;
    
        if (e===container)
            return null;
        
        return e;
    },
    
    ontouchstart: function(event)
    {
        // get the row now instead of mouse down because it will be called after a delay.
        this.__touchedRow= this.itemNodeFromEvent(event);
    }, 
    
    onmousedown: function(event)
    {
        if (this.node.disabled)
            return;

        var node= (coherent.Support.Touches && this.__touchedRow) ||
                   this.itemNodeFromEvent(event);

        if (!node)
            return;
            
        this.__activeNode= node;
        Element.addClassName(node, coherent.Style.kActiveClass);
    },

    onmouseup: function(event)
    {
        if (this.node.disabled)
            return;
            
        if (this.__activeNode)
            Element.removeClassName(this.__activeNode, coherent.Style.kActiveClass);
        this.__activeNode= null;
    },

    ontouchmove: function(event)
    {
        if (this.node.disabled)
            return;
            
        if (this.__activeNode)
            Element.removeClassName(this.__activeNode, coherent.Style.kActiveClass);
        this.__activeNode= null;
        this.base(event);
    },
    
    /** Handle click events for items within the view. This supports multiple
     *  and discontiguous selection.
     */
    onclick: function(event)
    {
        var node= this.node;
        
        //  When the ListView is disabled, pass the click event up the Responder
        //  chain to see if anyone up above would like to handle it.
        if (node.disabled)
        {
            this.base(event);
            Event.stop(event);
            return;
        }
        
        var e= this.itemNodeFromEvent(event);
        if (!e)
            return;
            
        var container= this.container();
        var itemIndex= Array.from(container.children).indexOf(e);
        
        var selectionIndexes= this.selectionIndexes().concat();

        var ctrlKeyDown= event.ctrlKey || event.metaKey;
        var shiftKeyDown= event.shiftKey;
        
        this.extendIndex= itemIndex;
        
        if (ctrlKeyDown)
        {
            this.anchorIndex= itemIndex;
            
            var pos= selectionIndexes.indexOf(itemIndex);
            //  If itemIndex isn't already selected, select it.
            if (-1===pos)
            {
                if (this.multiple)
                    selectionIndexes.push(itemIndex);
                else
                    selectionIndexes= [itemIndex];
            }
            //  If it is selected, deselect it only if an empty selection is permitted or
            //  there are other items selected.
            else if (this.allowsEmptySelection || selectionIndexes.length>1)
                selectionIndexes.splice(pos, 1);
        }
        else if (shiftKeyDown && this.multiple)
            selectionIndexes= IndexRange(itemIndex, this.anchorIndex);
        else
            selectionIndexes= [this.anchorIndex= itemIndex];

        this.setSelectionIndexes(selectionIndexes);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
            
        //  Send the action to let the target know a selection was made
        this.sendAction();
    },

    /** Handle a keydown notification to update selection. If the view doesn't
     *  have the focus, then the view ignores key events. This event handler
     *  only processes KEY_UP_ARROW (cursor up) and KEY_DOWN_ARROW (cursor down) events.
     *  
     *  Keyboard selection without the shift key works according to the Mac
     *  standard (up selects the previous element or the last element in the
     *  collection if none are presently selected, down selects the next element
     *  or the first element in the collection if no elements are selected).
     *
     *  @TODO: Keyboard selection with the shift key works like Tiger but should
     *  be converted to work like Leopard.
     *  
     *  @param event    the HTML event object
     *  @returns false to indicate that this event has been handled
     **/
    onkeydown: function(event)
    {
        var node= this.node;
        if (node.disabled)
            return;

        //  Only need to trap up & down arrows
        var keyCode= event.keyCode;
        if (Event.KEY_UP_ARROW !== keyCode && Event.KEY_DOWN_ARROW !== keyCode)
            return;

        Event.stop(event);
        
        var selectionIndexes= this.selectionIndexes().concat();
        var maxIndex= this.__content.length-1;
        var hasSelection= selectionIndexes.length;
        var newIndex= this.extendIndex;

        if (Event.KEY_UP_ARROW==keyCode)
            newIndex= hasSelection ? Math.max(0, newIndex-1) : maxIndex;
        else
            newIndex= hasSelection ? Math.min(maxIndex, newIndex+1) : 0;

        if (newIndex===this.extendIndex)
            return;
        
        this.extendIndex= newIndex;
        
        if (hasSelection && this.multiple && event.shiftKey)
            selectionIndexes= IndexRange(this.anchorIndex, newIndex);
        else
            selectionIndexes= [this.anchorIndex= newIndex];

        //  Scroll the parent to make certain the new index can be seen
        var container= this.container();
        var item= container.children[newIndex];

        var scrollParent= Element.scrollParent(node);
        var scrollParentHeight= scrollParent.offsetHeight;

        var scrollTop= item.offsetTop - scrollParent.scrollTop;
        var itemHeight= item.offsetHeight;
        
        if (item.offsetParent !== container)
            scrollTop-= container.offsetTop;

        if (scrollTop<0)
            item.scrollIntoView(true);
        else if (scrollTop+itemHeight>scrollParentHeight)
            item.scrollIntoView(false);

        //  Update the selection indexes and binding
        this.setSelectionIndexes(selectionIndexes);
        if (this.bindings.selectionIndexes)
            this.bindings.selectionIndexes.setValue(selectionIndexes);
    }

});
