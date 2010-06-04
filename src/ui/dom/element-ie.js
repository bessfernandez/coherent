/*jsl:import element.js*/

//  IE doesn't correctly support Opacity
if (!coherent.Support.Opacity)
{
  Object.extend(Element, {
  
    setStyle: function(element, prop, value)
    {
      if ('opacity'!=prop)
      {
        element.style[prop]= value;
        return;
      }

      //  Handle wacky IE filter stuff
      var filter = element.style.filter;
      var style = element.style;

      if (value == 1 || value === '')
      {
        style.filter = filter.replace(/alpha\([^\)]*\)/gi,'');
        return;
      }
    
      if (value < 0.00001)
        value = 0;
      style.filter = filter.replace(/alpha\([^\)]*\)/gi, '') +
               'alpha(opacity=' + (value * 100) + ')';
    },
  
    setStyles: function(element, styles)
    {
      var elementStyle= element.style;
    
      for (var p in styles)
      {
        if ('opacity'==p)
          Element.setStyle(element, p, styles[p]);
        else
          elementStyle[p]= styles[p];
      }
    },

    getStyles: function(element, propsToGet)
    {
      var currentStyle= element.currentStyle;
      var styles = {};
      var opacity;
      var extra;
    
      if ('string'===typeof(propsToGet))
        switch (propsToGet)
        {
          case 'opacity':
            opacity = currentStyle.filter.match(/opacity=(\d+)/i);
            return (null===opacity ? 1 : parseInt(opacity[1], 10)/100);
          case 'width':
            extra += parseInt(currentStyle.borderLeftWidth, 10)||0 + 
                 parseInt(currentStyle.borderRightWidth, 10)||0 +
                 parseInt(currentStyle.paddingLeft, 10)||0 +
                 parseInt(currentStyle.paddingRight, 10)||0;
            return Math.max(0, element.offsetWidth - extra) + 'px';
          case 'height':
            extra += parseInt(currentStyle.borderTopWidth, 10)||0 + 
                 parseInt(currentStyle.borderBottomWidth, 10)||0 +
                 parseInt(currentStyle.paddingTop, 10)||0 +
                 parseInt(currentStyle.paddingBottom, 10)||0;
            return Math.max(0, element.offsetHeight - extra) + 'px';
          case 'backgroundPosition':
            return currentStyle.backgroundPositionX+' '+
                 currentStyle.backgroundPositionY;
          default:
            return currentStyle[propsToGet];
        }
    
      propsToGet= propsToGet||Element.PROPERTIES;

      var p;
      var len= propsToGet.length;
    
      while (len--)
      {
        p= propsToGet[len];
        switch (p)
        {
          case 'opacity':
            opacity = currentStyle.filter.match(/opacity=(\d+)/i);
            styles[p] = (null===opacity ? 1 : parseInt(opacity[1], 10)/100);
            break;
          case 'width':
            extra += parseInt(currentStyle.borderLeftWidth, 10)||0 + 
                 parseInt(currentStyle.borderRightWidth, 10)||0 +
                 parseInt(currentStyle.paddingLeft, 10)||0 +
                 parseInt(currentStyle.paddingRight, 10)||0;
            styles[p]= Math.max(0, element.offsetWidth - extra) + 'px';
            break;
          case 'height':
            extra += parseInt(currentStyle.borderTopWidth, 10)||0 + 
                 parseInt(currentStyle.borderBottomWidth, 10)||0 +
                 parseInt(currentStyle.paddingTop, 10)||0 +
                 parseInt(currentStyle.paddingBottom, 10)||0;
            styles[p]= Math.max(0, element.offsetHeight - extra) + 'px';
            break;
          case 'backgroundPosition':
            styles[p] = currentStyle.backgroundPositionX+' '+
                  currentStyle.backgroundPositionY;
            break;
          default:
            styles[p] = currentStyle[p];
            break;
        }
      }
  
      return styles;
    }
        
  });
  
  //  re-alias getStyle to getStyles to pick up correct IE version
  Element.getStyle= Element.getStyles;

}
