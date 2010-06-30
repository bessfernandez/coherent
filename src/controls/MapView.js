/*jsl:import coherent*/
/*jsl:declare google*/

coherent.MapView= Class.create(coherent.View, {
    
    exposedBindings: ['annotations'],
    
    constructor: function(node, parameters)
    {
        this.__centerCoordinate= {
                    latitude:15,
                    longitude:3
                };
        this.__mapType=coherent.MapView.MapType.TERRAIN;
        this.__zoom= 2;
        this.__minZoom= null;
        this.__maxZoom= null;
        this.__annotations= [];
        this.__markers= [];
        
        this.__clickedOnAnnotation= false;
        this.__hoveringInAnnotation= false;
        this.__annotationTimer= null;

        this.base(node, parameters);
    },
    
    init: function()
    {
        //  Grab the annotation node
        var container= this.container();
        this.annotationNode= container.children[0];
        if (this.annotationNode)
            this.annotationNode.parentNode.removeChild(this.annotationNode);
        while (container.firstChild)
            container.removeChild(container.firstChild);

        //  Now set up the Google Map
        var latlng= new google.maps.LatLng(this.__centerCoordinate.latitude,
                                           this.__centerCoordinate.longitude);
        var options= {
                center: latlng,
                mapTypeId: this.__mapType,
                zoom: this.__zoom,
                mapTypeControl: false,
                navigationControlOptions: {
                    style: google.maps.NavigationControlStyle.SMALL
                    }
            };

        var map= this.__map= new google.maps.Map(this.node, options);
        var gme= google.maps.event;
        
        gme.addListener(map, 'zoom_changed', this.__zoomChanged.bind(this));
        gme.addListener(map, 'center_changed', this.__centerChanged.bind(this));
        gme.addListener(map, 'click', this.__mapClicked.bind(this));
    },
    
    __mapClicked: function(event)
    {
        this.hideOverlay();
        this.__clickedOnAnnotation= false;
    },
    
    __zoomChanged: function()
    {
        var zoom= this.__map.getZoom();
        
        if ('number'===typeof(this.__minZoom) && zoom < this.__minZoom)
            this.__map.setZoom(zoom=this.__minZoom);
        if ('number'===typeof(this.__maxZoom) && zoom > this.__maxZoom)
            this.__map.setZoom(zoom=this.__maxZoom);
            
        this.willChangeValueForKey('zoomLevel');
        this.__zoom= zoom;
        this.didChangeValueForKey('zoomLevel');
    },
    
    __centerChanged: function()
    {
        var center= this.__map.getCenter();
        this.willChangeValueForKey('centerCoordinate');
        this.__centerCoordinate= {
                latitude: center.lat(),
                longitude: center.lng()
            };
        this.didChangeValueForKey('centerCoordinate');
        if (this.__overlayItem)
            this.__overlayItem.overlay.draw();
    },
    
    __markerClicked: function(marker)
    {
        var index= this.__markers.indexOf(marker);
        var annotation= this.__annotations.objectAtIndex(index);
        this.__clickedOnAnnotation= true;
        this.showOverlayForAnnotation(annotation);
    },
    
    __markerForAnnotation: function(annotation)
    {
        //  Create a Google Maps marker
        var position= annotation.valueForKey('coordinate');
        var latlng= new google.maps.LatLng(position.latitude, position.longitude);
        var options= {
                        position: latlng,
                        title: annotation.valueForKey('title'),
                        clickable: true,
                        visible: true,
                        map: this.__map
                    };
        var delegate= this.delegate();
    
        if (delegate && delegate.mapViewMarkerOptionsForAnnotation)
        {
            var more= delegate.mapViewMarkerOptionsForAnnotation(this, annotation);
            if (more)
                Object.extend(options, more);
        }
        var marker= new google.maps.Marker(options);
        google.maps.event.addListener(marker, 'click', this.__markerClicked.bind(this, marker));
        return marker;
    },
    
    onmouseenter: function(event)
    {
        this.__hoveringInAnnotation= true;
        if (this.__annotationTimer)
            this.__annotationTimer.cancel();
    },
    
    onmouseleave: function(event)
    {
        this.__hoveringInAnnotation= false;
        if (this.__clickedOnAnnotation)
            return;
        this.__annotationTimer= Function.delay(this.hideOverlay, 2000, this);
    },
    
    hideOverlay: function()
    {
        if (this.__annotationTimer)
            this.__annotationTimer.cancel();
            
        if (this.__overlayItem)
            this.__overlayItem.overlay.setMap(null);
    },
    
    showOverlayForAnnotation: function(annotation)
    {
        if (this.__annotationTimer)
            this.__annotationTimer.cancel();

        if (this.__overlayItem)
        {
            this.__overlayItem.overlay.moveTo(annotation.coordinate);
            this.__overlayItem.overlay.setMap(this.__map);
            this.__overlayItem.setValueForKey(annotation, 'representedObject');
            return;
        }
        
        if (!this.annotationViewTemplate)
            return;
            
        var oldDataModel= coherent.dataModel;
        var item= new coherent.KVO.Proxy(this.__context);
        
        coherent.dataModel= item;
        
        item.setValueForKey(annotation, 'representedObject');
        item.setValueForKey(this.annotationViewTemplate(this.annotationNode, null), 'view');
        item.setValueForKey(new coherent.MapViewOverlay(item.view), 'overlay');
        
        var hoverInfo={
            owner: this,
            onmouseenter: this.onmouseenter,
            onmouseleave: this.onmouseleave
        };
        item.view.addTrackingInfo(hoverInfo);
        
        coherent.dataModel= oldDataModel;
        
        this.__overlayItem= item;
        item.overlay.moveTo(annotation.coordinate);
        item.overlay.setMap(this.__map);
    },
    
    addAnnotation: function(annotation)
    {
        this.addAnnotations([annotation]);
    },

    addAnnotations: function(annotations)
    {
        var newMarkers= annotations.map(this.__markerForAnnotation, this);
        this.__annotations.addObjects(annotations);
        this.__markers.addObjects(newMarkers);
        
        if (this.__hoveringInAnnotation || this.__clickedOnAnnotation ||
            !this.__annotations.length)
            return;
        var last= this.__annotations[this.__annotations.length-1];
        this.showOverlayForAnnotation(last);
        
        this.__annotationTimer= Function.delay(this.hideOverlay, 10000, this);
    },
    
    removeAnnotation: function(annotation)
    {
        this.removeAnnotations([annotation]);
    },
    
    removeAnnotations: function(annotations)
    {
        var len= annotations.length;
        var i;
        
        for (i=0; i<len; ++i)
        {
            var annotation= annotations.objectAtIndex(i);
            var index= this.__annotations.indexOf(annotation);
            if (-1===index)
                continue;

            if (this.__overlayItem && annotation===this.__overlayItem.representedObject)
                this.__overlayItem.overlay.setMap(null);
            
            var marker= this.__markers[index];
            marker.setMap(null);
            google.maps.event.clearInstanceListeners(marker);
            this.__markers.removeObjectAtIndex(index);
            this.__annotations.removeObjectAtIndex(index);
        }
    },
    
    minimumZoom: function()
    {
        return this.__minZoom;
    },
    
    setMinimumZoom: function(minZoom)
    {
        this.__minZoom= minZoom;
        if (!isNaN(this.__zoom) && !isNaN(this.__minZoom) &&
            this.__zoom < this.__minZoom)
        {
            this.__zoom= this.__minZoom;
            if (this.__map)
                this.__map.setZoom(this.__zoom);
        }
    },

    maximumZoom: function()
    {
        return this.__maxZoom;
    },
    
    setMaximumZoom: function(maxZoom)
    {
        this.__maxZoom= maxZoom;
        if (!isNaN(this.__zoom) && !isNaN(this.__maxZoom) &&
            this.__zoom > this.__maxZoom)
        {
            this.__zoom= this.__maxZoom;
            if (this.__map)
                this.__map.setZoom(this.__zoom);
        }
    },
    
    annotations: function()
    {
        return this.__annotations;
    },
    
    setAnnotations: function(newAnnotations)
    {
        newAnnotations= newAnnotations||[];
        var len= this.__markers.length;
        while (len--)
            this.__markers[len].setMap(null);
        this.__markers.removeAllObjects();
        this.__annotations.removeAllObjects();
        
        if (this.__overlayItem)
        {
            if (-1===newAnnotations.indexOf(this.__overlayItem.representedObject))
                this.__overlayItem.overlay.setMap(null);
        }
        if (newAnnotations.length)
            this.addAnnotations(newAnnotations);
    },
    
    observeAnnotationsChange: function(change)
    {
        if (change.changeType===coherent.ChangeType.setting)
        {
            this.setAnnotations(change.newValue);
            return;
        }

        var indexes= change.indexes;
        
        switch (change.changeType)
        {
            case coherent.ChangeType.insertion:
                //  add the specific indexes.
                this.addAnnotations(change.newValue);
                break;

            case coherent.ChangeType.deletion:
                this.removeAnnotations(change.oldValue);
                break;

            case coherent.ChangeType.replacement:
                var newMarkers= change.newValue.map(this.__markerForAnnotation, this);
                var oldMarkers= this.__markers.objectsAtIndexes(change.indexes);
                this.__annotations.replaceObjectsAtIndexesWithObjects(change.indexes, change.newValue);
                this.__markers.replaceObjectsAtIndexesWithObjects(change.indexes, newMarkers);
                oldMarkers.forEach(function(m) { m.setMap(null); });
                break;

            case coherent.ChangeType.validationError:
                /*  @TODO: Is there something I should do when an item in the
                    content is not valid? Possibly apply a class name to the 
                    item.
                 */
                break;
                    
            default:
                console.log("Unknown change type: "+change.changeType);
                break;
        }
        
        
    },
    
    mapType: function()
    {
        return this.__mapTypeId;
    },
    
    setMapType: function(mapType)
    {
        this.__mapTypeId= mapType;
        if (this.__map)
            this.__map.setMapTypeId(mapType);
    },
    
    centerCoordinate: function()
    {
        return this.__centerCoordinate;
    },
    
    setCenterCoordinate: function(position)
    {
        this.__centerCoordinate= position;
        if (this.__map)
        {
            var latlng= new google.maps.LatLng(this.__centerCoordinate.latitude,
                                               this.__centerCoordinate.longitude);
            this.__map.setCenter(latlng);
        }
    },
    
    zoomLevel: function()
    {
        return this.__zoomLevel;
    },
    
    setZoomLevel: function(zoom)
    {
        this.__zoomLevel= zoom;
        if (this.__map)
            this.__map.setZoom(zoom);
    }
    
});

coherent.MapView.MapType= {
    HYBRID: "hybrid",
    ROADMAP: "roadmap",
    SATELLITE: "satellite",
    TERRAIN: "terrain"
};
