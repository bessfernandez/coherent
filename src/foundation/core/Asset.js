/*jsl:import ../../foundation.js*/
/*jsl:import ../net/XHR.js*/

(function(){

    var assetLookup= {};

    function installCss(css, prefix)
    {
        css= css.replace(/url\("([^"]*)"\)/g, function(all, relativePath) {
            return 'url("' + prefix + relativePath + '")';
        });
        
        var head= document.getElementsByTagName('head')[0];
        var style= document.createElement('style');
        style.setAttribute('type', 'text/css');

        head.appendChild(style);

        if (coherent.Browser.IE)
            style.styleSheet.cssText= css;
        else
            style.appendChild(document.createTextNode(css));
    }

    function currentAssetPrefix()
    {
        var currentUrl= coherent.Scripts.currentScriptUrl();
        if (this.__currentPrefix && this.__currentUrl===currentUrl)
            return this.__currentPrefix;
    
        this.__currentUrl= currentUrl;
        var lastSlash= currentUrl.lastIndexOf('/');
        return currentUrl.substring(0, lastSlash+1);
    }
    
    /** A generic reference to an asset within the application or one of its
        bundles.
        
        @constructor
        @property {String} href - The URL associated with the asset
        @property {String} dirname - The directory portion of the href
        @property {String} ext - The extension (including the dot) for the
            asset. Used to determine the type.
            
        @param {String} href - The URL for the asset. If this is a relative URL,
            it is assumed to be relative to the current bundle and will have the
            URL prefix of the bundle prepended to the href value.
        @param {String} [content] - The content for the asset. This is set by
            the build system when generating release mode versions of the
            bundle.
     */
    coherent.Asset= function(href, content)
    {
        if (!(this instanceof coherent.Asset))
            return new coherent.Asset(href, content);
            
        var prefix= currentAssetPrefix();
        if ('/'!==href.charAt(0))
            href= [prefix, href].join('');
            
        if (href in assetLookup)
            return assetLookup[href];
        assetLookup[href]= this;
            
        this.href= href;
        this.dirname= prefix;
        var lastDot= href.lastIndexOf('.');
        this.ext= href.substring(lastDot).toLowerCase();

        this.setContent(content);
        
        return this;
    }
    
    Class.extend(coherent.Asset, {

        toString: function()
        {
            return this.href;
        },
    
        valueOf: function()
        {
            return this.href;
        },

        load: function(sync)
        {
            var d= XHR.get(this.href, null, {
                                sync: sync,
                                responseContentType: 'text/plain'
                            });
        
            function received(data)
            {
                this.setContent(data);
                return this.__content;
            }
            d.addCallback(received, this);
            return d;
        },
        
        content: function()
        {
            if (!this.__content)
                this.load(true);
                
            return this.__content;
        },
        
        setContent: function(newContent)
        {
            if (!newContent)
            {
                this.__content= newContent;
                return;
            }
            
            switch (this.ext)
            {
                case '.json':
                    this.__content= eval('('+newContent+')');
                    break;
                    
                case '.html':
                    this.__content= newContent.replace(/>\s+</g, '><');
                    break;
                    
                case '.js':
                    coherent.Scripts.install(newContent);
                    this.__content= newContent;
                    break;

                case '.css':
                    installCss(newContent, this.dirname);
                    this.__content= newContent;
                    break;

                default:
                    this.__content= newContent;
                    break;
            }
        }
        
    });

})();