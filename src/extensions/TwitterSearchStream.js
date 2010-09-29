/*jsl:import ../foundation.js*/
/*jsl:import ../foundation/net/XHR.js*/

coherent.TwitterSearchStream= Class.create(coherent.Bindable, {

  exposedBindings: ['searchQuery', 'paused', 'minNumberOfTweets',
                    'maxNumberOfTweets', 'maxTweetAge', 'centerCoordinate',
                    'radius', 'radiusUnits', 'language'],
  
  SEARCH_URL: 'http://search.twitter.com/search.json',
  RESULTS_PER_PAGE: 100,
  TWEET_PROCESSING_INTERVAL: 5000,
  MIN_UPDATE_INTERVAL: 5000,
  
  minNumberOfTweets: 20,
  maxNumberOfTweets: null,
  maxTweetAge: 1000 * 60 * 3,
  
  language: null,
  
  objectClass: coherent.KVO,
  
  constructor: function(params)
  {
    this.__tweets=[];
    this.__pendingTweets= [];
    this.__paused= false;
    this.__sinceId= null;
    this.__updateTimestamp= null;
    this.__seenTweetIds= {};
    
    this.__processTimer= Function.repeat(this.__processTweets,
                                         this.TWEET_PROCESSING_INTERVAL,
                                         this);
    this.__processTweets();
    this.base(params);
  },

  tweets: function()
  {
    return this.__tweets;
  },
  
  paused: function()
  {
    return this.__paused;
  },
  
  setPaused: function(paused)
  {
    paused= !!paused;
    if (paused===this.__paused)
      return;
    
    this.__paused= paused;
    if (paused)
      this.__processTimer.cancel();
    else
    {
      this.__processTweets();
      this.__processTimer.start();
    }
  },

  searchQuery: function()
  {
    return this.__searchQuery;
  },
  
  setSearchQuery: function(searchQuery)
  {
    this.__searchQuery= searchQuery;
    this.__pendingTweets= [];
    this.__updateTimestamp= null;
    this.__scheduleUpdate();
  },
  
  __addTweet: function(rawTweet)
  {
    var tweet= new (this.objectClass||coherent.KVO)(coherent.KVO.adaptTree(rawTweet));
    tweet.timestamp= Date.now();
    this.__seenTweetIds[rawTweet.id]= true;
    this.__tweets.addObject(tweet);
  },
  
  __processTweets: function()
  {
    //  When no more tweets are pending, schedule an update
    if (!this.__pendingTweets.length)
      this.__scheduleUpdate();
    else if (!this.maxNumberOfTweets || this.__tweets.length < this.maxNumberOfTweets)
      this.__addTweet(this.__pendingTweets.pop());
    
    //  Expire some tweets
    var index=0;
    var minNumberOfTweets= this.minNumberOfTweets;
    var maxTweetAge= this.maxTweetAge;
    var tweet;
    var now= Date.now();
    
    var len= Math.max(0, this.__tweets.length-minNumberOfTweets);
    while (index < len)
    {
      tweet= this.__tweets.objectAtIndex(index);
      if (tweet.timestamp > now - maxTweetAge)
        break;
      index++;
    }

    if (index)
      this.__tweets.removeObjectsInRange(0, index);
  },
  
  __tweetsFetched: function(data)
  {
    this.__sinceId= (data.results.length ? data.results[0].id : data.max_id);
    var pending= this.__pendingTweets.length;
    
    this.__pendingTweets.addObjects(data.results);
    this.__updateTimestamp= Date.now();
    
    if (!pending)
    {
      this.__processTimer.cancel();
      this.__processTimer.start();
      this.__processTweets();
    }
    
    return data;
  },
  
  __fetchTweets: function()
  {
    var query= this.searchQuery();
    if (!query)
      return;
      
    var params= { q: query, rpp: this.RESULTS_PER_PAGE };
    var options= { jsonp: true };

    if (this.__sinceId)
      params.since_id= this.__sinceId;
    if (this.language)
      params.lang= this.language;
    if (this.centerPosition && this.radius && this.radiusUnits)
      params.geocode= [this.centerPosition.latitude, this.centerPosition.longitude,
                       this.radius+this.radiusUnits].join(',');
    console.log('fetching tweets @ ' + (new Date()) + ' params: ', params);  
    var deferred= XHR.get(this.SEARCH_URL, params, options);
    deferred.addCallback(this.__tweetsFetched, this);
  },
  
  __scheduleUpdate: function()
  {
    var now= Date.now();
    var delay=10;
    
    if (this.__updateTimestamp)
    {
      var millisecondsSinceLastUpdate= now-this.__updateTimestamp;
      if (millisecondsSinceLastUpdate < this.MIN_UPDATE_INTERVAL)
        delay= this.MIN_UPDATE_INTERVAL - millisecondsSinceLastUpdate;
    }

    if (this.__updateTimer)
      this.__updateTimer.cancel();
    this.__updateTimer= Function.delay(this.__fetchTweets, delay, this);
  }

});
