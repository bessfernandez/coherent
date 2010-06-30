/*jsl:import coherent*/

/** A view that manages a subview.

    @property {coherent.SlidingTrackView.States} initialState
 */
coherent.SlidingTrackView = Class.create(coherent.View, {
    
    removeExtraNodes: true,
    
    init: function()
    {
        if (6==coherent.Browser.IE)
            return;
        
        var node= this.node;
        var itemNode = node.children[0];
        
        if (this.removeExtraNodes)
        {
            itemNode= node.removeChild(itemNode);
            node.innerHTML="";
            node.appendChild(itemNode);
        }
        
        this._item = coherent.View.fromNode(itemNode) || new coherent.View(itemNode);
    
        // Setup initial state
        this._viewport = Element.getViewport();
        this._trackFrame = Element.getRect(node, true);
        this._itemFrame = Element.getRect(itemNode, true);
    
        this.setState(this.initialState||coherent.SlidingTrackView.States.PINNED_TOP);
        this.updateItemPosition();
    
        this._item.addObserverForKeyPath(this, this.itemFrameChanged, 'frame');
        Event.observe(window, 'resize', this.viewportResized.bind(this));
        Event.observe(window, 'scroll', this.viewportScrolled.bind(this));
        Event.observe(window, 'load', this.viewportResized.bind(this));
    },

    viewportResized: function(e)
    {
        this._viewport = Element.getViewport();
    
        // Safari 3.2 and 4 have trouble redrawing this._item during a
        // window resize while in the FLOATING state. This includes
        // resizing the item in updateItemPosition, in addition to
        // adjusting to a new window size. Momentarily reverting the state
        // back to PINNED_TOP fixes this problem.
        if (coherent.Browser.Safari)
            this.setState(coherent.SlidingTrackView.States.PINNED_TOP);
    
        // Check for a narrow window (one with horizontal scrolling). We
        // will force PINNED_TOP if the window is too narrow.
        if (coherent.Browser.IE)
            this._narrow = document.documentElement.clientWidth < document.body.scrollWidth;
        else
            this._narrow = document.documentElement.clientWidth < document.documentElement.scrollWidth;

        this.viewportScrolled();
    },

    viewportScrolled: function()
    {
        var node= this.node;
        this._viewport = Element.getViewport();
        this._trackFrame = Element.getRect(node, true);
        this._itemFrame = Element.getRect(this._item.node, true);

        //  Safari doesn't seem to like position:fixed
        if (this.__currentState===coherent.SlidingTrackView.States.FLOATING &&
            coherent.Browser.Safari)
        {
            node.style.display='none';
            node.offsetTop;
            node.style.display='';
        }
        this.updateItemPosition();
    },

    updateItemPosition: function()
    {
        // Resize the frame if we can
        if ('willResizeFrame' in this._item)
        {
            var constrainedFrame = Object.applyDefaults({}, this._itemFrame);
            constrainedFrame.top = Math.max(0, this._trackFrame.top);
            constrainedFrame.bottom = Math.min(this._trackFrame.bottom, this._viewport.height);
            constrainedFrame.height = constrainedFrame.bottom - constrainedFrame.top;
        
            // NOTE: constrainedFrame is the frame of the visible track on
            // the page, which we will attempt to resize the item to.
            // 
            // resizeFrame must return the frame of the item's new size.
            // If the item has a minimum size it enforces upon itself, the
            // returned frame can be larger than constrainedFrame. Also, if
            // constrainedFrame is larger than the item cares to be, it
            // need not resize to the full size.
            if (this._item.willResizeFrame(constrainedFrame))
                this._itemFrame = this._item.resizeFrame(constrainedFrame);
        }

        // Switch states if necessary. See STATE_SWITCHERS for state logic
        this.updateState();
    },

    itemFrameChanged: function(change, keypath, context)
    {
        this._itemFrame = change.newValue;
        this.updateItemPosition();
    },

    updateState: function()
    {
        var newState= this.__currentState;
        var STATES=coherent.SlidingTrackView.States;
        
        switch (this.__currentState)
        {
            case STATES.PINNED_TOP:
                // In order to switch to either state from PINNED_TOP, the
                // track top must be out of view and we must have enough room
                // in the viewport to display the item.
                if (this._narrow || this._trackFrame.top > 0 ||
                    this._viewport.height < this._itemFrame.height)
                    break;
                    
                // If the track bottom offers less space than we have for
                // the item, pin to bottom
                if (this._trackFrame.bottom < this._itemFrame.height)
                    newState= STATES.PINNED_BOTTOM;
                else
                    // Otherwise, we can float now
                    newState=  STATES.FLOATING;
                break;
                
            case STATES.FLOATING:
                // If the viewport is too small for the item, or the top of the
                // track is in view, pin to top.
                if (this._narrow || this._trackFrame.top > 0 ||
                    this._viewport.height < this._itemFrame.height)
                    newState= STATES.PINNED_TOP;
                // If we've reached the bottom of the track, pin to bottom.
                else if (this._trackFrame.bottom < this._itemFrame.bottom)
                    newState= STATES.PINNED_BOTTOM;
                break;
                
            case STATES.PINNED_BOTTOM:
                // If the viewport is too small for the item, pin to top
                if (this._narrow || this._viewport.height < this._itemFrame.height)
                    newState= STATES.PINNED_TOP;
                // If the top of the item is within view, start floating
                else if (this._viewport.height<this._trackFrame.bottom && this._itemFrame.top > 0)
                    newState= STATES.FLOATING;
                break;
            
            default:
                throw new Error("Unknown state: " + this.__currentState);
        }

        if (this.__currentState!=newState)
            this.setState(newState);
    },

    state: function()
    {
        return this.__currentState;
    },
    
    setState: function(newState)
    {
        if (newState===this.__currentState)
            return;
    
        var view = this.node;
        Element.updateClass(view, newState, this.__currentState||"");
    
        this.__currentState= newState;
        
        var delegate= this.delegate();

        if (delegate && delegate.trackViewStateChanged)
            delegate.trackViewStateChanged(this, newState);
    }

});

/** These are the states the item within a SlidingTrackView may be in.
 */
coherent.SlidingTrackView.States= {
    /** When pinned to the top, the item should remain at the top of the
        track. This requires a complementary portion of CSS for the item
        with either `position: static`, `position: absolute; top: 0` or
        similar.
     */
    PINNED_TOP:    'pinned-top',
    
    /** When floating, the item should appear to remain in the same spot
        while the rest of the page scrolls. This may be implemented using
        setting `position: fixed` on the item within the track.
     */
    FLOATING:      'floating',
    
    /** When pinned to the bottom, the item should scroll with the page and
        remain at the bottom of the track. The best way to implement this in
        CSS is to set a rule `position: absolute; bottom: 0;` on the item
        node.
     */
    PINNED_BOTTOM: 'pinned-bottom'        
};
