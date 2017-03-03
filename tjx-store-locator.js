(function() {
	var PartDefinitions = {

		Listings : {
			api: null,
			config: null,
			rectangle: null,
			component: null,
			layerId: null,
			isRendered: null,

			flite: {        
				initialize : function (resources) {
					var self = this;
					
					self.api = resources.api;
					self.config = resources.config;
					self.rectangle = resources.rectangle;
					self.component = resources.component;
					self.layerId = resources.id;
				},

				stateChange : function(stateObj) {
					var self = this;
					
					if (stateObj.state === self.api.state.ENABLED) {						
						if(!self.isRendered) {
							self.isRendered = true;
											
							if(self.component.selectedListing) {	
								self.render(self.component.selectedListing, self.component.selectedStore);
							}
						}
					} else {
						// Do nothing at this time
					}
				},

				resize : function(rectangle) {
					var self = this;

					self.rectangle.width = rectangle.width;
					self.rectangle.height = rectangle.height;
				}
			},
			
			render: function(listingsData) {
				var self = this;
				
				// Remove previous children, if any						
				self.clearListings();
				
				this.css({'cursor':'default', 'font-family':'Helvetica, Arial, sans-serif', 'font-size':self.config.getValue('listings_size') + 'px', 'line-height':self.config.getValue('listings_line_height'), color:self.config.getColor('listings_color'), 'word-wrap':'break-word'});
				
				var metricResults = {zip:self.component.zipSearchEntryContainer.getValue()};
				
				var listingsContainer = self.api.dom.getElement("div");
				listingsContainer.width(self.rectangle.width);
				listingsContainer.height(self.rectangle.height);
				self.addChild(listingsContainer);
				
				var listingsDiv = self.api.dom.getElement('div');
				listingsDiv.width(self.rectangle.width - self.component.getScrollWidth());
		        listingsDiv.css({
		            'overflow': 'visible'
		        });
				listingsContainer.addChild(listingsDiv);
				
				var listingHtml = '';
				
				// 93: MarshallsCanada (#005188)
				// 91: Winners (#000)
			
				// Render items
				for (var i = 0; i < listingsData.length; i++) {
					
					if (listingsData[i] && listingsData[i].Name) {
						
						console.log('Chain:', listingsData[i].Chain);
						
						if (listingsData[i].Chain == 93) {
							listingHtml += '<span style="color:#005188;"><p style="margin:0;"><b>Marshalls - ';
						} else if (listingsData[i].Chain == 91) {
							listingHtml += '<span><p style="margin:0;"><b>Winners - ';
						} else {
							listingHtml += '<span><p style="margin:0;"><b>';
						}
						
						listingHtml += self.component.toTitleCase(listingsData[i].Name) + '</b></p><p style="margin:0;">' + self.component.toTitleCase(listingsData[i].Address) + '</p><p style="margin:0 0 0;">' + self.component.toTitleCase(listingsData[i].City) + ', ' + listingsData[i].State + ' ' + listingsData[i].Zip + '</p><p style="margin:0 0 ' + self.config.getValue('listings_spacing') + 'px;">' + listingsData[i].Phone + '</p></span>';
						
						var metricsKey = 'listing' + (i + 1);
						metricResults[metricsKey] = listingsData[i].Name + ', ' + self.component.toTitleCase(listingsData[i].Address) + ', ' + self.component.toTitleCase(listingsData[i].City);
					} else {
						// console.log('missing data:', listingsData[i]);
					}
				}
				
				listingsDiv.html(listingHtml);
				
				// Initialize scrollbar, if needed
				console.log('determine need for scrollbar', listingsDiv.width(), listingsDiv.height(), self.rectangle.height);
				
		        if (listingsDiv.height() > self.rectangle.height) {
					
		            self.api.animation.requestAnimationFrame(function(){
						
		                var scrollOptions = {
		                    hide : false
		                };
						
		                var scroller = self.api.dom.makeScrollable(listingsContainer, scrollOptions);
						
		                var scrollStartY = 0;
						
		                scroller.bind(self.api.dom.events.SCROLL_START, self.api.util.delegate(self, function(evt) {
		                    scrollStartY = evt.info.y;
		                }));
		                scroller.bind(self.api.dom.events.SCROLL_END, function(evt) {
		                    if (scrollStartY != evt.info.y) {
		                        self.metricsHelper.logInteraction({
		                            subtype : self.api.metrics.subtype.INTERACTION_SCROLL,
		                            mode: self.api.metrics.mode.DRAG,
		                            detail : "Listings",
		                            eventData : {
		                                from: scrollStartY,
		                                to: evt.info.y
		                            }
		                        });
		                    }
		                });
						
		            });
		        }
				
				// Log notation, capturing rendered content
				self.component.logNotation('Search Success', metricResults);
			},
			
			clearListings : function () {
				var self = this;
				
				while(self.getChild(0)) {						
					self.removeChild(self.getChild(0));
				}
			},
			
			getListingsLength : function () {
				var self = this;
				
				return self.listings.length;
			}
		},
			
		ZipSearchContainer : {
			api: null,
			config : null,
			rectangle : null,
			component: null,

			flite : {
				initialize : function (resources) {
					var self = this;

					self.api = resources.api;
					self.config = resources.config;
					self.rectangle = resources.rectangle;
					self.component = resources.component;
				},

				stateChange : function(stateObj) {},

				resize : function(rectangle) {
					var self = this;

					self.rectangle.width = rectangle.width;
					self.rectangle.height = rectangle.height;
				}
			}
		},

		ZipSearchEntry : {
			api: null,
			config : null,
			rectangle : null,
			component : null,
			
			entryField : null,
			
			entryFieldPadding : 2,

			flite : {
				initialize : function (resources) {
					var self = this;

					self.api = resources.api;
					self.config = resources.config;
					self.rectangle = resources.rectangle;
					self.component = resources.component;

					self.render();
				},

				stateChange : function(stateObj) {},

				resize : function(rectangle) {
					var self = this;

					self.rectangle.width = rectangle.width;
					self.rectangle.height = rectangle.height;

					self.updateDimensions();
				}
			}, 

			render : function() {
				var self = this;
				
				self.entryField = self.api.dom.getElement('input');
				self.updateDimensions();
				
				self.entryField.setAttribute('type', 'text');
				self.entryField.setAttribute('maxlength', 7);
				self.entryField.setAttribute('placeholder', self.config.getValue('search_placeholder') || '');
	
				var fontSize = self.config.getInt('search_entry_size') || 10;
				var fontColor = self.config.getColor('search_entry_color') || '#666';
				
				self.entryField.css({'border-width':'1px', 'padding':self.entryFieldPadding + 'px', 'font-size':fontSize + 'px', 'color':fontColor, 'border':'none', 'background':'transparent'});
	
				self.addChild(self.entryField);
				
				self.entryField.bind("keydown", self.handleKeyDown);
			},
			
			handleKeyDown : function(e) {
				var self = this;
				
				if(e.keyCode === 13) {
					self.component.logInteraction('Enter Key');
					
					self.component.submitZipSearch(self.component.metricsHelper);
				}
			},
			
			updateDimensions : function() {
				var self = this;
				
				self.entryField.width(self.rectangle.width - (2 * self.entryFieldPadding) - 2); // Subtract padding and border
				self.entryField.height(self.rectangle.height - (2 * self.entryFieldPadding) - 2); // Subtract padding and border
			},
			
			getValue : function() {
				var self = this;
				
				return self.entryField.dom.value;
			}
		}
	};

	return Object({
		name : 'TJX Store Locator',
		layerName: null,
		rectangle: null,
		api: null,
		config: null,
		containers: null,
		isRendered: null,
		metricsHelper: null,
		
		webFontConfigs: [{url: 'fonts.googleapis.com/css?family=', urlDelim: '+', cssDelim: ' ', type: 'link'}],
		
		userLocation: null,
		
		selectedStore: null,
		
		selectedListing: null,
		
		// Part nodes
		listings : null,
		zipSearch : null,
		zipSearchEntry : null,
		zipSearchButton : null,
		
		// Child elements
		listingsContainer : null,
		zipSearchContainer : null,
		zipSearchEntryContainer : null,

		flite: {
			initialize : function(resources) {
				var self = this;
				
				self.layerName = resources.label;
				self.rectangle = resources.rectangle;
				self.api = resources.api;
				self.config = resources.config;
				self.containers = resources.containers;
			},

			stateChange : function(stateObj) {
				var self = this;
	
				if (stateObj.state === self.api.state.ENABLED && !self.isRendered) {
					self.isRendered = true;
					self.metricsHelper = stateObj.trigger;
					
					// Get 1st item in each container
					if (self.containers && self.containers.listings) {
						self.listings = self.containers.listings[0];
						self.zipSearch = self.containers.zip_search[0];
						self.zipSearchEntry = self.zipSearch.children.search_field[0];
						if (self.zipSearch.children.search_button.length > 0) {
							self.zipSearchButton = self.zipSearch.children.search_button[0];
						}
					}

					self.init();
				}
			},

			resize : function(rectangle) {
				var self = this;
	
				self.rectangle.width = rectangle.width;
				self.rectangle.height = rectangle.height;
			},
			
			searchSubmit : function(metricsHelper) {
				var self = this;
				
				self.metricsHelper = metricsHelper;
				
				self.submitZipSearch(self.metricsHelper);
			},

			parts: {
				'Listings' : PartDefinitions.Listings,
				'ZIP Search' : PartDefinitions.ZipSearchContainer,
				'Entry Field' : PartDefinitions.ZipSearchEntry
			}
		},

		init : function() {
			var self = this;

			// Add content containers to stage
			if (self.listings) {
				self.listingsContainer = self.api.factory.getContainer(self.listings);
				self.addChild(self.listingsContainer);
				self.api.state.setState(self.listings.id, self.api.state.ENABLED);
			}
			
			if (self.zipSearch) {
				self.zipSearchContainer = self.api.factory.getContainer(self.zipSearch);
				self.addChild(self.zipSearchContainer);
				self.api.state.setState(self.zipSearch.id, self.api.state.ENABLED);
			}
			
			if(self.zipSearchContainer) {
				// Render submit button
				if (self.zipSearchButton) {
					self.searchButton = self.api.factory.getContainer(self.zipSearchButton);
					self.searchButton.css({'cursor':'pointer'});
					self.zipSearchContainer.addChild(self.searchButton);
					self.api.state.setState(self.zipSearchButton.id, self.api.state.ENABLED);
	
					self.searchButton.bind(self.api.dom.events.SELECT, function(evt) {
						self.logInteraction('Button');
						self.submitZipSearch(self.metricsHelper);
					});
				}
				
				// Render ZIP search input field
				self.zipSearchEntryContainer = self.api.factory.getContainer(self.zipSearchEntry);
				self.zipSearchContainer.addChild(self.zipSearchEntryContainer);
				self.api.state.setState(self.zipSearchEntry.id, self.api.state.ENABLED);
			}
		},

		submitZipSearch : function(metricsHelper) {
			var self = this;
			
			self.listingsContainer.clearListings();
			
			self.trigger('search_initiated', true);
			
			var userEntry = self.zipSearchEntryContainer.getValue();
			
			if(self.validateZipCode(userEntry)) {				
				if(userEntry.length == 6){
					userEntry = userEntry.substr(0,3) + '%20' + userEntry.substr(3,3);
				}
				
				self.userLocation = userEntry;
					
				self.getListingsData(userEntry);
			} else {
				//console.log('Invalid ZIP code entered.');
				
				self.logNotation('Search Fail', {details: 'invalid entry', entry: userEntry});
				
				self.trigger('search_fail', true);
			}
		},
		
		getListingsData : function(userZip) {
			var self = this;
			
			console.log('getListingsData:', userZip);
			
			// Valid ZIP Codes
			// M1L 4T7
			// M5S 2W7
			// M3J 3N4
			
			// Example:
			// http://mktsvc.tjx.com/StoreLocator/GetSearchResults?chain=93,91&zip=M3J+3N4&country=ca&radius=25
			
			var apiUrl = 'http://mktsvc.tjx.com/StoreLocator/GetSearchResults?chain=93,91&zip=' + userZip + '&country=ca&radius=25';
			
			try {
				self.api.net.proxyFeed(apiUrl, self.api.util.delegate(self, self.handleListingsData), {json:true, minify:false, raw:true});
			} catch(err) {				
				self.logNotation('Search Fail', {entry: userZip});
			
				self.trigger('search_fail', true);
			}
		},
		
		handleListingsData : function(data) {
			var self = this;
			
			console.log('handleListingsData:', data.Stores);
			
			self.selectedListing = data.Stores;
			
			if(self.selectedListing && self.selectedListing.length > 0) {				
				self.trigger('search_success', true);
						
				self.render();
			} else {
				//console.log('No listings for entered ZIP.');
				
				self.logNotation('Search Fail', {zip: self.zipSearchEntryContainer.getValue()});
				
				self.trigger('search_fail', true);
			}
		},
		
		render : function() {
			var self = this;
			
			// Render listings
			if(self.listingsContainer && self.selectedListing) {				
				if (self.listings.visibility == 'hidden') {
					self.api.state.setState(self.listings.id, self.api.state.DISABLED);
				} else {
					if (self.listingsContainer.isRendered) {
						self.listingsContainer.render(self.selectedListing, self.selectedStore);
					} else {
						self.api.state.setState(self.listings.id, self.api.state.ENABLED);
					}
				}
			}
		},
		
		logInteraction : function(val) {
			var self = this;
			
			self.metricsHelper = self.metricsHelper.logInteraction({
				subtype : self.api.metrics.subtype.INTERACTION_SUBMIT,
				mode: self.api.metrics.mode.CLICK,
				detail : 'Store Search',
				eventData : {
					zip: self.zipSearchEntryContainer.getValue(),
					source: val
				}
			});
		},

		logNotation : function(detail, eventData) {
			var self = this;

			self.metricsHelper.logNotation({
				subtype : self.api.metrics.subtype.NOTATION_CONTENTDATA,
				detail : detail,
				eventData : eventData
			});
		},
		
		// Utility to determine width of scrollbar
	    getScrollWidth : function() {
	        var self = this;
	        var testDiv = self.api.dom.getElement('div');
	        var testDivChild = self.api.dom.getElement('div');
	        testDiv.addChild(testDivChild);
	        var testScroll = self.api.dom.makeScrollable(testDiv);
	        return testScroll.thickness();
	    },
		
		// Utility function to convert a String to Title Case
		toTitleCase : function(str) {			
			if(str) {			
				return str.replace(/\w\S*/g, function(txt){
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
			}else {
				return '';
			}
		},
		
		validateZipCode : function(str) {			
			var re = new RegExp(/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( )?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i);
			
			return re.test(str);
		}

	});
})();