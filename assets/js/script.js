/*  TABLE OF CONTENT
    1. Common function
    2. Initialing
*/
/*================================================================*/
/*  1. Common function
/*================================================================*/
paceOptions = {
    elements: true
};
var sf_yavailable = false;
var sf_yplayers = {};
var sf_vmavailable = false;
var sf_vmplayers = [];
var sf_scavailable = false;
var sf_sc_players = [];
var popup_opened = false;
function getFrameID(id) {
    var elem = document.getElementById(id);
    if (elem) {
        if (/^iframe$/i.test(elem.tagName)){
        	return id; //Frame, OK
        }
        // else: Look for frame
        var elems = elem.getElementsByTagName('iframe');
        if (!elems.length){
        	return null; //No iframe found, FAILURE
        }
        for (var i = 0; i < elems.length; i++) {
            if (/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(elems[i].src)){
            	break;
            }
        }
        elem = elems[i]; //The only, or the best iFrame
        if (elem.id){
        	return elem.id; //Existing ID, return it
        }
        // else: Create a new ID
        do {
        	//Keep postfixing `-frame` until the ID is unique
            id += '-frame';
        } while (document.getElementById(id));
        elem.id = id;
        return id;
    }
    // If no element, return null.
    return null;
}
// Define YT_ready function.
var YT_ready = (function() {
    var onReady_funcs = [];
    //var onStateChange_funcs = [];
    var api_isReady = false;
	/* @param func function     Function to execute on ready
     * @param func Boolean      If true, all qeued functions are executed
     * @param b_before Boolean  If true, the func will added to the first position in the queue
    */
    return function(func, b_before) {
        if (func === true) {
            api_isReady = true;
            for (var i = 0; i < onReady_funcs.length; i++) {
                // Removes the first func from the array, and execute func
                onReady_funcs.shift()();
            }
        }
        else if (typeof func == 'function') {
            if (api_isReady)
            	func();
            else onReady_funcs[b_before ? 'unshift' : 'push'](func);
        }
    }
})();
function onYouTubePlayerAPIReady() {
	sf_yavailable = true;
    YT_ready(true);
}
//Define a player storage object, to enable later function calls,
//  without having to create a new class instance again.
YT_ready(function() {
    $('.post.video-format.youtube').each(function() {    	
    	var $post = $(this);    	
    	var $frame = $post.find('.post-cover .temp-cover .fluid-width-video-wrapper iframe[src*="//www.youtube.com"]');
    	if($frame.length){    		
	        var identifier = $frame.attr('id');
	        var frameID = getFrameID(identifier);	        
	        if ( frameID ) { //If the frame exists	        	
	            sf_yplayers[frameID] = new YT.Player(frameID, {
	                events: {
	                    'onReady': onReadyEvent(frameID, identifier),
	                    'onStateChange': onPlayerStateChangeEvent
	                }
	            });	            
	        }
	    }
    });
});
// Returns a function to enable multiple events
function onReadyEvent(frameID, identifier) {
    return function (event) {
    	var $post = $('#'+identifier).closest('.post');
    	var $cover = $post.find('.post-cover');
    	if( $cover.length ){
    		var $action = $cover.find('.cover-action');
    		var $coverContent = $cover.find('.temp-cover');
    		if( $action.length && $coverContent.length ){
    			$action.click(function(){    				    				                    
    				var player = sf_yplayers[frameID]; // player object
    				var $coverImg = $cover.find('img');
    				var $topArea = $post.find('.top-area');
    				if( $coverImg.length && $topArea.length ){                        
    					if( $(this).is('.paused') ) {                            
    						player.playVideo(); 
    						$(this).removeClass('paused');
    						$(this).addClass('playing');
    					}
    					else if( $(this).is('.playing') ) {                            
    						player.pauseVideo();
                            $(this).removeClass('playing');                            
    						$(this).addClass('paused');
	        			}
	        			else{
	        				// Pause vimeo videos
	        				if(sf_vmavailable){
	        					$.each( sf_vmplayers, function( key, value ) {	        						
									$('#'+value).vimeo('pause');
									sfApp.externalPauseMedia(value);
								});
	        				}
	        				// Pause other videos
    						$.each( sf_yplayers, function( key, value ) {
    							if(sf_yplayers[key] != player){
    								sf_yplayers[key].pauseVideo();
    							}
    						});
	        				$coverImg.fadeOut(200,function() {
	        					$coverContent.fadeIn(200);
	        					player.playVideo();        					        					
	        					$topArea.css({'margin-top': '1px'});
                                if( $('body').is('.sf-masonry') ) {
                                    setTimeout(function() {
                                        sfApp.gridRefresh();
                                    }, 200);
                                }
	        				});
	        				$(this).addClass('playing explained');	        				
	        			}
        			}
    			});	
    		}
    	}
    }
}
function onPlayerStateChangeEvent(event,identifier){		
	var $frame = $('#'+event.target.c.id);
	if($frame.length){		
		if (event.data == YT.PlayerState.ENDED) {				
			var $post = $frame.closest('.post');
			if($post.length){
				var $cover = $post.find('.post-cover');
				if( $cover.length ){
		    		var $action = $cover.find('.cover-action');
		    		var $coverContent = $cover.find('.temp-cover');
		    		if( $action.length && $coverContent.length ){
		    			var $coverImg = $cover.find('img');
	    				var $topArea = $post.find('.top-area');
	    				if( $coverImg.length && $topArea.length ){
			    			$coverContent.fadeOut(200,function() {
	        					$coverImg.fadeIn(200);        							        					
	        					$topArea.css({'margin-top': '-60px'});
                                if( $('body').is('.sf-masonry') ) {
                                    setTimeout(function() {
                                        sfApp.gridRefresh();
                                    }, 200);
                                }
	        				});
			    			$action.removeClass('playing explained');
			    		}
		    		}
		    	}
		    }			
		}
	}
}
var sfApp={
	tags_list: [],
	youtube_videos: 0,
	vimeo_videos: 0,
	sc_audios: 0,
	isMobile:function(){
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            return true;
        }
        else
            return false;
    },
    prepareHiddenIframe:function(){                             
        var beginHide=0;
        if( $( '.content-area' ).find('iframe').length > 0 ){
            if( $('.post').is( '.cover-frame' ) ){
                beginHide = 1;
            }
            var current = 0;        
            $( '.content-area' ).find('iframe').each(function(){
                if( current >= beginHide ) {
                    var $frame = $(this);
                    setTimeout(function() {                        
                        if( $frame.parent().is( '.fluid-width-video-wrapper' ) ) {
                            $frame.parent().show();
                        }
                        else{
                            $frame.show();
                        }
                    },1000);
                }
                current++;
            });
        }         
    },
    prepareSingleCover:function(){
        if( $('body').is('.full-cover') ){
            var $banner = $('.banner');
            var $bannerBg = $banner.find('.background');
            if( !$bannerBg.length ){
                var $coverContent = $('.content-area').find('>:first-child');
                if( $coverContent.length ){                    
                    // YouTube Video Post By LINK
                    if( $coverContent.has('a[href*="youtube.com"]').length ){
                        var $videoEl = $coverContent.find('a[href*="youtube.com"]');
                        if($videoEl.length){
                            var videoUrl = $videoEl.attr('href');
                            var youtubeId = videoUrl.match(/[\\?&]v=([^&#]*)/)[1];
                            $banner.append('<div class="background" style="background-image: url(http://i3.ytimg.com/vi/' + youtubeId + '/mqdefault.jpg);" data-bottom-top="transform: translate3d(0px,-200px, 0px);" data-top-bottom="transform: translate3d(0px,200px, 0px);" data-center="transform: translate3d(0px,0px, 0px);"></div>');                             
                            var frameStr = '<iframe class="cover-frame" id="youtube_video_' + sfApp.youtube_videos + '" width="853" height="480" src="https://www.youtube.com/embed/'+ youtubeId + '?rel=0&amp;controls=0&amp;showinfo=0&amp;enablejsapi=1&amp;html5=1" frameborder="0" allowfullscreen></iframe>';
                            $('.content-area').prepend(frameStr);
                        }
                    }
                    // YouTube Video Post By iframe                   
                    else if( $coverContent.is('iframe[src*="//www.youtube.com"]') || $coverContent.has('iframe[src*="//www.youtube.com"]').length ){
                        $('.post').addClass('cover-frame');
                        var $videoEl = $coverContent.find('iframe[src*="//www.youtube.com"]');
                        if( !$videoEl.length ){
                            $videoEl = $coverContent;
                        }                        
                        var regExp=/youtube(-nocookie)?\.com\/(embed|v)\/([\w_-]+)/;                        
                        var regResult= $videoEl.attr('src').match(regExp);
                        if(regResult[3] != undefined && regResult[3]!=''){
                            var youtubeId = regResult[3];
                            $banner.append('<div class="background" style="background-image: url(http://i3.ytimg.com/vi/' + youtubeId + '/mqdefault.jpg);" data-bottom-top="transform: translate3d(0px,-200px, 0px);" data-top-bottom="transform: translate3d(0px,200px, 0px);" data-center="transform: translate3d(0px,0px, 0px);"></div>');
                        }
                    }
                    // Vimeo Video Post By link
                    else if($coverContent.has('a[href*="vimeo.com"]').length){
                        var $vimeoVideoEl = $coverContent.find('a[href*="vimeo.com"]');
                        var vimeoVideoUrl = $vimeoVideoEl.attr('href');
                        var regExp = /vimeo.com\/(\d+)/;
                        var vimeoId ='';
                        var regResult= vimeoVideoUrl.match(regExp);
                        if(regResult.length && regResult[1] !='' ){
                            vimeoId=regResult[1];
                        }
                        if( vimeoId != '' ){
                            $.ajax({
                                type: 'GET',
                                url: 'http://vimeo.com/api/v2/video/'+vimeoId+'.json',
                                dataType: "json",
                                success: function(result) {
                                    if(result.length){
                                        $banner.append('<div class="background" style="background-image: url(' + result[0].thumbnail_large + ');" data-bottom-top="transform: translate3d(0px,-200px, 0px);" data-top-bottom="transform: translate3d(0px,200px, 0px);" data-center="transform: translate3d(0px,0px, 0px);"></div>');
                                    }
                                }
                            });
                            var frameStr = '<iframe class="sf-vimeo-video cover-frame" id="vimeo_video_' + sfApp.vimeo_videos + '" width="853" height="480" src="//player.vimeo.com/video/' + vimeoId + '?api=1&player_id=vimeo_video_' + sfApp.vimeo_videos + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
                            $('.content-area').prepend(frameStr);
                        }
                    }
                    // Vimeo Video Post By iframe
                    else if( $coverContent.is('iframe[src*="//player.vimeo.com"]') || $coverContent.has('iframe[src*="//player.vimeo.com"]').length ) {
                        $('.post').addClass('cover-frame');
                        var $vimeoVideoEl = $coverContent.find('iframe[src*="//player.vimeo.com"]');
                        if( !$vimeoVideoEl.length ) {
                            $vimeoVideoEl = $coverContent;
                        }                        
                        var vimeoVideoUrl = $vimeoVideoEl.attr('src');
                        var vimeoId ='';
                        var regExp = /video\/(\d+)/;
                        var regResult= vimeoVideoUrl.match(regExp);
                        if(regResult.length && regResult[1]!=''){
                            vimeoId=regResult[1];
                        }
                        if(vimeoId!=''){                            
                            $.ajax({
                                type: 'GET',
                                url: 'http://vimeo.com/api/v2/video/'+vimeoId+'.json',
                                dataType: "json",
                                success: function(result) {
                                    if(result.length){
                                        $banner.append('<div class="background" style="background-image: url(' + result[0].thumbnail_large + ');" data-bottom-top="transform: translate3d(0px,-200px, 0px);" data-top-bottom="transform: translate3d(0px,200px, 0px);" data-center="transform: translate3d(0px,0px, 0px);"></div>');                                         
                                    }
                                }
                            });
                        } 
                    }
                    // SoundCloud Audio Post By Link
                    else if($coverContent.has('a[href*="soundcloud.com"]').length){                        
                        var $audioEl=$coverContent.find('a[href*="soundcloud.com"]');
                        if($audioEl.length){
                            $.getJSON( 'http://api.soundcloud.com/resolve.json?url=' + $audioEl.attr('href') + '&client_id=425fc6ee65a14efbb9b83b1c49a87ccb', function(data) {                                      
                                if( data.artwork_url != null && data.artwork_url != '' ) {
                                    var artwork_url=data.artwork_url.replace('-large','-t500x500');
                                    $banner.append('<div class="background" style="background-image: url(' + artwork_url + ');" data-bottom-top="transform: translate3d(0px,-200px, 0px);" data-top-bottom="transform: translate3d(0px,200px, 0px);" data-center="transform: translate3d(0px,0px, 0px);"></div>');
                                }
                            });
                            var frameStr = '<iframe class="cover-frame" width="100%" height="450" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=' + $audioEl.attr('href') + '&amp;auto_play=false&amp;hide_related=true&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false&amp;visual=true"></iframe>';
                            $('.content-area').prepend(frameStr);
                            console.log('audio');
                        }
                    }
                    // SoundCloud Audio Post By iframe
                    else if($coverContent.is('iframe[src*="soundcloud.com"]').length){
                        $('.post').addClass('cover-frame');
                    }
                    // Image Post
                    else if( $coverContent.has('img[alt*="image-post"]').length ) {
                    }
                }
            }
        }
    },
    prepareBlogCovers:function(){                
        // Apply cover for All Custom Post Format
    	if( $('.post').length ) {    		
			var media_preview_mode = 'popup';
			if( $('body').data('cover-preview-by') ){
				media_preview_mode = $('body').data('cover-preview-by');
			}
    		$( '.post:not(.formated)' ).each(function(){
    			var $post = $(this);
    			var $cover = $post.find('.post-cover');
    			var $coverContent = $post.find('.post-cover .temp-cover');
    			var $action = $post.find('.post-cover .cover-action');
    			if( $coverContent.length ){		    				
    				// YouTube Video Post By LINK
                	if( $coverContent.has('a[href*="youtube.com"]').length ){	  
                		var $videoEl = $coverContent.find('a[href*="youtube.com"]');
                		if($videoEl.length){
                            var videoUrl = $videoEl.attr('href');
                            var youtubeId = videoUrl.match(/[\\?&]v=([^&#]*)/)[1];
                            if('' !== videoUrl){
	                    		$post.addClass('video-format youtube'); 
	                    		$action.addClass('video');                 		
	                    		// Get YouTube Cover
	                    		if( !$post.is( '.has-cover' ) ){			                            	
	                            	$cover.append('<img src="http://i3.ytimg.com/vi/' + youtubeId + '/mqdefault.jpg" alt="" class="img-responsive"/>');
	                            	$post.addClass('has-cover');                    
	                    		}
	                    		if( 'popup' === media_preview_mode ) {
                            		$action.attr('href', videoUrl);
                            		$action.magnificPopup({                                            
                                        type: 'iframe',
                                        mainClass: 'mfp-fade',
                                        removalDelay: 160,
                                        preloader: false,
                                        fixedContentPos: false
                                    });
                            	}
                            	else if( 'explain' === media_preview_mode ){		                            		
                            		var frameStr = '<iframe id="youtube_video_' + sfApp.youtube_videos + '" width="853" height="480" src="https://www.youtube.com/embed/'+ youtubeId + '?rel=0&amp;controls=0&amp;showinfo=0&amp;enablejsapi=1&amp;html5=1" frameborder="0" allowfullscreen></iframe>';		                            		
                        			$coverContent.html(frameStr);
                        			$coverContent.fitVids();	
                        			sfApp.youtube_videos = sfApp.youtube_videos + 1;	                            		
                            	}
	                    	}
	                    }
                	}
                	// YouTube Video Post By iframe                   
                	else if( $coverContent.has('iframe[src*="//www.youtube.com"]').length || $coverContent.has('.fluid-width-video-wrapper iframe[src*="//www.youtube.com"]').length ){	                    			                    		
                		$post.addClass('cover-frame');
                        var $videoEl = $coverContent.find('iframe[src*="//www.youtube.com"]');
                		if( !$videoEl.length ){
                			$videoEl = $coverContent.find('.fluid-width-video-wrapper iframe[src*="//www.youtube.com"]');
                		}                        
                		var regExp=/youtube(-nocookie)?\.com\/(embed|v)\/([\w_-]+)/;                        
	                    var regResult= $videoEl.attr('src').match(regExp);
	                    if(regResult[3] != undefined && regResult[3]!=''){
	                    	var youtubeId = regResult[3];
	                    	$post.addClass('video-format youtube'); 
	                    	$action.addClass('video'); 
	                    	// Get YouTube Cover
                    		if( !$post.is( '.has-cover' ) ){			                            	
                            	$cover.append('<img src="http://i3.ytimg.com/vi/' + youtubeId + '/mqdefault.jpg" alt="" class="img-responsive"/>');
                            	$post.addClass('has-cover');                    
                    		}
                    		if( 'popup' === media_preview_mode ) {
                        		$action.attr('href', 'https://www.youtube.com/watch?v=' + youtubeId );
                        		$action.magnificPopup({                                            
                                    type: 'iframe',
                                    mainClass: 'mfp-fade',
                                    removalDelay: 160,
                                    preloader: false,
                                    fixedContentPos: false
                                });
                        	}
                        	else if( 'explain' === media_preview_mode ){
                        		$videoEl.attr('id', 'youtube_video_' + sfApp.youtube_videos );	 
                        		// Reset iframe src
                        		$videoEl.attr('src', 'https://www.youtube.com/embed/'+ youtubeId + '?rel=0&amp;controls=0&amp;showinfo=0&amp;enablejsapi=1&amp;html5=1');	                            		  
                        		sfApp.youtube_videos = sfApp.youtube_videos + 1;                         		
                        	}
	                    }
                	}
                	// Vimeo Video Post By link
                	else if($coverContent.has('a[href*="vimeo.com"]').length){
                		var $vimeoVideoEl = $coverContent.find('a[href*="vimeo.com"]');
	                    var vimeoVideoUrl = $vimeoVideoEl.attr('href');
	                    var regExp = /vimeo.com\/(\d+)/;
	                    var vimeoId ='';
	                    var regResult= vimeoVideoUrl.match(regExp);
	                    if(regResult.length && regResult[1] !='' ){
	                        vimeoId=regResult[1];
	                    }
	                    if( vimeoId != '' ){
	                    	$post.addClass('video-format vimeo'); 
	                    	$action.addClass('video vimeo'); 
	                    	if( !$post.is('.has-cover') ){
	                    		$.ajax({
	                                type: 'GET',
	                                url: 'http://vimeo.com/api/v2/video/'+vimeoId+'.json',
	                                dataType: "json",
	                                success: function(result) {
	                                    if(result.length){
	                                    	$cover.append('<img src="' + result[0].thumbnail_large + '" alt="" class="img-responsive"/>');
                            				$post.addClass('has-cover');
	                                    }
	                                }
	                            });
	                        }
                            if( 'popup' === media_preview_mode ) {
                            	$action.attr('href', vimeoVideoUrl );
                        		$action.magnificPopup({                                            
                                    type: 'iframe',
                                    mainClass: 'mfp-fade',
                                    removalDelay: 160,
                                    preloader: false,
                                    fixedContentPos: false
                                });
                            }
                            else if( 'explain' === media_preview_mode ){
                            	var frameStr = '<iframe class="sf-vimeo-video" id="vimeo_video_' + sfApp.vimeo_videos + '" width="853" height="480" src="//player.vimeo.com/video/' + vimeoId + '?api=1&player_id=vimeo_video_' + sfApp.vimeo_videos + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';		                            		
                    			$coverContent.html(frameStr);
                    			$coverContent.fitVids();	
                    			sfApp.vimeo_videos = sfApp.vimeo_videos + 1;                            			
                            }
	                    }
                	}
                	// Vimeo Video Post By iframe
                	else if( $coverContent.has('iframe[src*="//player.vimeo.com"]').length || $coverContent.has('.fluid-width-video-wrapper iframe[src*="//player.vimeo.com"]').length ) {
                        $post.addClass('cover-frame');
                		var $vimeoVideoEl = $coverContent.find('iframe[src*="//player.vimeo.com"]');
                		if( !$vimeoVideoEl.length ) {
                			$vimeoVideoEl = $coverContent.find('.fluid-width-video-wrapper iframe[src*="//player.vimeo.com"]');
                		}
	                    var vimeoVideoUrl = $vimeoVideoEl.attr('src');
	                    var vimeoId ='';
	                    var regExp = /video\/(\d+)/;
	                    var regResult= vimeoVideoUrl.match(regExp);
	                    if(regResult.length && regResult[1]!=''){
	                        vimeoId=regResult[1];
	                    }
	                    if(vimeoId!=''){
	                    	$post.addClass('video-format vimeo'); 
	                    	$action.addClass('video');
	                    	if( !$post.is('.has-cover') ){
	                    		$.ajax({
	                                type: 'GET',
	                                url: 'http://vimeo.com/api/v2/video/'+vimeoId+'.json',
	                                dataType: "json",
	                                success: function(result) {
	                                    if(result.length){
	                                    	$cover.append('<img src="' + result[0].thumbnail_large + '" alt="" class="img-responsive"/>');
                            				$post.addClass('has-cover');
	                                    }
	                                }
	                            });
	                        } 
	                        if( 'popup' === media_preview_mode ) {
	                        	// need work
                            	$action.attr('href', vimeoVideoUrl );
                        		$action.magnificPopup({                                            
                                    type: 'iframe',
                                    mainClass: 'mfp-fade',
                                    removalDelay: 160,
                                    preloader: false,
                                    fixedContentPos: false
                                });
                            }
                            else if( 'explain' === media_preview_mode ){
                            	$vimeoVideoEl.addClass('sf-vimeo-video');
                            	$vimeoVideoEl.attr('id', 'vimeo_video_' + sfApp.vimeo_videos );	 
                        		// Reset iframe src
                        		$vimeoVideoEl.attr('src', '//player.vimeo.com/video/' + vimeoId + '?api=1&player_id=vimeo_video_' + sfApp.vimeo_videos );	                            		  
                        		sfApp.vimeo_videos = sfApp.vimeo_videos + 1;   
                            }
	                    }
                	}
                	// SoundCloud Audio Post By Link
                	else if($coverContent.has('a[href*="soundcloud.com"]').length){
                		var $audioEl=$coverContent.find('a[href*="soundcloud.com"]');
                		if($audioEl.length){
                    		$post.addClass('audio-format soundcloud'); 
		                    $action.addClass('audio soundcloud');
                    		if( !$post.is('.has-cover') ){	                    			
                    			$.getJSON( 'http://api.soundcloud.com/resolve.json?url=' + $audioEl.attr('href') + '&client_id=425fc6ee65a14efbb9b83b1c49a87ccb', function(data) {	                    				
		                            if( data.artwork_url != null && data.artwork_url != '' ) {
		                                var artwork_url=data.artwork_url.replace('-large','-t500x500');
		                                $cover.append('<img src="' + artwork_url + '" alt="" class="img-responsive"/>');
	                            		$post.addClass('has-cover');
		                            }
		                        });
                    		}
                    		if( 'popup' === media_preview_mode ) {
                    			$action.attr('href', 'https://w.soundcloud.com/player/?url=' + $audioEl.attr('href') + '&amp;auto_play=true&amp;hide_related=true&amp;show_comments=false&amp;show_user=false&amp;show_reposts=false&amp;visual=true' );
                        		$action.magnificPopup({                                            
                                    type: 'iframe',
                                    mainClass: 'mfp-fade',
                                    removalDelay: 160,
                                    preloader: false,
                                    fixedContentPos: false
                                });
                    		}
                    		else if( 'explain' === media_preview_mode ){
                    			var apiUrl='http://api.soundcloud.com/resolve.json?url='+$audioEl.attr('href')+'&client_id=425fc6ee65a14efbb9b83b1c49a87ccb';
		                        $.getJSON(apiUrl, function(data) {
		                            if(data.id) {                                                                                                                                         
		                                $cover.append('<div class="sf-audio-player"></div>');
		                                var $audioPlayer=$cover.find('.sf-audio-player');
		                                $audioPlayer.attr('data-track-id', data.id );    
		                                $audioPlayer.attr('data-track-index', sfApp.sc_audios);                       
		                                $action.attr('data-track-index',sfApp.sc_audios);
		                                sfApp.sc_audios = sfApp.sc_audios + 1;
		                                var waveformColorOptions={
		                                    defaultColor: 'rgba(255,255,255,0.4)',
		                                    loadedColor: 'rgba(69,69,69,0.8)',
		                                    playedColor: 'rgba(255,102,0,0.8)',
		                                };                                			                                
		                                SC.get("/tracks/" + data.id, function(track){                        
		                                    var waveform = new Waveform({
		                                        container: $audioPlayer[0],
		                                        innerColor: waveformColorOptions.defaultColor,                            
		                                    });
		                                    waveform.dataFromSoundCloudTrack(track);
		                                    var streamOptions = waveform.optionsForSyncedStream(waveformColorOptions);
		                                    var onfinishOptions = {
		                                        onfinish: function(){ 
		                                            $action.removeClass('playing');   
		                                            var $topArea = $post.find('.top-area');
		                                            $topArea.css({'margin-top': '-60px'});
                                                    if( $('body').is('.sf-masonry') ) {
                                                        setTimeout(function() {
                                                            sfApp.gridRefresh();
                                                        }, 200);
                                                    }
		                                        }
		                                    }
		                                    jQuery.extend( streamOptions, onfinishOptions );
		                                    SC.stream(track.uri, streamOptions, function(stream){
		                                        sf_sc_players.push(stream);                            
		                                    });  
		                                });           			                                			                                			                                
		                            }
		                        }); 
                    		}
                    	}
                	}
                	// SoundCloud Audio Post By iframe
                	else if( $coverContent.has('iframe[src*="soundcloud.com"]').length ){
                        $post.addClass('cover-frame');
                        var $audioEl=$coverContent.find('iframe[src*="soundcloud.com"]');
                        if($audioEl.length){                            
                            $post.addClass('audio-format soundcloud'); 
                            $action.addClass('audio soundcloud');
                            var trackID = '';
                            var regExp =/soundcloud.com\/tracks\/(\d+)/;                    
                            var regResult= $audioEl.attr('src').match(regExp);                        
                            if(regResult.length && regResult[1]!=''){
                                trackID = regResult[1];
                            }
                            if(trackID!=''){
                                if( !$post.is('.has-cover') ){      
                                    $.ajax({
                                        type: 'GET',
                                        url: 'http://api.soundcloud.com/tracks/'+regResult[1]+'.json?client_id=425fc6ee65a14efbb9b83b1c49a87ccb',
                                        dataType: "json",
                                        success: function(data) {                                                                                                
                                            if( data.artwork_url != null && data.artwork_url != '' ) {
                                                var artwork_url=data.artwork_url.replace('-large','-t500x500');
                                                $cover.append('<img src="' + artwork_url + '" alt="" class="img-responsive"/>');
                                                $post.addClass('has-cover');
                                            }
                                        }
                                    });
                                }      
                                if( 'popup' === media_preview_mode ) {
                                }
                                else if( 'explain' === media_preview_mode ){
                                    $cover.append('<div class="sf-audio-player"></div>');
                                    var $audioPlayer=$cover.find('.sf-audio-player');
                                    $audioPlayer.attr('data-track-id', trackID );    
                                    $audioPlayer.attr('data-track-index', sfApp.sc_audios);                       
                                    $action.attr('data-track-index',sfApp.sc_audios);
                                    sfApp.sc_audios = sfApp.sc_audios + 1;
                                    var waveformColorOptions={
                                        defaultColor: 'rgba(255,255,255,0.4)',
                                        loadedColor: 'rgba(69,69,69,0.8)',
                                        playedColor: 'rgba(255,102,0,0.8)',
                                    };                                                                          
                                    SC.get("/tracks/" + trackID, function(track){                        
                                        var waveform = new Waveform({
                                            container: $audioPlayer[0],
                                            innerColor: waveformColorOptions.defaultColor,                            
                                        });
                                        waveform.dataFromSoundCloudTrack(track);
                                        var streamOptions = waveform.optionsForSyncedStream(waveformColorOptions);
                                        var onfinishOptions = {
                                            onfinish: function(){ 
                                                $action.removeClass('playing');   
                                                var $topArea = $post.find('.top-area');
                                                $topArea.css({'margin-top': '-60px'});
                                                if( $('body').is('.sf-masonry') ) {
                                                    setTimeout(function() {
                                                        sfApp.gridRefresh();
                                                    }, 200);
                                                }
                                            }
                                        }
                                        jQuery.extend( streamOptions, onfinishOptions );
                                        SC.stream(track.uri, streamOptions, function(stream){
                                            sf_sc_players.push(stream);                            
                                        });  
                                    });
                                }
                            }
                        }
                	}
                	// Image Post
                	else if( $coverContent.has('img[alt*="image-post"]').length ) {     
                		$post.addClass('image-format'); 
		                $action.addClass('image');               		
                		var $imageEl=$coverContent.find('img[alt*="image-post"]');
                		if( $imageEl.length ) {
                    		if( !$post.is('.has-cover') ){	                    			
                    			$cover.append('<img src="' + $imageEl.attr('src') + '" alt="" class="img-responsive"/>');                    			
	                            $post.addClass('has-cover');
                    		}
                    	}
                    	if( 'popup' === media_preview_mode ) {
                			var $realImg = $cover.find('img');
                    		$action.attr('href', $realImg.attr('src') );
                    		$action.magnificPopup({
	                            type: 'image',
	                            tLoading: '',
	                        });
	                    }		                    
                	}
                	else if( $post.is( '.has-cover' ) ) {
                		$post.addClass('image-format'); 
		                $action.addClass('image');
                		if( 'popup' === media_preview_mode ) {
                    		var $realImg = $cover.find('img');
                    		$action.attr('href', $realImg.attr('src') );
                    		$action.magnificPopup({
	                            type: 'image',
	                            tLoading: '',
	                        });
	                    }		                    
                	}
    			}
    			$post.addClass('formated');
    		});
			sfApp.maybeInitAPI();
            sfApp.gridInit();
    	}
    },	    
    gridInit:function(){
        if( $('body').is('.sf-masonry') && $('.post-list').length ) {
            var $grid = $('.post-list');
            $('.post-list .post').imagesLoaded(function(){
                $grid.isotope({                    
                    itemSelector: '.masonry-item',                                  
                    masonry: {
                        columnWidth: '.masonry-item'
                    }                
                });      
            });                        
        }
    },
    gridRefresh:function(){
        if( $('body').is('.sf-masonry') && $('.post-list').length ) {    
            console.log('gridRefresh');        
            var $grid = $('.post-list');
            $grid.isotope();            
        }
    },    
    maybeInitAPI:function(){
    	if( 'explain' === $('body').data('cover-preview-by') ){
	    	if( sfApp.youtube_videos > 0 ){
	    		// Add YouTube Player API
	    		(function(d, s, id){
                 	var js, sjs = d.getElementsByTagName(s)[0];
                 	if (d.getElementById(id)) {
                 		return;
                	}
                 	js = d.createElement(s);
                 	js.id = id;
                 	js.src = "http://www.youtube.com/player_api";
                 	sjs.parentNode.insertBefore(js, sjs);
               	}(document, 'script', 'sf-youtube-api'));
	    	}
	    	if( sfApp.vimeo_videos > 0 ){
	    		// Process Vimeo API
	    		sfApp.processVimeoAPI();
	    	}
	    }
    },    
    processVimeoAPI:function(){	 
    	sf_vmavailable = true;   	
    	$('.post.video-format.vimeo').each(function() {    	
	    	var $post = $(this);    	
	    	var $frame = $post.find('.post-cover .temp-cover .fluid-width-video-wrapper iframe[src*="//player.vimeo.com"]');
	    	if($frame.length){    		
		        var identifier = $frame.attr('id');
		        if ( identifier ) { //If the frame exists	      			        	
		            sf_vmplayers.push(identifier);
		        }
		    }
	    });		    		    
		$('.sf-vimeo-video').on('finish', function(event){
			var $frame = $(event.target);
			var $post = $frame.closest('.post');
			var $topArea = $post.find('.top-area');
			var $cover = $post.find('.post-cover');
			var $action = $cover.find('.cover-action');
			var $coverImg = $cover.find('img');
			var $coverContent = $cover.find('.temp-cover');
			$coverContent.fadeOut(200,function() {
				$coverImg.fadeIn(200);
				$topArea.css({'margin-top': '-60px'});
				$action.removeClass('playing explained');
                if( $('body').is('.sf-masonry') ) {
                    setTimeout(function() {
                        sfApp.gridRefresh();
                    }, 200);
                }
			});
		});
		$('.cover-action.vimeo').click(function(){
			var $this = $(this);
			var $post = $this.closest('.post');
			var $topArea = $post.find('.top-area');
			var $cover = $post.find('.post-cover');
			var $coverImg = $cover.find('img');
			var $coverContent = $cover.find('.temp-cover');
			var $frame = $coverContent.find('.fluid-width-video-wrapper .sf-vimeo-video');
			if( $frame.length && $coverImg.length && $topArea.length ){
				if($this.is('.paused')){
					$frame.vimeo('play'); 
					$this.removeClass('paused');
    				$this.addClass('playing');
				}
				else if( $this.is('.playing') ) {
					$frame.vimeo('pause');
					$this.removeClass('playing');
    				$this.addClass('paused');        
    			}
    			else{
    				// Pause youtube videos
					if( sf_yavailable ){
						$.each( sf_yplayers, function( key, value ) {							
							sf_yplayers[key].pauseVideo();
							sfApp.externalPauseMedia(key);
						});
					}
					// Pause other videos
					$.each( sf_vmplayers, function( key, value ) {
						if( value != $frame.attr('id') ) {
							$('#'+value).vimeo('pause');
						}
					});
    				$coverImg.fadeOut(200,function() {
    					$coverContent.fadeIn(200);
    					$frame.vimeo('play');        					        					
    					$topArea.css({'margin-top': '1px'});
                        if( $('body').is('.sf-masonry') ) {       
                            setTimeout(function() {
                                sfApp.gridRefresh();
                            }, 200);
                        }
    				});
    				$this.addClass('playing explained');
    			}
			}				
		});
    },	            
    otherEvents:function(){    	
		$(document).on('click','.sf-audio-player', function(event) {            
            var $this=$(this);
            var $cover=$this.closest('.post-cover');  
            var $action = $cover.find('.cover-action');            
            if( $action.is('.playing')){
            	var posX = event.pageX - $this.offset().left;
                sfApp.audioScrub( $this, posX );
            }
            else{
                console.log('audio not playing');
            }            
            return false;
        });
    },
    audioScrub:function($element,xPos){   
    	console.log(xPos); 	
        var stream = sf_sc_players[$element.attr('data-track-index')];        
        var needSeek = Math.floor( Math.min( ( stream.bytesLoaded / stream.bytesTotal ), ( xPos / $element.width() ) ) * stream.durationEstimate );
        console.log('seek to:'+needSeek );
        stream.setPosition(needSeek);
    },
    externalPauseMedia:function(frameID){
    	var $frame = $('#'+frameID);
		var $post = $frame.closest('.post');			
		var $action = $post.find('.post-cover .cover-action');			
		$action.removeClass('playing');
    },
    coverActionEvents:function(){
    	$(document).on('click','.cover-action.audio.soundcloud', function(event) {
    		var $this = $(this);    		
    		var $post = $this.closest('.post');
    		var $cover = $post.find('.post-cover');
    		var $topArea = $post.find('.top-area');
    		if($this.is('.paused')){				
				$this.removeClass('paused');
				$this.addClass('playing');
			}
			else if( $this.is('.playing') ) {									
				$this.removeClass('playing');
				$this.addClass('paused');        
			}
			else{				
				if(sfApp.sc_audios > 1){
					$.each(sf_sc_players, function( index, stream ) {                    
	                    if( index != $this.attr('data-track-index') ){                        
	                        sf_sc_players[index].pause();                        
	                    }                             
	                });	
				}                
                $topArea.css({'margin-top': '1px'});
                $this.addClass('playing explained');
                if( $('body').is('.sf-masonry') ) {
                    setTimeout(function() {
                        sfApp.gridRefresh();
                    }, 200);
                }
			}
            sf_sc_players[$this.attr('data-track-index')].togglePause();  
            return false;
    	});
    	$(document).on('click','.cover-action.image', function(event) {  
    		var $this = $(this);    		
    		var $post = $this.closest('.post');
    		var $cover = $post.find('.post-cover');
    		var $topArea = $post.find('.top-area');
    		if($this.is('.opened')){				
				$this.removeClass('opened explained');
				$topArea.css({'margin-top': '-60px'});                
			}			
			else{								               
                $topArea.css({'margin-top': '1px'});
                $this.addClass('opened explained');
			}
            if( $('body').is('.sf-masonry') ) {
                setTimeout(function() {
                    sfApp.gridRefresh();
                }, 200);
            }
    	});
    },
    nextPrevPost:function(){
        if($('.next-prev-posts').length){
            var page = 0;
            var isFound=false;            
            var result = new Array();            
            var $prevPost = null;
            var $prevPostLastPage = null;
            var currentUrl = $('.next-prev-posts').data('current-url');
            console.log('process page: '+page);
            if(currentUrl != ''){
                var timeout = setInterval(function(){
                    page=page+1;
                    var ajaxUrl=rootUrl+'/rss/'+page+'/';
                    if(page==1){
                        ajaxUrl=rootUrl+'/rss/';
                    }
                    $.ajax({
                        type: 'GET',
                        url: ajaxUrl,
                        dataType: "xml",
                        success: function(xml) {
                            console.log('process page: '+page);
                            if($(xml).length){   
                                var total = $('item', xml).length;                                                        
                                $('item', xml).each( function(index, element) {                                    
                                    if(index==0){
                                        $prevPost = null;
                                    }                                    
                                    if(index>1){
                                        $prevPostLastPage = null;
                                    }
                                    if(index == total-1){
                                        $prevPostLastPage = $(element);   
                                    }                                                                        
                                    // Found next
                                    if(isFound){
                                        sfApp.fillNextPrevPostData('next',$(element));
                                        if($prevPostLastPage!=null){
                                            sfApp.fillNextPrevPostData('prev',$prevPostLastPage);
                                        }                                                                                              
                                        clearInterval(timeout);                                        
                                        return false;                     
                                    }
                                    else if(currentUrl == $(element).find('link').eq(0).text()){
                                        isFound = true;                                                          
                                        if(index>0){
                                            sfApp.fillNextPrevPostData('prev',$(xml).find('item').eq(index-1));                                                                                 
                                        }                      
                                    }                                    
                                });
                            }
                        }
                    });
                }, 2000);                                
            }
        }
    },
    fillNextPrevPostData:function( type, data ){
        var $container = $('.next-prev-posts');
        $( '.'+ type, $container ).attr( 'href', $( data ).find( 'link' ).eq(0).text());
        $( '.'+ type, $container ).attr( 'title', $( data ).find( 'title' ).eq(0).text());
        $( '.'+ type + ' h4', $container ).html( $( data ).find( 'title' ).eq(0).text());
        $( '.' + type, $container ).addClass( 'has-result' );
        var nextBoxHeight = $( '.next', $container ).outerHeight();
        var prevBoxHeight = $( '.prev', $container ).outerHeight();
        if( nextBoxHeight > prevBoxHeight ) {            
            $( '.prev', $container ).css( { height: nextBoxHeight } );
        }
        else{            
            $( '.next', $container ).css( { height: prevBoxHeight } );
        }
        $container.addClass( 'has-result' );	                
        var $desc = $($(data).find('description').eq(0).text());        
        if($desc.first().is('iframe')){
            var $iframeEl=$desc.first();
            var frameSrc=$desc.first().attr('src');
            if(frameSrc.indexOf('youtube.com')>=0){
                var regExp=/youtube(-nocookie)?\.com\/(embed|v)\/([\w_-]+)/;
                var youtubeId ='';
                var regResult= frameSrc.match(regExp);                                                
                if(regResult[3] != 'undefined' && regResult[3]!=''){
                    $('.'+type,$container).css('background-image', 'url("'+'http://i3.ytimg.com/vi/'+regResult[3]+'/0.jpg'+'")'); 
                    $('.'+type,$container).addClass('has-background');  
                }   
            }
            else if(frameSrc.indexOf('vimeo.com')>=0){                                                      
                var regExp = /video\/(\d+)/;                                                
                var regResult= frameSrc.match(regExp);
                if(regResult[1] != 'undefined' && regResult[1] != ''){
                    var vimeoUrl='http://vimeo.com/api/v2/video/'+regResult[1]+'.json';
                    console.log(vimeoUrl);
                    $.ajax({
                        type: 'GET',
                        url: vimeoUrl,
                        dataType: "json",
                        success: function(vimeoResult) {
                            if(vimeoResult.length){
                                $('.'+type,$container).css('background-image', 'url("'+vimeoResult[0].thumbnail_large+'")');  
                                $('.'+type,$container).addClass('has-background');                              
                            }
                        }
                    });
                }
            }
            // Audio Post By iframe
            else if(frameSrc.indexOf('soundcloud.com')>=0){                
                var regExp =/soundcloud.com\/tracks\/(\d+)/;                    
                var regResult= frameSrc.match(regExp);                        
                if(regResult.length && regResult[1]!=''){
                    $.ajax({
                        type: 'GET',
                        url: 'http://api.soundcloud.com/tracks/'+regResult[1]+'.json?client_id=425fc6ee65a14efbb9b83b1c49a87ccb',
                        dataType: "json",
                        success: function(result) {
                            if( result.artwork_url !=null && result.artwork_url != '' ) {
                                var artwork_url=result.artwork_url.replace('-large','-t500x500');
                                $('.'+type,$container).css('background-image', 'url("'+artwork_url+'")');  
                                $('.'+type,$container).addClass('has-background');
                            }
                        }
                    });
                }
            }   
        }	        
        else if($desc.has('img[alt*="post-cover"]').length){
            var $backgroundEl = $desc.find('img[alt*="post-cover"]');
            if($backgroundEl.length){                                                
                $('.'+type,$container).css('background-image', 'url("'+$backgroundEl.attr('src')+'")');
                $('.'+type,$container).addClass('has-background');                
            }
        } 
        else if($desc.has('a[href*="youtube.com"]').length){                                            
            var $videoEl=$desc.find('a[href*="youtube.com"]');
            if($videoEl.length){
                var videoUrl=$videoEl.attr('href');
                if(videoUrl!=''){
                    var youtubeId = videoUrl.match(/[\\?&]v=([^&#]*)/)[1];
                    if(youtubeId!=''){
                        $('.'+type,$container).css('background-image', 'url("'+'http://i3.ytimg.com/vi/'+youtubeId+'/0.jpg'+'")');                        
                        $('.'+type,$container).addClass('has-background');
                    }
                }
            }
        }                                        
        else if($desc.has('a[href*="vimeo.com"]').length){                                                                            
            var $vimeoVideoEl=$desc.find('a[href*="vimeo.com"]');
            var vimeoVideoUrl=$vimeoVideoEl.attr('href');                                            
            var regExp = /vimeo.com\/(\d+)/;
            var vimeoId ='';
            var regResult= vimeoVideoUrl.match(regExp);
            if(regResult[1] != 'undefined' && regResult[1] != '') {                                                
                var vimeoUrl='http://vimeo.com/api/v2/video/'+regResult[1]+'.json';                                                
                $.ajax({
                    type: 'GET',
                    url: vimeoUrl,
                    dataType: "json",
                    success: function(vimeoResult) {                                                        
                        if(vimeoResult.length && vimeoResult[0].thumbnail_large != ''){
                            $('.'+type,$container).css('background-image', 'url("'+vimeoResult[0].thumbnail_large+'")');
                            $('.'+type,$container).addClass('has-background');
                        }
                    }
                });
            }
        }
        // Audio post by link structure
        else if( $desc.has('a[href*="soundcloud.com"]').length ) {                         
            var $audioEl=$desc.find('a[href*="soundcloud.com"]');            
            $.getJSON( 'http://api.soundcloud.com/resolve.json?url='+$audioEl.attr('href')+'&client_id=425fc6ee65a14efbb9b83b1c49a87ccb', function(data) {
                if( data.artwork_url !=null && data.artwork_url != '' ) {
                    var artwork_url=data.artwork_url.replace('-large','-t500x500');
                    $('.'+type,$container).css('background-image', 'url("'+artwork_url+'")');
                    $('.'+type,$container).addClass('has-background');
                }
            });                       
            
        }
        else if($desc.first().is('img')){
        	var $cover=$desc.first();
        	var coverSrc=$cover.attr('src');
        	if( '/' === coverSrc.charAt(coverSrc.length - 1) ){
        		coverSrc = coverSrc.substring(0, coverSrc.length - 1);	
        	}	        	
        	if( '' !== coverSrc ){
        		$('.'+type,$container).css('background-image', 'url("' + coverSrc + '")');
                $('.'+type,$container).addClass('has-background');
        	}
        }                       
    },
    widgetEvents:function(){
        if($('.recent-posts').length){
            $('.recent-posts').each(function(){
                var $this=$(this);
                var showPubDate = false;
                var showDesc = false;
                var descCharacterLimit = 70;
                var size = 5;   
                if($this.data('size')){
                    size = $this.data('size');                  
                }
                if($this.data('pubdate')){
                    showPubDate = $this.data('pubdate');
                }
                if( $this.data('desc') ) {
                    showDesc = $this.data('desc');
                    if($this.data('character-limit')){
                        descCharacterLimit = $this.data('character-limit');
                    }
                } 
                $this.append('<ul class="recent-post-items"></ul>');                  
                var $recentPostItems = $this.find('.recent-post-items');
                $.ajax({
                    type: 'GET',
                    url: rootUrl + '/rss/',
                    dataType: 'xml',
                    success: function(xml) {
                        if($(xml).length){                            
                            var htmlStr='';                             
                            var count = 0;
                            var date;
                            var descStr;
                            $('item', xml).each( function() {
                                if( size>0 && count < size ) {
                                    htmlStr = '<li>';                                    
                                    htmlStr += '<a class="post-thumb" href="' + $(this).find('link').eq(0).text() + '">';
                                    htmlStr += '<span class="post-title">'+ $(this).find('title').eq(0).text() + '</span>'; 
                                    htmlStr += '</a>';
                                    if ( showPubDate ){
                                        date = new Date( $(this).find('pubDate').eq(0).text() );
                                        htmlStr +='<span class="post-date">' + date.toDateString() + '</span>';
                                    }
                                    if( showDesc ){                                                                                 
                                        descStr = $(this).find('description').eq(0).text();
                                        if (descCharacterLimit > 0 && desc.length > descCharacterLimit) {
                                            htmlStr += '<span class="post-desc">' + desc.substr( 0, descCharacterLimit ) + '</span>';
                                        }
                                        else{
                                            htmlStr += '<span class="desc">' + desc + "</span>";
                                        }
                                    }
                                    htmlStr += '</li>';
                                    $recentPostItems.append(htmlStr);
                                    var $currentThumb = $('li:last .post-thumb', $recentPostItems );
                                    var $desc = $($(this).find('description').eq(0).text());  
                                    if($desc.first().is('iframe')){
                                        var $iframeEl=$desc.first();
                                        var frameSrc=$desc.first().attr('src');
                                        if(frameSrc.indexOf('youtube.com')>=0){
                                            var regExp=/youtube(-nocookie)?\.com\/(embed|v)\/([\w_-]+)/;
                                            var youtubeId ='';
                                            var regResult= frameSrc.match(regExp);                                                
                                            if(regResult[3] != 'undefined' && regResult[3]!=''){
                                                $currentThumb.prepend( '<img src="http://i3.ytimg.com/vi/' + regResult[3]+'/0.jpg' + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );
                                            }   
                                        }
                                        else if(frameSrc.indexOf('vimeo.com')>=0){                                                      
                                            var regExp = /video\/(\d+)/;                                                
                                            var regResult= frameSrc.match(regExp);
                                            if(regResult[1] != 'undefined' && regResult[1] != ''){
                                                var vimeoUrl='http://vimeo.com/api/v2/video/'+regResult[1]+'.json';
                                                console.log(vimeoUrl);
                                                $.ajax({
                                                    type: 'GET',
                                                    url: vimeoUrl,
                                                    dataType: "json",
                                                    success: function(vimeoResult) {
                                                        if(vimeoResult.length){
                                                            $currentThumb.prepend( '<img src="' + vimeoResult[0].thumbnail_large + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                                             
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                        // Audio Post By iframe
                                        else if(frameSrc.indexOf('soundcloud.com')>=0){                
                                            var regExp =/soundcloud.com\/tracks\/(\d+)/;                    
                                            var regResult= frameSrc.match(regExp);                        
                                            if(regResult.length && regResult[1]!=''){
                                                $.ajax({
                                                    type: 'GET',
                                                    url: 'http://api.soundcloud.com/tracks/'+regResult[1]+'.json?client_id=425fc6ee65a14efbb9b83b1c49a87ccb',
                                                    dataType: "json",
                                                    success: function(result) {
                                                        if( result.artwork_url !=null && result.artwork_url != '' ) {
                                                            var artwork_url=result.artwork_url.replace('-large','-t500x500');
                                                            $currentThumb.prepend( '<img src="' + artwork_url + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                                            
                                                        }
                                                    }
                                                });
                                            }
                                        }   
                                    }
                                    else if($desc.has('img[alt*="post-cover"]').length){
                                        var $backgroundEl = $desc.find('img[alt*="post-cover"]');
                                        if($backgroundEl.length){      
                                            $currentThumb.prepend( '<img src="' + $backgroundEl.attr('src') + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                            
                                        }
                                    } 
                                    else if($desc.has('a[href*="youtube.com"]').length){                                            
                                        var $videoEl=$desc.find('a[href*="youtube.com"]');
                                        if($videoEl.length){
                                            var videoUrl=$videoEl.attr('href');
                                            if(videoUrl!=''){
                                                var youtubeId = videoUrl.match(/[\\?&]v=([^&#]*)/)[1];
                                                if(youtubeId!=''){
                                                    $currentThumb.prepend( '<img src="http://i3.ytimg.com/vi/' + youtubeId+'/0.jpg' + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                                    
                                                }
                                            }
                                        }
                                    }                                        
                                    else if($desc.has('a[href*="vimeo.com"]').length){                                                                            
                                        var $vimeoVideoEl=$desc.find('a[href*="vimeo.com"]');
                                        var vimeoVideoUrl=$vimeoVideoEl.attr('href');                                            
                                        var regExp = /vimeo.com\/(\d+)/;
                                        var vimeoId ='';
                                        var regResult= vimeoVideoUrl.match(regExp);
                                        if(regResult[1] != 'undefined' && regResult[1] != '') {                                                
                                            var vimeoUrl='http://vimeo.com/api/v2/video/'+regResult[1]+'.json';                                                
                                            $.ajax({
                                                type: 'GET',
                                                url: vimeoUrl,
                                                dataType: "json",
                                                success: function(vimeoResult) {                                                        
                                                    if(vimeoResult.length && vimeoResult[0].thumbnail_large != ''){
                                                        $currentThumb.prepend( '<img src="' + vimeoResult[0].thumbnail_large + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                                        
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    // Audio post by link structure
                                    else if( $desc.has('a[href*="soundcloud.com"]').length ) {                         
                                        var $audioEl=$desc.find('a[href*="soundcloud.com"]');            
                                        $.getJSON( 'http://api.soundcloud.com/resolve.json?url='+$audioEl.attr('href')+'&client_id=425fc6ee65a14efbb9b83b1c49a87ccb', function(data) {
                                            if( data.artwork_url !=null && data.artwork_url != '' ) {
                                                var artwork_url=data.artwork_url.replace('-large','-t500x500');
                                                $currentThumb.prepend( '<img src="' + artwork_url + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );                                                
                                            }
                                        });                       
                                        
                                    }         
                                    else if($desc.first().is('img')){
                                        var $cover=$desc.first();
                                        var coverSrc=$cover.attr('src');
                                        if( '/' === coverSrc.charAt(coverSrc.length - 1) ){
                                            coverSrc = coverSrc.substring(0, coverSrc.length - 1);                                              
                                        }                                                           
                                        if( '' !== coverSrc ){
                                            $currentThumb.prepend( '<img src="' + coverSrc + '" alt="' + $(this).find('title').eq(0).text() + '" class="img-responsive"/>' );
                                        }
                                    }
                                    
                                    count++;
                                }
                                else{
                                    return false;
                                }
                            });                            
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.log(thrownError);
                    }
                });
            });
        }
    	if( $('.flickr-feed').length ){
            $('.flickr-feed').each(function() {
                var flickr_id='';
                if($(this).data('user-id')){
                    flickr_id=$(this).data('user-id');
                }
                if(flickr_id==''){
                    $(this).html('<li><strong>Please enter Flickr user id before use this widget</strong></li>');
                }
                else{
                    var feedTemplate='<li><a href="{{image_b}}" target="_blank"><img src="{{image_m}}" alt="{{title}}" /></a></li>';
                    var size=15;
                    if($(this).data('size'))
                        size=$(this).data('size');
                    var isPopupPreview=false;
                    if($(this).data('popup-preview'))
                        isPopupPreview=$(this).data('popup-preview');
                    if(isPopupPreview){
                        feedTemplate='<li><a href="{{image_b}}"><img src="{{image_m}}" alt="{{title}}" /></a></li>';
                    }
                    $(this).jflickrfeed({
                        limit: size,
                        qstrings: {
                            id: flickr_id
                        },
                        itemTemplate: feedTemplate
                    }, function(data) {
                        if(isPopupPreview){
                            $(this).magnificPopup({
                                delegate: 'a',
                                type: 'image',
                                closeOnContentClick: false,
                                closeBtnInside: false,
                                mainClass: 'mfp-with-zoom mfp-img-mobile',
                                gallery: {
                                    enabled: true,
                                    navigateByImgClick: true,
                                    preload: [0,1] // Will preload 0 - before current, and 1 after the current image
                                },
                                image: {
                                    verticalFit: true,
                                    tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
                                }
                            });
                        }
                    });
                }
            });
        }
        if($('.dribbble-feed').length && $.jribbble ){
            $('.dribbble-feed').each(function(){
                var $this=$(this);
                var userId='';
                if($this.data('userid')){
                    userId = $this.data('userid');
                }
                if( userId != '' ){                    
                    var display=15;
                    if($this.data('display'))
                        display=$this.data('display');
                    var isPopupPreview=false;
                    if($this.data('popup-preview'))
                        isPopupPreview=$this.data('popup-preview');
                    $.jribbble.getShotsByPlayerId(userId, function (listDetails) {                        
                        var html = [];
                        $.each(listDetails.shots, function (i, shot) {
                            html.push('<li><a href="' + shot.url + '"><img src="' + shot.image_teaser_url + '" alt="' + shot.title + '"></a></li>');
                        });
                        $this.html(html.join(''));	                        
                        if(isPopupPreview){
                            $this.magnificPopup({
                                delegate: 'a',
                                type: 'image',
                                tLoading: 'Loading image #%curr%...',
                                closeOnContentClick: true,
                                closeBtnInside: false,
                                fixedContentPos: true,
                                mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
                                image: {
                                    verticalFit: true,
                                    tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
                                },
                                gallery: {
                                    enabled: true,
                                    navigateByImgClick: true,
                                    preload: [0,1] // Will preload 0 - before current, and 1 after the current image
                                }
                            });
                        }
                    }, {page: 1, per_page: display});
                }
                
            });
        }
        if( $( '.instagram-feed' ).length && $.fn.spectragram ) {            
            $( '.instagram-feed' ).each(function(){
                var $this=$(this);
                if( $this.data( 'userid' ) != '' && $this.data( 'api-token' ) != '' && $this.data( 'api-clientid' ) != '' ) {
                    $.fn.spectragram.accessData = {
                        accessToken: $this.data('api-token'),
                        clientID: $this.data('api-clientid')
                    };
                    var display=15;
                    var wrapEachWithStr='<li></li>';
                    if($(this).data('display'))
                        display=$(this).data('display');
                    $(this).spectragram('getUserFeed',{
                        query: $this.data( 'userid' ),
                        max: display
                    });
                }
                else{
                    $(this).html('<li><strong>Please change instagram api access info before use this widget</strong></li>');
                }
            });
        }        
        if($('.sf-tags').length){	        	
        	$('.sf-tags').each(function(){
        		var $this = $(this);
        		if(! sfApp.tags_list.length){
	        		var page = 0;	        	
	        		var maxPage = 0;		        		
					$.ajax({
		                type: 'GET',
		                url: rootUrl,
		                success: function(response){
		                    var $response=$(response);
		                    var postPerPage=$response.find('.post-list .row .post').length; 
		                    var totalPage=parseInt($response.find('.total-page').html());
		                    maxPage=Math.floor( ( postPerPage * totalPage ) / 15 ) +1 ;                                       
		                    var timeout = setInterval(function(){
		                        page = page + 1;                
		                        var ajaxUrl = rootUrl+'/rss/'+page+'/';
		                        if(page==1){
		                            ajaxUrl=rootUrl+'/rss/';
		                        } 
		                        if( page > maxPage ) {
		                            clearInterval(timeout);		
		                            sfApp.fillTagData($this);                            
		                        }
		                        else{                                                                          
		                            $.ajax({
		                                type: 'GET',
		                                url: ajaxUrl,
		                                dataType: 'xml',
		                                success: function(xml) {
		                                    if($(xml).length){                                                           
		                                        $('item', xml).each( function() { 			                                        		                                        	
		                                        	if( $(this).find('category').length ){
		                                        		$(this).find('category').each( function() { 
		                                        			var tag = $(this).text();
															if ( '_full_width' !== tag && '_left_sidebar' !== tag && '_right_sidebar' !== tag && '_both_sidebar' !== tag  && '_full_cover' !== tag ) {
																var tagOj= {'tagName': tag,'total': 1};
																var hasOld=false;
										                        for(var i = 0; i < sfApp.tags_list.length; i++){
										                            if(tag === sfApp.tags_list[i].tagName){
										                                tagOj.total=sfApp.tags_list[i].total+1;
										                                sfApp.tags_list[i]=tagOj;
										                                hasOld=true;
										                                break;
										                            }
										                        }
										                        if(!hasOld){
										                            sfApp.tags_list.push(tagOj);																	
										                        }
															}
		                                        		});
		                                        	}
		                                        });
		                                    }
		                                }
		                            });   
		                        }             
		                    }, 1000); 
		                }
		            }); 
				}
				else{
					sfApp.fillTagData($this);
				}
        	});
        }
        if($('.newsletter-form').length){
            $('.newsletter-form').each(function(){
                var $this = $(this);
                $('input', $this).not('[type=submit]').jqBootstrapValidation({
                    submitSuccess: function ($form, event) {                                       
                        event.preventDefault();                                            
                        var url=$form.attr('action');
                        if(url=='' || url=='YOUR_WEB_FORM_URL_HERE'){
                            alert('Please config your mailchimp form url for this widget');
                            return false;
                        }
                        else{
                            url=url.replace('/post?', '/post-json?').concat('&c=?');
                            var data = {};
                            var dataArray = $form.serializeArray();
                            $.each(dataArray, function (index, item) {
                                data[item.name] = item.value;
                            });
                            $.ajax({
                                url: url,
                                data: data,
                                success: function(resp){                                    
                                    if ( 'success' !== resp.result ) {                                       
                                        $this.find( '.alert .alert-title').html('Error');                                        
                                        $this.find( '.alert').addClass('alert-danger');  
                                    }
                                    $this.find( '.alert .alert-text' ).html( resp.msg );
                                    $this.find('.alert').fadeIn();
                                },
                                dataType: 'jsonp',
                                error: function (resp, text) {
                                    console.log('mailchimp ajax submit error: ' + text);
                                }
                            });
                            return false;
                        }
                        return false;
                    }
                });
            });            
        }
        if( $( '.sf-fb-like-box' ).length ){
        	$( '.sf-fb-like-box' ).each(function(){
        		var page_url = '';
        		if( $(this).data('pageurl') ){
        			page_url = $(this).data('pageurl');	        			
        		}
        		if( '' !== page_url ){
        			var color_scheme = 'light';
        			var $maybe_footer = $(this).closest('.widget-area-wrap');
        			if( $maybe_footer.length && !$('body').is('.dark') ){
        				color_scheme = 'dark';
        			}
        			var htmlStr = '<iframe src="//www.facebook.com/plugins/likebox.php?href=' + page_url + '&amp;width&amp;height=258&amp;colorscheme=' + color_scheme + '&amp;show_faces=true&amp;header=false&amp;stream=false&amp;show_border=false" scrolling="no" frameborder="0" style="border:none; overflow:hidden; height:258px; width:100%;" allowTransparency="true"></iframe>';
        			$(this).html( htmlStr );
        		}
        	});
        }	
        if($('.search-keyword-widget').length){
            $('.search-keyword-widget').keypress(function(event) { 
            	var $this = $(this); 	  	            	          	
                if (event.which == 13) {
                	var $sf_search_widget = $(this).closest('.sf-search-widget');
                	if( $sf_search_widget.length ){
                		var $result_container = $( '.search-result-widget-wrap .search-result-widget-inner .search-result-widget', $sf_search_widget );
                		if( $result_container ){
                			if( $this.val() !='' && $this.val().length>=3 ){                             
		                        $result_container.html('<li class="loading-text">Searching ...</li>');
		                        $result_container.addClass('searching');
		                        var $search_result_wrap = $result_container.closest('.search-result-widget-wrap');
		                        if( $search_result_wrap.length ){
		                        	$search_result_wrap.addClass('scroll');
		                        }			                        
		                        sfApp.search( $this.val(), $result_container );	 	                                               
		                    }
		                    else{
		                        $result_container.html('<li class="loading-text">Please enter at least 3 characters!</li>');
		                        $result_container.addClass('searching');
		                    }
		                    var $form_group = $this.closest('.form-group');
		                    if( $form_group.length ){
			            		var $icon = $('.sf-widget-search-icon', $form_group);	
			            		if( $icon.length ){
			            			$( '.fa', $icon ).removeClass('fa-search');
			            			$( '.fa', $icon ).addClass('fa-times');
			            			$icon.addClass('searched');
			            		}
			            	}
                		}
                	}
                }
            });				
        }      
        $('.sf-widget-search-icon').click(function(){
			var $this = $(this); 
			if($this.is('.searched')){
				$this.removeClass('searched');
				$('.fa', $this).removeClass('fa-times');
				$('.fa', $this).addClass('fa-search');
				var $sf_search_widget = $(this).closest('.sf-search-widget');
            	if( $sf_search_widget.length ){
            		var $search_result_wrap = $( '.search-result-widget-wrap', $sf_search_widget );
            		if( $search_result_wrap.length ){
            			$search_result_wrap.removeClass('scroll');
            		}
            		var $result_container = $( '.search-result-widget-wrap .search-result-widget-inner .search-result-widget', $sf_search_widget );
            		if( $result_container.length ){
            			$result_container.html('');
						$result_container.removeClass('searching');							
            		}
            	}
			}				
		}); 
    },
    fillTagData:function(element){
    	if( $(element).length && sfApp.tags_list.length ) {
    		var items = 10;
    		if($(element).data('max-items')){
    			items = $(element).data('max-items');
    		}
    		var count = 0;
    		if($(element).data('show-count') === "true" ){
    			$(".count").css( "display", "inline-block" );
    		}
	    	var htmlStr = '<ul class="sub-menu">';
	    	$.each( sfApp.tags_list, function( index, tag ) {
	    		var tagLink = tag.tagName.toLowerCase().replace(/ /g, '-');
	    		htmlStr += '<li><a href="' + rootUrl + '/tag/' + tagLink + '"><span class="name">' + tag.tagName + '</span><span class="count">' + tag.total + '</span></a></li>';
			  	count++;
			  	if( count >= items ) {				  		
			  		return false;
			  	}
			});				
	    	htmlStr += '</ul>';
			$(element).append(htmlStr);
			$(".sf-loading").css( "display", "none" );
		}
    },
    paginationEvents:function(){

    },
    scrollEvents:function(){
    	$(window).scroll(function() {
    		// Sticky header
    		if( $('body').data('header-sticky') ){
    			var headerHeight = $('.sf-header').height();	    			
    			if ($(window).scrollTop() > headerHeight ){
    				$('.sf-header').addClass('sticky');
    			} 	
    			else{
    				$('.sf-header').removeClass('sticky');
    			}
    		}
    		// To Top Button
            if ($(window).scrollTop() > $('.main-wrap').offset().top ) {
                $('.go-to-top-wrap').fadeIn();	                	                
            }	            
            else {
                $('.go-to-top-wrap').fadeOut();
            }
        });
    },
    searchEvents:function(){
    	if($('.search-button').length){
            $('.search-button').click(function(){
                $('#search-keyword').val('');
                var $search=$('.search-container');                
                if(!$(this).is('.active')){
                    $('body').addClass('open-search');
                    $search.addClass('open');
                    $(this).addClass('active');                    
                }
                else{
                    $('body').removeClass('open-search');
                    $search.removeClass('open');
                    $(this).removeClass('active');
                    $('.search-result').removeClass('searching');                    
                }
            });
        }
        if($('#search-keyword').length){
            $('#search-keyword').keypress(function(event) {            
                if (event.which == 13) {
                    if( $('#search-keyword').val() !='' && $('#search-keyword').val().length>=3 ){                             
                        $('.search-result').html('<li class="loading-text">Searching ...</li>');
                        $('.search-result').addClass('searching');
                        $('.search-result-wrap').addClass('scroll');
                        sfApp.search($('#search-keyword').val(), $('.search-result') );
                    }
                    else{
                        $('.search-result').html('<li class="loading-text">Please enter at least 3 characters!</li>');
                        $('.search-result').addClass('searching');
                    }
                }
            });
        }
    },
    search:function(keyword, container){
        var hasResult=false;
        var page = 0;
        var maxPage=0;        
        if(keyword != ''){                  
            $.ajax({
                type: 'GET',
                url: rootUrl,
                success: function(response){
                    var $response=$(response);
                    var postPerPage=$response.find('.post-list .row .post').length; 
                    var totalPage=parseInt($response.find('.total-page').html());
                    maxPage=Math.floor((postPerPage*totalPage)/15)+1;                                       
                    var timeout = setInterval(function(){
                        page=page+1;                
                        var ajaxUrl=rootUrl+'/rss/'+page+'/';
                        if(page==1){
                            ajaxUrl=rootUrl+'/rss/';
                        } 
                        if(page>maxPage){
                            clearInterval(timeout);
                            if(!hasResult){
                            	if($('.loading-text', container).length){
                                	$('.loading-text', container).html('Apologies, but no results were found. Please try another keyword!');
                                }
                            }
                        }
                        else{                                                                          
                            $.ajax({
                                type: 'GET',
                                url: ajaxUrl,
                                dataType: "xml",
                                success: function(xml) {
                                    if($(xml).length){                                                           
                                        $('item', xml).each( function() {                                                                          
                                            if($(this).find('title').eq(0).text().toLowerCase().indexOf(keyword.toLowerCase())>=0 ||
                                                    $(this).find('description').eq(0).text().toLowerCase().indexOf(keyword.toLowerCase())>=0){
                                                hasResult=true;
                                                if($('.loading-text', container).length){
                                                    $('.loading-text',container).remove();
                                                }	                                                
                                                container.append('<li><a href="'+$(this).find('link').eq(0).text()+'">'+$(this).find('title').eq(0).text()+'</a></li>');
                                            }                    
                                        });
                                    }
                                }
                            });   
                        }             
                    }, 1000); 
                }
            });                                           
        }
    },
    menuEvents:function(){
    	if($('.mobile-nav-button').length){
            $('.mobile-nav-button').click(function(){                
                var $menu = $('.sf-nav-wrap');                
                if(!$(this).is('.active')){                    
                    $('body').addClass('open-menu');
                    $menu.addClass('open');
                    $(this).addClass('active');    	                                  
                }
                else{
                    $('body').removeClass('open-menu');
                    $menu.removeClass('open');
                    $(this).removeClass('active');	                    
                }
            });
        }   
        $('.sf-nav-widget li.has-children > a').click(function(e){
    		if( '#' === $( this ).attr('href') ){
    			e.preventDefault();	
    		}	        		
    		var $parent = $(this).parent();
    		$('.sub-menu:first', $parent ).slideToggle();
    		if( !$parent.is( '.open' ) ){
    			$parent.addClass('open');
    		}
    		else{
    			$parent.removeClass('open');	
    		}
    	});     
        if( sfApp.isMobile() || $(window).width() <= 1024 ){
        	$('.sf-nav li.has-children > a').click(function(e){
        		if( '#' === $( this ).attr('href') ){
        			e.preventDefault();	
        		}	        		
        		var $parent = $(this).parent();
        		$('.sub-menu:first', $parent ).slideToggle();
        		if( !$parent.is( '.open' ) ){
        			$parent.addClass('open');
        		}
        		else{
        			$parent.removeClass('open');	
        		}
        	});   
        }
    },
    goToTopEvents:function(){	    	
        $('.go-to-top').click(function () {
            $('html, body').animate({scrollTop: 0}, 800);
            return false;
        });	        
    },
    homeScrollDownEvents:function(){
    	$('.more-detail .scrollDown').click(function(){
        	var offset = $('.main-wrap').offset().top;
            if( $('body').data('header-sticky') ) {
                offset -= $('.sf-header').outerHeight();
                if( 'center' === $('body').data('header-layout') ){
                    offset += 48;
                }
                else{
                    offset += 68;
                }
            }
            console.log(offset);
            $('html, body').animate({scrollTop: offset }, 500);
            return false;
        });
    },
    resizeEvents:function(){
    	sfApp.uiRefresh();
    },
    triggerEvents:function(){    	
    	sfApp.homeScrollDownEvents();	    	
    	sfApp.menuEvents();
    	sfApp.widgetEvents();
    	sfApp.nextPrevPost();
    	sfApp.searchEvents();
    	sfApp.scrollEvents();
    	sfApp.resizeEvents();
    	sfApp.goToTopEvents();
    	sfApp.coverActionEvents();
    	sfApp.otherEvents();
    },
    hexColor:function(colorval) {
        var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        delete(parts[0]);
        for (var i = 1; i <= 3; ++i) {
            parts[i] = parseInt(parts[i]).toString(16);
            if (parts[i].length == 1) parts[i] = '0' + parts[i];
        }
        return '#' + parts.join('');
    },
    gmapInit:function(){
        if($('.gmap').length){
            var your_latitude=$('.gmap').data('latitude');
            var your_longitude=$('.gmap').data('longitude');            
            var mainColor=sfApp.hexColor( $('.gmap-container').css('backgroundColor') );
            var myLatlng = new google.maps.LatLng(your_latitude,your_longitude);
            var mapOptions = {
                zoom: 17,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                panControl: false,
                zoomControl: false,
                scaleControl: false,
                streetViewControl: false,
                scrollwheel: false,
                center: myLatlng,
                styles: [{"stylers":[{"hue": mainColor, "lightness" : 100}]}]
            }
            var map = new google.maps.Map(document.getElementById('gmap'), mapOptions);
            var markerIcon = new google.maps.MarkerImage(
                            rootUrl +'assets/img/map-marker.png',
                            null, // size
                            null, // origin
                            new google.maps.Point( 32, 32 ), // anchor (move to center of marker)
                            new google.maps.Size( 64, 64 ) // scaled size (required for Retina display icon)
                        );            
            var marker = new google.maps.Marker({
                position: myLatlng,
                flat: true,
                icon: markerIcon,
                map: map,
                optimized: false,
                title: 'i-am-here',
                visible: true
            });
        }        
    },	  
    prepareUI:function(){
        sfApp.prepareBlogCovers();
        if( $('body').is('.post-template') ) {
            if( $('body').is('.full-cover') ){
                sfApp.prepareSingleCover();    
            }
            else{
                sfApp.prepareHiddenIframe();
            }            
        }
    },    
    uiRefresh:function(){	    	
    	
    },
    newsStickerInit:function(){
        // News Sticker Initialing
        if( $('body').data('show-top-bar') && $('#sf-sticker-content').length ) {
            $('#sf-sticker-content').ticker({
                htmlFeed: false,
                ajaxFeed: true,
                feedUrl: rootUrl+'/rss/',
                feedType: 'xml'
            });
        }
    },
    misc:function(){
    	// Parallax Initialing
    	if(!sfApp.isMobile() && $('body').data('parallax') ){
            skrollr.init({
                forceHeight: false
            });   
        }        
        sfApp.newsStickerInit();
        // Google Map Initialing
        if($('.gmap').length){
            sfApp.gmapInit();
            google.maps.event.addDomListener(window, 'load', sfApp.gmapInit);
            google.maps.event.addDomListener(window, 'resize', sfApp.gmapInit);
        }

        // Responsive Video
        $('.post-cover').fitVids();
        $('.post-content').fitVids();	

        var currentUrl=window.location.href;
        // Set active for main menu
        var $currentMenu = $('.sf-nav').find('a[href="'+currentUrl+'"]');
        if( $currentMenu.length ){            
            $('.sf-nav li.active').removeClass('active');
            $currentMenu.parent().addClass('active');            
            $currentMenu.parents('.has-children').addClass('active');            
        }

        // Set active for widget menu
        if( $('.sf-nav-widget').length ){
        	var $currentItem = $('.sf-nav-widget').find('a[href="'+currentUrl+'"]');
        	if( $currentItem.length ){
        		$('.sf-nav-widget li.active').removeClass('active');
        		$currentItem.parent().addClass('active');
        		$currentItem.parents('.has-children').addClass('active');            
        	}
        }
        // Place Holder Optimize for Old IE
        $('input, textarea').placeholder();
    },
    init: function () {	
    	SC.initialize({
            client_id: "425fc6ee65a14efbb9b83b1c49a87ccb"
        });
    	sfApp.prepareUI();
    	sfApp.triggerEvents();    		    	
		sfApp.misc();						
	}
};
(function($){ 
    "use strict";    
	$(document).ready(function() {
	    "use strict";  
	    sfApp.init();
	});
    $(window).load(function() {
        sfApp.gridRefresh();
    });
	$(window).resize(function () {
	    "use strict";    
	    if(this.resizeTO){
	        clearTimeout(this.resizeTO);
	    }  
	    this.resizeTO = setTimeout(function() {
	        $(this).trigger('resizeEnd');
	    }, 500);
	});
	$(window).bind('resizeEnd', function() {
	    "use strict";    
	    sfApp.resizeEvents();    	    
	});
})(jQuery);