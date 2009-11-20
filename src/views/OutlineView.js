/*jsl:import View.js*/

/** An outline view */
coherent.OutlineView= Class.create(coherent.View, {

    animationOptions: {
        selection: {
            classname: coherent.Style.kSelectedClass
        }
    },

    exposedBindings: ['content', 'selectedObject', 'selectedObjects'],
    
    childrenKeyPath: 'children',
    disclosureButtonClassName: coherent.Style.kOutlineDisclosureButton,
    
    init: function()
    {
        //  Call base init
        this.base();

        this.__content= [];
        this.__rootItem= null;
        this.__selectedObjects= [];
        this.__objectToItemMap= {};
        this.__nodeToItemMap= {};
        
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
            throw new Error('No view template specified for OutlineView');
        
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

    newItemForRepresentedObject: function(representedObject, parentItem)
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
        item.parent= parentItem;
        item.level= parentItem ? parentItem.level+1 : 1;
        item.expanded= false;
        if (this.leafKeyPath)
            item.leaf= !!representedObject.valueForKeyPath(this.leafKeyPath);
        else
            item.leaf= (0===(representedObject.valueForKeyPath(this.childrenKeyPath)||[]).length);

        item.view= this.viewTemplate(node, null);
        item.node= node||item.view.node;
        item.hasDisclosureButton= Element.query(item.node, "." + this.disclosureButtonClassName);
        
        this.__objectToItemMap[representedObject.__uid]= item;
        this.__nodeToItemMap[item.node.id]= item;
            
        Element.addClassName(item.node, coherent.Style.kOutlineLevelPrefix + item.level);
        
        if (item.leaf)
            Element.addClassName(item.node, coherent.Style.kOutlineLeaf);
        
        coherent.dataModel= oldDataModel;
        
        return item;
    },
    
    updateItemWithRepresentedObject: function(item, representedObject)
    {
        item.willChangeValueForKey('leaf');
        item.willChangeValueForKey('representedObject');
        item.willChangeValueForKey('expanded');
        
        if (item.expanded)
            this.__collapseItem(item);

        item.representedObject= representedObject;
        
        if (this.leafKeyPath)
            item.leaf= !!representedObject.valueForKeyPath(this.leafKeyPath);
        else
            item.leaf= (0===(representedObject.valueForKeyPath(this.childrenKeyPath)||[]).length);

        if (item.leaf)
            Element.addClassName(item.node, coherent.Style.kOutlineLeaf);
        else
            Element.removeClassName(item.node, coherent.Style.kOutlineLeaf);
            
        item.didChangeValueForKey('leaf');
        item.didChangeValueForKey('representedObject');
        item.didChangeValueForKey('expanded');
    },
    
    observeNodeChildrenChange: function(change)
    {
        var item= this.__objectToItemMap[change.object.__uid];
        
        //  Completely replace all the existing children
        if (coherent.ChangeType.setting===change.changeType)
        {
            this.__updateChildrenForItem(item, change.newValue);
            return;
        }
        
        
        var container= this.container();
        var indexes= change.indexes;
        var items= item.childNodes;
        var len= indexes.length;

        var beforeNode;
        var nodeIndex;
        var index;
        
        switch (change.changeType)
        {
            //  Add some children
            case coherent.ChangeType.insertion:
                var parentNode= item.parentNode;
                var lastNode;
                var newItems;
                
                if (parentNode)
                {
                    var itemIndex= parentNode.childNodes.indexOf(item);
                    var sibling= parentNode.childNodes[itemIndex+1];
                    lastNode= sibling?sibling.node:null;
                }
                
                newItems= change.newValue.map(function(child) {
                                    return this.newItemForRepresentedObject(child, item);
                                }, this);
                
                //  add the specific indexes.
                for (index=0; index<len; ++index)
                {
                    nodeIndex= indexes[index];
                    beforeNode= nodeIndex<len ? items[nodeIndex].node : lastNode;
                    container.insertBefore(newItems[index].node, beforeNode);
                }
                items.insertObjectsAtIndexes(newItems, indexes);
                break;
                
            //  Replace some children
            case coherent.ChangeType.replacement:
                for (index=0; index<len; ++index)
                    this.updateItemWithRepresentedObject(items[indexes[index]], change.newValue[index]);
                break;
            
            //  Delete some children
            case coherent.ChangeType.deletion:
                indexes.sort(coherent.reverseCompareNumbers);
                for (index=0; index<len; ++index)
                {
                    nodeIndex= indexes[index];
                    this.__disposeItem(items[nodeIndex]);
                }
                items.removeObjectsAtIndexes(indexes);
                break;
            
            case coherent.ChangeType.validationError:
                /*  @TODO: What's the correct thing to do when a child of a
                    node is not valid? Probably should apply a class name to the
                    view...
                 */
                break;
                
            default:
                throw new Error("Unknown change type: " + change.changeType);
        }
    },
    
    __disposeItem: function(item)
    {
        this.removeChild(item.node);
        delete this.__objectToItemMap[item.representedObject.__uid];
        delete this.__nodeToItemMap[item.node.id];
        
        var index= this.__selectedObjects.indexOf(item.representedObject);
        if (-1!==index)
            this.__selectedObjects.removeObjectAtIndex(index);
        
        if (!item.expanded)
            return;
            
        item.expanded= false;    
        item.representedObject.removeObserverForKeyPath(this, this.childrenKeyPath);
        item.childNodes.forEach(this.__disposeItem, this);
        item.childNodes= null;
    },
    
    __updateChildrenForItem: function(item, newChildren)
    {
        var container= this.container();
        var childNodes= item.childNodes;
        
        // var newChildren= item.representedObject.valueForKeyPath(this.childrenKeyPath);
        
        var numberOfChildNodes= childNodes.length;

        var newChildrenLength= newChildren.length;
        var numberToReuse= Math.min(numberOfChildNodes, newChildrenLength);
        
        var i=0;
        var child;
        
        while (i<numberToReuse)
        {
            this.updateItemWithRepresentedObject(childNodes[i], newChildren[i]);
            ++i;
        }
        
        //  Create new wrapper childs for new content childs
        if (i<newChildrenLength)
        {
            var frag= document.createDocumentFragment();
            
            while (i<newChildrenLength)
            {
                child= this.newItemForRepresentedObject(newChildren[i], item);
                childNodes.push(child);
                frag.appendChild(child.node);
                ++i;
            }

            container.appendChild(frag);
        }
        else
        {
            while (i<numberOfChildNodes)
            {
                this.__disposeItem(childNodes[i]);
                ++i;
            }
            
            //  trim content array
            childNodes.length= newChildrenLength;
        }
    },
        
    __collapseItem: function(item)
    {
        if (!item || item.leaf || !item.expanded)
            return;
            
        item.expanded= false;
        item.representedObject.removeObserverForKeyPath(this, this.childrenKeyPath);

        Element.removeClassName(item.node, coherent.Style.kOutlineExpanded);
        
        item.childNodes.forEach(this.__disposeItem, this);
        item.childNodes= null;
    },
    
    __expandItem: function(item)
    {
        if (!item || item.leaf || item.expanded)
            return;
        
        item.expanded= true;
        item.representedObject.addObserverForKeyPath(this, 'observeNodeChildrenChange', this.childrenKeyPath);
        
        var children= item.representedObject.valueForKeyPath(this.childrenKeyPath);
        var frag= document.createDocumentFragment();
        
        function makeChildItem(child)
        {
            var childItem= this.newItemForRepresentedObject(child, item);
            frag.appendChild(childItem.node);
            return childItem;
        }
        
        item.childNodes= children.map(makeChildItem, this);

        var container= this.container();
        container.insertBefore(frag, item.node.nextSibling);
        Element.addClassName(item.node, coherent.Style.kOutlineExpanded);
    },
    
    content: function()
    {
        return this.__content;
    },
    
    setContent: function(newContent)
    {
        if (this.__rootItem)
            this.__disposeItem(this.__rootItem);
            
        this.__rootItem= newContent ? this.newItemForRepresentedObject(newContent) : null;
        this.__content= newContent;

        var container= this.container();
        if (this.__rootItem)
            container.appendChild(this.__rootItem.node);
    },

    selectedObject: function()
    {
        return this.__selectedObjects[0];
    },
    
    setSelectedObject: function(newSelectedObject)
    {
        this.setSelectedObjects(newSelectedObject ? [newSelectedObject] : []);
    },
    
    selectedObjects: function()
    {
        return this.__selectedObjects;
    },
    
    setSelectedObjects: function(newSelectedObjects)
    {
        var animationOptions= this.__animationOptionsForProperty('selection');

        function unselectViewForObject(object)
        {
            var item= this.__objectToItemMap[object.__uid];
            item.selected= false;
            item.view.animateClassName(animationOptions, !item.selected);
        }
        
        function selectViewForObject(object)
        {
            var item= this.__objectToItemMap[object.__uid];
            item.selected= true;
            item.view.animateClassName(animationOptions, !item.selected);
        }
        
        if (newSelectedObjects)
            newSelectedObjects= newSelectedObjects.concat();
        else
            newSelectedObjects= [];
            
        this.__selectedObjects.forEach(unselectViewForObject, this);
        this.__selectedObjects= newSelectedObjects;
        this.__selectedObjects.forEach(selectViewForObject, this);
    },
    
    infoFromEvent: function(event)
    {
        var e = event.target||event.srcElement;
        var container= this.container();
        var disclosure= false;
        
        if (e===container)
            return null;
            
        while (e && e.parentNode!=container)
        {
            if (Element.hasClassName(e, this.disclosureButtonClassName))
                disclosure= true;
            e = e.parentNode;
        }
        
        if (e===container)
            return null;
        
        return {
            node: e,
            disclosure: disclosure
        };
    },
    
    /** Handle click events for items within the view. This supports multiple
        and discontiguous selection.
     */
    onclick: function(event)
    {
        var node= this.node;

        //  When the OutlineView is disabled, pass the click event up the Responder
        //  chain to see if anyone up above would like to handle it.
        if (node.disabled)
        {
            this.base(event);
            Event.stop(event);
            return;
        }
        
        var info= this.infoFromEvent(event);
        if (!info)
            return;

        var item= this.__nodeToItemMap[info.node.id];
        if (!item.leaf && (!item.hasDisclosureButton || info.disclosure))
        {
            var numberSelected= this.__selectedObjects.length;
            
            if (item.expanded)
                this.__collapseItem(item);
            else
                this.__expandItem(item);
            
            if (this.__selectedObjects.length!==numberSelected)
            {
                if (this.bindings.selectedObject)
                    this.bindings.selectedObject.setValue(this.__selectedObjects[0]);
                if (this.bindings.selectedObjects)
                    this.bindings.selectedObjects.setValue(this.__selectedObjects);
            }

            Event.preventDefault(event);
            return;
        }

        this.setSelectedObjects([item.representedObject]);
            
        if (this.bindings.selectedObject)
            this.bindings.selectedObject.setValue(item.representedObject);
        if (this.bindings.selectedObjects)
            this.bindings.selectedObjects.setValue([item.representedObject]);
        
        //  Send the action to let the target know a selection was made
        this.sendAction();
    }
    
});