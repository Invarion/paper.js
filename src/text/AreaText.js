var AreaText = TextItem.extend({
    _class: 'AreaText',

    initialize: function AreaText() {
        this._anchor = [0,0];
        this._needsWrap = false;
        this._verticalAlign = '';
        TextItem.apply(this, arguments);
    },

    clone: function () {

        var cloned = this.clone.base.call(this);
        cloned.setRectangle(this.getRectangle().clone());
        cloned._lines = this._lines.map(function(t) {
            return t;
        });
        cloned.verticalAlign = this._verticalAlign;

        return cloned;
    },

    getRectangle: function() {

        return this._rectangle || new Rectangle(this._anchor, new Point(0, 0));
    },

    setRectangle: function(/* rectangle */) {
        var rectangle = Rectangle.read(arguments);
        this._rectangle = rectangle;
        this.translate(rectangle.topLeft.subtract(this._matrix.getTranslation()));
        this._needsWrap = true;
        this._updateAnchor();
        this._changed();
    },

    setContent: function(content) {
        this._content = '' + content;
        this._needsWrap = true;
        this._updateAnchor();
        this._changed(69);
    },

    getJustification: function() {
        return this._style.justification;
    },

    setJustification: function() {
        this._style.justification = arguments[0];
        this._updateAnchor();
    },

    getVerticalAlign: function() {
        return this._verticalAlign;
    },

    setVerticalAlign: function() {
        this._verticalAlign = arguments[0];
        this._updateAnchor();
    },

    _wrap: function() {
        this._lines = [];

        var paragraphs = this._content.split(/\r\n|\n|\r/mg);
        var splittedWords = paragraphs.map(function(paragraph){
            return paragraph.split(' ');
        });

        for (var j = 0; j < splittedWords.length; j++) {

            var words = splittedWords[j];
            var line = '';

            for (var i = 0; i < words.length; i++) {
                var testLine = line + words[i] + ' ',
                    testWidth = this.getView().getTextWidth(this.style.getFontStyle(), [testLine]);
                if (testWidth > this.rectangle.width && i > 0) {
                    this._lines.push(line.slice(0, -1));
                    line = words[i] + ' ';
                }
                else {
                    line = testLine.slice();
                }
            }

            this._lines.push(line);
        }

        if (this._lines.length) {

            var lastLine = this._lines[this._lines.length - 1];

            if (lastLine.endsWith(' ')) {

                this._lines[this._lines.length - 1] = this._lines[this._lines.length - 1].slice(0, -1);
            }
        }
    },

    _updateAnchor: function() {

        if (this._needsWrap) {
            this._wrap();
            this._needsWrap = false;
        }

        var justification = this._style.justification,
            valign = this._verticalAlign,
            rectangle = this.getRectangle(),
            textHeight = this._lines.length * this._style.getLeading(),
            visibleTextHeight = textHeight > rectangle.height ? rectangle.height : textHeight,
            anchor = new Point(0,this._style.getFontSize() * 0.92);
        if (justification == 'center') {
            anchor = anchor.add([rectangle.width/2,0]);
        } else if (justification == 'right') {
            anchor = anchor.add([rectangle.width,0]);
        }

        if (valign == 'center') {
            anchor = anchor.add([0,(rectangle.height-visibleTextHeight)/2]);
        } else if (valign == 'bottom') {
            anchor = anchor.add([0,rectangle.height-visibleTextHeight]);
        }

        this._anchor = anchor;
    },

    _getAnchor: function() {

        return this._anchor;
    },

    _draw: function(ctx, param, viewMatrix) {
        if (!this._content)
            return;
        this._setStyles(ctx, param, viewMatrix);
        var style = this._style,
            hasFill = style.hasFill(),
            hasStroke = style.hasStroke(),
            rectangle = this.rectangle,
            anchor = this._getAnchor(),
            leading = style.getLeading(),
            shadowColor = ctx.shadowColor;
        ctx.font = style.getFontStyle();
        ctx.textAlign = this._style.getJustification();
        if (this._needsWrap) {
            this._wrap();
            this._needsWrap = false;
        }
        var lines = this._lines;
        for (var i = 0, l = lines.length; i < l; i++) {
            if ((i+1) * leading > rectangle.height)
                return;
            // See Path._draw() for explanation about ctx.shadowColor
            ctx.shadowColor = shadowColor;
            var line = lines[i];
            if (hasFill) {
                ctx.fillText(line, anchor.x, anchor.y);
                ctx.shadowColor = 'rgba(0,0,0,0)';
            }
            if (hasStroke)
                ctx.strokeText(line, anchor.x, anchor.y);
            ctx.translate(0, leading);
        }
    },

    _getBounds: function(matrix, options) {

        var bounds = new Rectangle(
            0, 0,
            this.rectangle.width, this.rectangle.height
        );
        return matrix ? matrix._transformBounds(bounds, bounds) : bounds;
    }
});
