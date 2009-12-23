/*jsl:import startup.js*/
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
            var _this= this;    
            var d= XHR.get(this.href, null, {
                                sync: sync,
                                responseContentType: 'text/plain'
                            });
        
            function received(data)
            {
                _this.setContent(data);
                return data;
            }
            d.addCallback(received);
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