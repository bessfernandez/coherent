/*jsl:import ../ui.js*/

(function(){

var HAS_3D= coherent.Support.CssMatrix,
    HAS_TOUCH= coherent.Support.Touches,
    MOBILE_SAFARI= coherent.Browser.MobileSafari,
    TRANSLATE_OPEN = 'translate' + (HAS_3D ? '3d(' : '('),
    TRANSLATE_CLOSE = HAS_3D ? ',0)' : ')',
    SCROLLBAR_FADE_DURATION= 300,
    TRANSITION_END_EVENT= 'webkitTransitionEnd',
    NO_MOMENTUM= { dist: 0, time: 0 };

var scrollbarID= 0;





coherent.ScrollView= Class.create(coherent.View, {

  pagingEnabled: false,
  bounces: HAS_3D,
  bouncesWhenContentFits: false,
  directionalLockEnabled: false,
  hasMomentum: HAS_3D,
  updateOnDOMChanges: true,
  scrollsToTopOnDOMChanges: false,
  hScrollbar: HAS_3D,
  vScrollbar: HAS_3D,
  fadeScrollbar: MOBILE_SAFARI || !HAS_TOUCH,
  shrinkScrollbar: MOBILE_SAFARI || !HAS_TOUCH,
  desktopCompatibility: false,
  indicatorStyle: null,
  
  constructor: function(node, parameters)
  {
    this.x= 0;
    this.y= 0;
    this.__items= [];

    this.base(node, parameters);
    this.wrapper = this.node.parentNode;

    
    //  Prevent bouncing when scrolling the page
    coherent.Page.shared.lockPage();
    
    var style= this.node.style;
    style.webkitTransitionProperty = '-webkit-transform';
    style.webkitTransitionTimingFunction = 'cubic-bezier(0,0,0.25,1)';
    style.webkitTransitionDuration = '0';
    style.webkitTransform = TRANSLATE_OPEN + '0,0' + TRANSLATE_CLOSE;

    this.indicatorStyle= this.indicatorStyle || coherent.ScrollView.IndicatorStyleDefault;

    this.wrapper.style.overflow = (HAS_TOUCH||this.desktopCompatibility) ? 'hidden' : 'auto';
  
    this.refresh();

    var eventName= coherent.Support.OrientationChangeEvent ? 'orientationchange' : 'resize';
    this._refreshHandler= Event.observe(window, eventName, this.refresh.bind(this));

    if (this.updateOnDOMChanges)
      this._updateHandler= Event.observe(this.node, 'DOMSubtreeModified',
                                         this.onDOMModified.bind(this));
  },
        
  onDOMModified: function(e)
  {
    if (e.target.parentNode != this.node)
      return;

    Function.delay(this.refresh, 0, this);

    if (this.scrollsToTopOnDOMChanges && (this.x!==0 || this.y!==0))
      this.scrollTo(0,0,'0');
  },

  refresh: function()
  {
    var resetX = this.x,
        resetY = this.y,
        snap;
    
    if (!this.wrapper || !this.node)
      return;
      
    this.viewportWidth = this.wrapper.clientWidth;
    this.viewportHeight = this.wrapper.clientHeight;
    this.contentWidth = this.node.offsetWidth;
    this.contentHeight = this.node.offsetHeight;
    this.maxScrollX = this.viewportWidth - this.contentWidth;
    this.maxScrollY = this.viewportHeight - this.contentHeight;
    this.directionX = 0;
    this.directionY = 0;

    if (this.scrollX)
    {
      if (this.maxScrollX >= 0)
        resetX = 0;
      else if (this.x < this.maxScrollX)
        resetX = this.maxScrollX;
    }

    if (this.scrollY)
    {
      if (this.maxScrollY >= 0)
        resetY = 0;
      else if (this.y < this.maxScrollY)
        resetY = this.maxScrollY;
    }

    // Snap
    if (this.pagingEnabled)
    {
      this.maxPageX = -Math.floor(this.maxScrollX/this.viewportWidth);
      this.maxPageY = -Math.floor(this.maxScrollY/this.viewportHeight);

      snap = this.calculatePagingSnap(resetX, resetY);
      resetX = snap.x;
      resetY = snap.y;
    }

    if (resetX!=this.x || resetY!=this.y)
    {
      this.setTransitionTime('0');
      this.setPosition(resetX, resetY, true);
    }
    
    this.scrollX = this.contentWidth > this.viewportWidth;
    this.scrollY = !this.bouncesWhenContentFits && !this.scrollX || this.contentHeight > this.viewportHeight;

    // Update horizontal scrollbar
    if (this.hScrollbar && this.scrollX)
    {
      this.scrollBarX = this.scrollBarX || new Scrollbar('horizontal', this.wrapper, this.fadeScrollbar, this.shrinkScrollbar, this.indicatorStyle);
      this.scrollBarX.init(this.viewportWidth, this.contentWidth);
    }
    else if (this.scrollBarX)
    {
      this.scrollBarX = this.scrollBarX.remove();
    }

    // Update vertical scrollbar
    if (this.vScrollbar && this.scrollY && this.contentHeight > this.viewportHeight)
    {
      this.scrollBarY = this.scrollBarY || new Scrollbar('vertical', this.wrapper, this.fadeScrollbar, this.shrinkScrollbar, this.indicatorStyle);
      this.scrollBarY.init(this.viewportHeight, this.contentHeight);
    }
    else if (this.scrollBarY)
    {
      this.scrollBarY = this.scrollBarY.remove();
    }
  },

  setPosition: function(x, y, hideScrollBars)
  {
    this.x = x;
    this.y = y;

    this.node.style.webkitTransform = TRANSLATE_OPEN + this.x + 'px,' + this.y + 'px' + TRANSLATE_CLOSE;

    // Move the scrollbars
    if (!hideScrollBars)
    {
      if (this.scrollBarX)
        this.scrollBarX.setPosition(this.x);
      if (this.scrollBarY)
        this.scrollBarY.setPosition(this.y);
    }
  },
        
  setTransitionTime: function(time)
  {
    var scrollBarTime= time ? (time+'ms') : '0';
    var wrapperTime= HAS_3D && this.fadeScrollbar ? (SCROLLBAR_FADE_DURATION+'ms') : '0';
    
  	this.node.style.webkitTransitionDuration = scrollBarTime;
    
    if (this.scrollBarX)
    {
      this.scrollBarX.bar.style.webkitTransitionDuration = scrollBarTime;
      this.scrollBarX.wrapper.style.webkitTransitionDuration = wrapperTime;
    }
    if (this.scrollBarY)
    {
      this.scrollBarY.bar.style.webkitTransitionDuration = scrollBarTime;
      this.scrollBarY.wrapper.style.webkitTransitionDuration = wrapperTime;
    }
  },
                
  onmousedown: function(e)
  {
    if (this.desktopCompatibility && !HAS_TOUCH)
      this.ontouchstart(e);
  },
  
  onmousedrag: function(e)
  {
    if (this.desktopCompatibility && !HAS_TOUCH)
      this.ontouchmove(e);
  },
  
  onmouseup: function(e)
  {
    if (this.desktopCompatibility && !HAS_TOUCH)
      this.ontouchend(e);
  },
  
  ontouchstart: function(e)
  {
    var matrix;
    
    if (!this.enabled())
      return;

    e.preventDefault();
    e.stopPropagation();
    
    this.dragging = true;

    this.moved = false;
    this.distX = 0;
    this.distY = 0;

    this.setTransitionTime(0);

    // Check if the scroller is really where it should be
    if (this.hasMomentum || this.pagingEnabled)
    {
      matrix = new WebKitCSSMatrix(window.getComputedStyle(this.node).webkitTransform);
      if (matrix.e != this.x || matrix.f != this.y)
      {
        //  TODO: Don't handle this on the document, it should be on the node itself
        Event.stopObserving(document, TRANSITION_END_EVENT, this._transitionHandler);
        this.setPosition(matrix.e, matrix.f);
        this.moved = true;
      }
    }

    this.touchStartX = HAS_TOUCH ? e.changedTouches[0].pageX : e.pageX;
    this.scrollStartX = this.x;

    this.touchStartY = HAS_TOUCH ? e.changedTouches[0].pageY : e.pageY;
    this.scrollStartY = this.y;

    this.scrollStartTime = e.timeStamp;

    this.directionX = 0;
    this.directionY = 0;
  },

  ontouchmove: function(e)
  {
    if (!this.dragging)
      return;

    var pageX = HAS_TOUCH ? e.changedTouches[0].pageX : e.pageX,
        pageY = HAS_TOUCH ? e.changedTouches[0].pageY : e.pageY,
        leftDelta = this.scrollX ? pageX - this.touchStartX : 0,
        topDelta = this.scrollY ? pageY - this.touchStartY : 0,
        newX = this.x + leftDelta,
        newY = this.y + topDelta;

    //e.preventDefault();
    // Stopping propagation just saves some cpu cycles (I presume)
    e.stopPropagation();

    this.touchStartX = pageX;
    this.touchStartY = pageY;

    // Slow down if outside of the boundaries
    if (newX >= 0 || newX < this.maxScrollX)
      newX = this.bounces ? Math.round(this.x + leftDelta / 3) : (newX >= 0 || this.maxScrollX>=0) ? 0 : this.maxScrollX;
    if (newY >= 0 || newY < this.maxScrollY)
      newY = this.bounces ? Math.round(this.y + topDelta / 3) : (newY >= 0 || this.maxScrollY>=0) ? 0 : this.maxScrollY;

    // 5 pixels threshold
    if (this.distX + this.distY > 5)
    {
      if (!this.moved)
        this.callDelegate('scrollViewWillBeginDragging');

      // Lock scroll direction
      if (this.directionalLockEnabled)
      {
        if (this.distX-3 > this.distY)
        {
          newY = this.y;
          topDelta = 0;
        }
        else if (this.distY-3 > this.distX)
        {
          newX = this.x;
          leftDelta = 0;
        }
      }
      this.setPosition(newX, newY);
      this.moved = true;
      this.directionX = leftDelta > 0 ? -1 : 1;
      this.directionY = topDelta > 0 ? -1 : 1;
      this.callDelegate('scrollViewDidScroll');
    }
    else
    {
      this.distX+= Math.abs(leftDelta);
      this.distY+= Math.abs(topDelta);
    }
  },
        
  ontouchend: function(e)
  {
    if (!this.dragging)
      return;

    var time = e.timeStamp - this.scrollStartTime,
        point = HAS_TOUCH ? e.changedTouches[0] : e,
        target,ev,
        momentumX= NO_MOMENTUM,
        momentumY= NO_MOMENTUM,
        newDuration = 0,
        newPositionX = this.x, newPositionY = this.y,
        snap;

    this.dragging = false;

    if (!this.moved)
    {
      this.resetPosition();

      if (HAS_TOUCH)
      {
        // Find the last touched element
        target = point.target;
        while (target.nodeType != 1)
          target = target.parentNode;

        // Create the fake event
        ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click', true, true, e.view, 1,
                          point.screenX, point.screenY,
                          point.clientX, point.clientY,
                          e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                          0, null);
        ev._fake = true;
        target.dispatchEvent(ev);
      }

      return;
    }

    // Prevent slingshot effect
    if (!this.pagingEnabled && time > 250)
    {
      this.resetPosition();
      return;
    }

    if (this.hasMomentum)
    {
      if (this.scrollX)
        momentumX= this.calculateMomentum(this.x - this.scrollStartX, time,
                                          this.bounces ? -this.x + this.viewportWidth/5 : -this.x,
                                          this.bounces ? this.x + this.contentWidth - this.viewportWidth + this.viewportWidth/5 : this.x + this.contentWidth - this.viewportWidth);

      if (this.scrollY)
        momentumY= this.calculateMomentum(this.y - this.scrollStartY, time,
                                          this.bounces ? -this.y + this.viewportHeight/5 : -this.y,
                                          this.bounces ? (this.maxScrollY < 0 ? this.y + this.contentHeight - this.viewportHeight : 0) + this.viewportHeight/5 : this.y + this.contentHeight - this.viewportHeight);

      // The minimum animation length must be 1ms
      newDuration = Math.max(Math.max(momentumX.time, momentumY.time), 1);
      newPositionX = this.x + momentumX.dist;
      newPositionY = this.y + momentumY.dist;
    }

    if (this.pagingEnabled)
    {
      snap = this.calculatePagingSnap(newPositionX, newPositionY);
      newPositionX = snap.x;
      newPositionY = snap.y;
      newDuration = Math.max(snap.time, newDuration);
    }

    //  Call the delegate method scrollViewDidEndDragging with a flag indicating
    //  whether the scroll will decelerate
    this.callDelegate('scrollViewDidEndDragging', [newDuration>0]);
    this.scrollTo(newPositionX, newPositionY, newDuration);
  },

  ontransitionend: function()
  {
    //  TODO: This should be on the node, not the document
    Event.stopObserving(document, TRANSITION_END_EVENT, this._transitionHandler);
    this.resetPosition();
  },

  resetPosition: function()
  {
    var resetX = this.x,
        resetY = this.y;

    if (this.x >= 0)
      resetX = 0;
    else if (this.x < this.maxScrollX)
      resetX = this.maxScrollX;

    if (this.y >= 0 || this.maxScrollY > 0)
      resetY = 0;
    else if (this.y < this.maxScrollY)
      resetY = this.maxScrollY;
    
    if (resetX != this.x || resetY != this.y)
      this.scrollTo(resetX, resetY);
    else
    {
      if (this.moved)
      {
        // this.onScrollEnd();             // Execute custom code on scroll end
        this.moved = false;
      }

      // Hide the scrollbars
      if (this.scrollBarX)
        this.scrollBarX.hide();
      if (this.scrollBarY)
        this.scrollBarY.hide();
    }
  },
        
  calculatePagingSnap: function(x, y)
  {
    var  time;

    if (this.directionX > 0)
      x = Math.floor(x/this.viewportWidth);
    else if (this.directionX < 0)
      x = Math.ceil(x/this.viewportWidth);
    else
      x = Math.round(x/this.viewportWidth);

    this.pageX = -x;
    x = x * this.viewportWidth;

    if (x > 0)
      x = this.pageX = 0;
    else if (x < this.maxScrollX)
    {
      this.pageX = this.maxPageX;
      x = this.maxScrollX;
    }

    if (this.directionY > 0)
      y = Math.floor(y/this.viewportHeight);
    else if (this.directionY < 0)
      y = Math.ceil(y/this.viewportHeight);
    else
      y = Math.round(y/this.viewportHeight);

    this.pageY = -y;
    y = y * this.viewportHeight;

    if (y > 0)
      y = this.pageY = 0;
    else if (y < this.maxScrollY)
    {
      this.pageY = this.maxPageY;
      y = this.maxScrollY;
    }

    // Snap with constant speed (proportional duration)
    time = Math.round(Math.max(Math.abs(this.x - x) / this.viewportWidth * 500,
                               Math.abs(this.y - y) / this.viewportHeight * 500));

    return { x: x, y: y, time: time };
  },

  scrollTo: function(destX, destY, runtime)
  {
    if (this.x == destX && this.y == destY)
    {
      this.resetPosition();
      return;
    }

    this.moved = true;
    this.setTransitionTime(runtime || 350);
    this.setPosition(destX, destY);

    if (!runtime)
      this.resetPosition();
    else
      //  At the end of the transition check if we are still inside of the boundaries
      //  TODO: This should probably get attached to the node not the document
      this._transitionHandler= Event.observe(document, TRANSITION_END_EVENT, this.ontransitionend.bind(this));
  },
        
  scrollToPage: function(pageX, pageY, runtime)
  {
    var snap;

    if (!this.pagingEnabled)
    {
      this.pageX = -Math.round(this.x / this.viewportWidth);
      this.pageY = -Math.round(this.y / this.viewportHeight);
    }

    if (pageX == 'next')
      pageX = ++this.pageX;
    else if (pageX == 'prev')
      pageX = --this.pageX;

    if (pageY == 'next')
      pageY = ++this.pageY;
    else if (pageY == 'prev')
      pageY = --this.pageY;

    pageX = -pageX*this.viewportWidth;
    pageY = -pageY*this.viewportHeight;

    snap = this.calculatePagingSnap(pageX, pageY);
    pageX = snap.x;
    pageY = snap.y;

    this.scrollTo(pageX, pageY, runtime || 500);
  },

  scrollToElement: function(el, runtime)
  {
    el = (typeof(el) == 'object') ? el : Element.query(this.node, el);

    if (!el)
      return;

    var x = this.scrollX ? -el.offsetLeft : 0,
        y = this.scrollY ? -el.offsetTop : 0;

    if (x >= 0)
      x = 0;
    else if (x < this.maxScrollX)
      x = this.maxScrollX;

    if (y >= 0)
      y = 0;
    else if (y < this.maxScrollY)
      y = this.maxScrollY;

    this.scrollTo(x, y, runtime);
  },

  calculateMomentum: function(dist, time, maxDistUpper, maxDistLower)
  {
    var friction = 2.5,
        deceleration = 1.2,
        speed = Math.abs(dist) / time * 1000,
        newDist = speed * speed / friction / 1000,
        newTime = 0;

    // Proportinally reduce speed if we are outside of the boundaries 
    if (dist > 0 && newDist > maxDistUpper)
    {
      speed = speed * maxDistUpper / newDist / friction;
      newDist = maxDistUpper;
    }
    else if (dist < 0 && newDist > maxDistLower)
    {
      speed = speed * maxDistLower / newDist / friction;
      newDist = maxDistLower;
    }
    
    newDist = newDist * (dist < 0 ? -1 : 1);
    newTime = speed / deceleration;

    return { dist: Math.round(newDist), time: Math.round(newTime) };
  },
        
  teardown: function()
  {
    this.base();
    
    coherent.Page.shared.unlockPage();
    
    var eventName= coherent.Support.OrientationChangeEvent ? 'orientationchange' : 'resize';
    Event.stopObserving(window, eventName, this._refreshHandler);
    //  TODO: This should be attached the the node not the document
    Event.stopObserving(document, TRANSITION_END_EVENT, this._transitionHandler);

    if (this.updateOnDOMChanges)
      Event.stopObserving(this.node, 'DOMSubtreeModified', this._updateHandler);

    if (this.scrollBarX)
      this.scrollBarX = this.scrollBarX.remove();

    if (this.scrollBarY)
      this.scrollBarY = this.scrollBarY.remove();
    
    return null;
  }
  
});




function Scrollbar(dir, wrapper, fade, shrink, color)
{
  var doc = document;
  
  this.dir = dir;
  this.fade = fade;
  this.shrink = shrink;
  this.scrollbarID = ++scrollbarID;

  // Create main scrollbar
  this.bar = doc.createElement('div');

  this.bar.style.cssText = 'position:absolute;top:0;left:0;-webkit-transition-timing-function:cubic-bezier(0,0,0.25,1);pointer-events:none;-webkit-transition-duration:0;-webkit-transition-delay:0;-webkit-transition-property:-webkit-transform;z-index:10;background:' + color + ';' +
          '-webkit-transform:' + TRANSLATE_OPEN + '0,0' + TRANSLATE_CLOSE + ';' +
          (dir == 'horizontal' ? '-webkit-border-radius:3px 2px;min-width:6px;min-height:5px' : '-webkit-border-radius:2px 3px;min-width:5px;min-height:6px');

  // Create scrollbar wrapper
  this.wrapper = doc.createElement('div');
  this.wrapper.style.cssText = '-webkit-mask:-webkit-canvas(scrollbar' + this.scrollbarID + this.dir + ');position:absolute;z-index:10;pointer-events:none;overflow:hidden;opacity:0;-webkit-transition-duration:' + (fade ? '300ms' : '0') + ';-webkit-transition-delay:0;-webkit-transition-property:opacity;' +
          (this.dir == 'horizontal' ? 'bottom:2px;left:2px;right:7px;height:5px' : 'top:2px;right:2px;bottom:7px;width:5px;');

  // Add scrollbar to the DOM
  this.wrapper.appendChild(this.bar);
  wrapper.appendChild(this.wrapper);
}

Scrollbar.prototype =
{
  init: function(scroll, size)
  {
    var doc = document,
        pi = Math.PI,
        ctx;

    // Create scrollbar mask
    if (this.dir == 'horizontal')
    {
      if (this.maxSize != this.wrapper.offsetWidth)
      {
        this.maxSize = this.wrapper.offsetWidth;
        ctx = doc.getCSSCanvasContext("2d", "scrollbar" + this.scrollbarID + this.dir, this.maxSize, 5);
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.beginPath();
        ctx.arc(2.5, 2.5, 2.5, pi/2, -pi/2, false);
        ctx.lineTo(this.maxSize-2.5, 0);
        ctx.arc(this.maxSize-2.5, 2.5, 2.5, -pi/2, pi/2, false);
        ctx.closePath();
        ctx.fill();
      }
    }
    else
    {
      if (this.maxSize != this.wrapper.offsetHeight)
      {
        this.maxSize = this.wrapper.offsetHeight;
        ctx = doc.getCSSCanvasContext("2d", "scrollbar" + this.scrollbarID + this.dir, 5, this.maxSize);
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.beginPath();
        ctx.arc(2.5, 2.5, 2.5, pi, 0, false);
        ctx.lineTo(5, this.maxSize-2.5);
        ctx.arc(2.5, this.maxSize-2.5, 2.5, 0, pi, false);
        ctx.closePath();
        ctx.fill();
      }
    }

    this.size = Math.max(Math.round(this.maxSize * this.maxSize / size), 6);
    this.maxScroll = this.maxSize - this.size;
    this.toWrapperProp = this.maxScroll / (scroll - size);
    this.bar.style[this.dir == 'horizontal' ? 'width' : 'height'] = this.size + 'px';
  },
  
  setPosition: function(pos)
  {
    if (this.wrapper.style.opacity != '1')
      this.show();

    pos = Math.round(this.toWrapperProp * pos);

    if (pos < 0)
    {
      pos = this.shrink ? pos + pos*3 : 0;
      if (this.size + pos < 7)
        pos = -this.size + 6;
    }
    else if (pos > this.maxScroll)
    {
      pos = this.shrink ? pos + (pos-this.maxScroll)*3 : this.maxScroll;
      if (this.size + this.maxScroll - pos < 7)
        pos = this.size + this.maxScroll - 6;
    }

    if (this.dir=='horizontal')
      pos= TRANSLATE_OPEN + pos + 'px,0' + TRANSLATE_CLOSE;
    else
      pos= TRANSLATE_OPEN + '0,' + pos + 'px' + TRANSLATE_CLOSE;

    this.bar.style.webkitTransform = pos;
  },

  show: function()
  {
    if (HAS_3D)
      this.wrapper.style.webkitTransitionDelay = '0';
    this.wrapper.style.opacity = '1';
  },

  hide: function()
  {
    if (HAS_3D)
      this.wrapper.style.webkitTransitionDelay = '350ms';
    this.wrapper.style.opacity = '0';
  },
  
  remove: function()
  {
    this.wrapper.parentNode.removeChild(this.wrapper);
    return null;
  }
};

coherent.ScrollView.IndicatorStyleBlack= 'rgba(0,0,0,0.5)';
coherent.ScrollView.IndicatorStyleWhite= 'rgba(255,255,255,0.5)';
coherent.ScrollView.IndicatorStyleDefault= coherent.ScrollView.IndicatorStyleBlack;

})();