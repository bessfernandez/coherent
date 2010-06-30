/*jsl:import coherent*/
/*jsl:declare google*/

/** This class is used internally as an adapter for the Google Maps overlay.
 */
coherent.MapViewOverlay= function(view, positions)
{
    this.view= view;
    this.positions= positions||[coherent.Overlay.Position.ABOVE, coherent.Overlay.Position.BELOW,
                                coherent.Overlay.Position.RIGHT, coherent.Overlay.Position.LEFT];
    this.coordinate= { latitude: 0, longitude: 0 };
}
coherent.MapViewOverlay.prototype= new google.maps.OverlayView();

Class.extend(coherent.MapViewOverlay, {

    moveTo: function(coordinate)
    {
        this.coordinate= coordinate;
        var map= this.getMap();
        if (!map)
            return;
        
        var overlayProjection = this.getProjection();
        if (!overlayProjection)
          return;

        var latlng= new google.maps.LatLng(coordinate.latitude,
                                           coordinate.longitude);
                                           
        var pos= overlayProjection.fromLatLngToDivPixel(latlng);
        var node= this.view.node;
        var mapNode= map.getDiv();
        var dragNode= this.getPanes().floatPane.parentNode;
        var mapWidth= mapNode.offsetWidth;
        var mapHeight= mapNode.offsetHeight;
        var width;
        var height;
        var margins;
        var x;
        var y;
        var offsetX= dragNode.offsetLeft;
        var offsetY= dragNode.offsetTop;
        var transform= dragNode.style.webkitTransform || dragNode.style.mozTransform;
        var match;
        
        if (transform && (match= transform.match(/translate\(\s*(\-?\d+).*,\s*(\-?\d+).*\)/)))
        {
            offsetX= parseInt(match[1]||0,10);
            offsetY= parseInt(match[2]||0,10);
        }
            
        // console.log('map dimensions=', mapWidth, 'x', mapHeight);
        var index=0;
        var len= this.positions.length;
        var position;
        
        if (this.currentPosition)
        {
            index= this.positions.indexOf(this.currentPosition);
            position= this.currentPosition;
        }

        while (len--)
        {
            if (position)
                Element.removeClassName(node, position);
            position= this.positions[index];

            index= (index+1) % this.positions.length;
            
            Element.addClassName(node, position);
            width= node.offsetWidth;
            height= node.offsetHeight;
            margins= Element.getStyles(node, ['marginLeft', 'marginRight', 'marginTop', 'marginBottom']);
            
            switch (position)
            {
                case coherent.Overlay.Position.ABOVE:
                    x= pos.x - width/2;
                    y= pos.y - height - parseInt(margins.marginBottom||0,10);
                    break;
                case coherent.Overlay.Position.BELOW:
                    x= pos.x - width/2;
                    y= pos.y;
                    //  Add marginTop to the height, otherwise the calculation
                    //  to determine whether it's on the map doesn't work.
                    height+= parseInt(margins.marginTop||0,10);
                    break;
                case coherent.Overlay.Position.RIGHT:
                    x= pos.x;
                    y= pos.y - height/2;
                    //  Add marginLeft to the width, otherwise the calculation
                    //  to determine whether it's on the map doesn't work.
                    width+= parseInt(margins.marginLeft||0,10);
                    break;
                case coherent.Overlay.Position.LEFT:
                    x= pos.x - width - parseInt(margins.marginRight||0,10);
                    y= pos.y - height/2;
                    break;
                default:
                    console.log('unknown position: ', position);
                    break;
            }

            // console.log('position:', position, 'coord=(',[x+offsetX,y+offsetY].join(','), ') dimensions=', [width,height].join('x'));
            if (x+offsetX>=0 && y+offsetY>=0 && x+width+offsetX<=mapWidth && y+height+offsetY<=mapHeight)
                break;
        }
        
        this.currentPosition= position;
        node.style.top= y + 'px';
        node.style.left= x + 'px';
    },
    
    onAdd: function()
    {
        var panes = this.getPanes();
        panes.floatPane.appendChild(this.view.node);
    },
    
    onRemove: function()
    {
        var node= this.view.node;
        node.parentNode.removeChild(node);
        coherent.View.addToHoldingArea(node);
    },
    
    draw: function()
    {
        this.moveTo(this.coordinate);
    }
    
});