/*jsl:import ../../ui.js*/

(function(){

    function num(px)
    {
        return parseInt(px||"",10)||0;
    }


    /** @constructor */
    coherent.DragAndDropHelper= function()
    {
    }
    
    coherent.DragAndDropHelper.prototype= /** @scope coherent.DragAndDropHelper */ {

        initFakeDragAndDrop: function(node, event)
        {
            var copy= Element.clone(node);
            var rect= Element.getRect(node, true);
            var styles= Element.getStyles(node, ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
                                                 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
                                                 'opacity']);
            copy.style.position= 'fixed';
            copy.style.top= rect.top + 'px';
            copy.style.left= rect.left + 'px';
            copy.style.width= (rect.width - num(styles.borderLeftWidth) - num(styles.borderRightWidth) - num(styles.paddingLeft) - num(styles.paddingRight)) + 'px';
            copy.style.heigh= (rect.height - num(styles.borderTopWidth) - num(styles.borderBottomWidth) - num(styles.paddingTop) - num(styles.paddingBottom)) + 'px';
        
            node.parentNode.appendChild(copy);
    
            this.node= copy;
            this.originalNode= node;
        
            this.offset= {
                    left: rect.left - event.clientX,
                    top: rect.top - event.clientY
                };
            
            this.classname= node.className;
            this.rect= rect;
            this.viewport= Element.getViewport();
            this.originalScroll= this.getScrollOffset(rect.left, rect.top);
        },

        getScrollOffset: function(left, top)
        {
            var scrollX;
            var scrollY;
            
            if (top<0)
                scrollY= top;
            else
            {
                scrollY= top+this.rect.height-this.viewport.height;
                if (scrollY<0)
                    scrollY=0;
            }
            if (left<0)
                scrollX= left;
            else
            {
                scrollX= left+this.rect.width-this.viewport.width;
                if (scrollX<0)
                    scrollX=0;
            }

            return {
                scrollX: scrollX,
                scrollY: scrollY
            };
        },
        
        emptyFn: function(){},
        
        onmousemove: function(event)
        {
            var left= (event.clientX + this.offset.left);
            var top= (event.clientY + this.offset.top);
            var node= this.node;
            
            node.style.left= left + 'px';
            node.style.top= top + 'px';
            
            var scrollOffset= this.getScrollOffset(left, top);
            if (!scrollOffset.scrollX)
                this.originalScroll.scrollX=0;
            if (!scrollOffset.scrollY)
                this.originalScroll.scrollY=0;
            
            var scrollX= !this.originalScroll.scrollX && scrollOffset.scrollX;
            var scrollY= !this.originalScroll.scrollY && scrollOffset.scrollY;
            window.scrollBy(scrollX, scrollY);
            
            //  determine which node we're over
            var oldDisplay= node.style.display;
            node.style.display='none';
            var overNode= Element.fromPoint(event.clientX, event.clientY);
            node.style.display=oldDisplay;
            
            var fakeEvent= {
                target: overNode,
                clientX: event.clientX,
                clientY: event.clientY,
                preventDefault: this.emptyFn,
                dataTransfer: event.dataTransfer||{}
            };
            if (overNode!==this.overNode)
            {
                coherent.page._ondragenter(fakeEvent);
                this.overNode= overNode;
            }
            else
                coherent.page._ondragover(fakeEvent);
                
            var classname= null;
            
            switch (coherent.page._draggingLastDropEffect)
            {
                case 'copy':
                    classname= coherent.Style.kDragAndDropCopy;
                    break;
                case 'move':
                    classname= coherent.Style.kDragAndDropMove;
                    break;
                case 'link':
                    classname= coherent.Style.kDragAndDropLink;
                    break;
                case 'none':
                default:
                    classname= coherent.Style.kDragAndDropNo;
                    break;
            }
            
            if (classname)
                node.className= this.classname + ' ' + classname;
            if (!coherent.Support.DragAndDrop)    
                Event.preventDefault(event);
        },
        
        cleanup: function()
        {
            if (this.node)
                this.node.parentNode.removeChild(this.node);
            this.node= null;
        },
        
        onmouseup: function(event)
        {
            this.cleanup();
            if (coherent.Support.DragAndDrop)
                return;
                
            var fakeEvent= {
                target: this.overNode,
                clientX: event.clientX,
                clientY: event.clientY,
                dataTransfer: {},
                preventDefault: this.emptyFn
            };
            coherent.page._ondrop(fakeEvent);
            coherent.page._ondragend(fakeEvent);
        }
        
    };
    
})();