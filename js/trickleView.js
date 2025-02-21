define([
    'core/js/adapt'
], function(Adapt) {

    var TrickleView = Backbone.View.extend({

        isSteplocked: false,

        completionAttribute : null,

        initialize: function(options) {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            var AdaptEvents = {
                "trickle:kill": this.onKill,
                "remove": this.onRemove
            };

            this.onPreRender(this);

            AdaptEvents[this.model.get("_type") + "View:postRender"] = this.onPostRender;
            this.listenTo(Adapt, AdaptEvents);

            this.on("steplock", this.onStepLock);
            this.on("stepunlock", this.onStepUnlock);
        },

        onPreRender: function(view) {
            this.completionAttribute = this.model.get('_isOptional') ? '_trickleInview' : Adapt.trickle.getCompletionAttribute();

            if (this.completionAttribute === '_trickleInview') this.setupInView();

            if (!this.isElementEnabled()) return;

            Adapt.trigger("trickle:preRender", this);
        },

        onPostRender: function(view) {
            if (view.model.get("_id") !== this.model.get("_id")) return;
            if (!this.isElementEnabled()) return;

            Adapt.trigger("trickle:postRender", this);
        },

        isElementEnabled: function() {
            var trickle = Adapt.trickle.getModelConfig(this.model);
            if (!trickle) return false;
            
            if (this.model.get(this.completionAttribute)) return false;

            var isArticleWithOnChildren = (this.model.get("_type") === "article" && trickle._onChildren);
            if (isArticleWithOnChildren) {
                return false;
            }

            if (trickle._isEnabled === true) return true;
            return false;
        },

        onStepLock: function() {
            if (!this.isElementEnabled()) {
                console.log(1);
                this.continueToNext();
                return;
            }

            var trickle = Adapt.trickle.getModelConfig(this.model);
            var isSteplocking = (trickle._stepLocking && trickle._stepLocking._isEnabled);
            if (!isSteplocking) {
                console.log(2);
                this.continueToNext();
                return;
            }

            Adapt.trigger("trickle:steplock", this);
            this.isSteplocked = true;
        },

        continueToNext: function() {
            Adapt.trigger("trickle:continue", this);
        },


        onStepUnlock: function() {
            if (!this.isSteplocked) return;
            this.isSteplocked = false;
            Adapt.trigger("trickle:stepunlock", this);
        },

        onKill: function() {
            this.detachFromElement();
        },

        onRemove: function() {
            this.detachFromElement();
        },

        detachFromElement: function() {
            this.undelegateEvents();
            this.stopListening();
            this.model = null;
            this.articleModel = null;
            this.$el = null;
            this.el = null;
        },

        setupInView: function(view) {
            this.$el.on('inview', this.onInview.bind(this));
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
            if (!visible) return;

            switch (visiblePartY) {
                case 'top':
                    this.hasSeenTop = true;
                    break;
                case 'bottom':
                    this.hasSeenBottom = true;
                    break;
                case 'both':
                    this.hasSeenTop = this.hasSeenBottom = true;
            }

            if (!this.hasSeenTop || !this.hasSeenBottom) return;

            this.model.set('_trickleInview', true);

            this.$el.off('inview', this.onInview.bind(this));
        }

    });

    return TrickleView;

});
