/**
 * @fileoverview layout component
 * @dependency code-snippet.js jquery.1.8.3
 */
ne.util.defineNamespace('ne.component');

ne.component.Layout = ne.util.defineClass({
	/**
	 * initialize layout
	 * @param {object} opitons
	 * 	@param {array} options.grouplist group option list
	 * @param {JQueryObject} $element
	 */
	init: function(opitons, $element) {
		this.$element = $element;
		this._makeGroup(opitons.grouplist);
		this._makeGuide(opitons.guideHTML);
		this._setEvents();
	},

	/**
	 * make group
	 * @param {array} grouplist list of group options
	 * @private
	 */
	_makeGroup: function(grouplist) {
		var group;
		this.groups = {};

		ne.util.forEach(grouplist, function(item) {
			group = this.groups[item.id] = new ne.component.Layout.Group(item);
			this.$element.append(group.$element);
		}, this);
	},

	/**
	 * get group item
	 * @param {(string|object)} object group item id or information to find group
	 * @returns {*}
	 * @private
	 */
	_getGroup: function(group) {
		if (ne.util.isObject(group)) {
			if (group.attr('data-group')) {
				group = group.attr('data-group');
			} else {
				group = group.parent().attr('data-group');
			}
		}
		return this.groups[group];
	},

	/**
	 * make drag and drop event
	 * @param {string} [guideHTML] guide element html
	 * @private
	 */
	_makeGuide: function(guideHTML) {
		this._drag = new ne.component.Layout.Guide({
			guideHTML: guideHTML
		});
	},

	/**
	 * set Events
	 * @private
	 */
	_setEvents: function() {
		this.onMouseDown = $.proxy(this._onMouseDown, this);
		this.onMouseMove = $.proxy(this._onMouseMove, this);
		this.onMouseUp = $.proxy(this._onMouseUp, this);
		$('.drag-item-move').on('mousedown', this.onMouseDown);
	},

	/**
	 * mouse down event handler
	 * @param e
	 * @private
	 */
	_onMouseDown: function(e) {
		this._setGuide(e.target, e.clientX, e.clientY);
		$(document).on('mousemove', this.onMouseMove);
		$(document).on('mouseup', this.onMouseUp);
	},

	/**
	 * set guide
	 * @param {object} target guide target
	 * @param {number} pointX
	 * @param {number} pointY
	 * @private
	 */
	_setGuide: function(target, pointX, pointY) {
		var initPos = {
				x: pointX + this.getX() + 10,
				y: pointY + this.getY() + 10
			},
			itemId = $(target).attr('data-item'),
			$moveEl = $('#' + itemId);
		this._drag.ready(initPos);
		this._drag.setMoveElement($moveEl);
		this.$temp = $moveEl;
	},

	/**
	 * mouse move handler
	 * @param {JqueryEvent} e event object
	 * @private
	 */
	_onMouseMove: function(e) {		
		var parent = $(e.target).parent(),
			pointX = e.clientX + this.getX(),
			pointY = e.clientY + this.getY(),
			group = parent.attr('data-group');

		this._moveGuide(pointX, pointY);

		if (!group) {
			return;
		}

		this._detectMove(group, pointX, pointY);
	},

	/**
	 * detect move with group
	 * @param {object} group compare position with
	 * @param {number} pointX x position
	 * @param {number} pointY y position
	 * @private
	 */
	_detectMove: function(group, pointX, pointY) {
		var groupInst = this._getGroup(group),
			$before;

		if (ne.util.isEmpty(groupInst.list)) {
			parent.append(this.$temp);
			this.$temp.way = 'after';
			this.$temp.index = 0;
		} else {
			$before = this._detectTargetByPosition({
				x: pointX,
				y: pointY
			}, groupInst);

			if ($before && $before.way) {
				$before[$before.way](this.$temp);
				this.$temp.way = $before.way;
				this.$temp.index = $before.attr('data-index');
			}
		}
	},

	/**
	 * move drag effect element
	 * @param {number} x move position x
	 * @param {number} y move position y
	 * @private
	 */
	_moveGuide: function(x, y) {
		this._drag.moveTo({
			x: x + 10 + 'px',
			y: y + 10 + 'px'
		});
	},

	/**
	 * detect target by move element position
	 * @param {object} pos position to detect
	 * @param {object} group  group that has child
	 * @returns {string|*}
	 * @private
	 */
	_detectTargetByPosition: function(pos, group) {

		var target;

		ne.util.forEach(group.list, function(item) {
			if (!this._isValidItem(item)) {
				return;
			}
			target = this._getTarget(item, pos, group) || target;
		}, this);

		return target;
	},

	/**
	 * get target element
	 * @param {object} item
	 * @private
	 */
	_getTarget: function(item, pos, group) {
		var bound = item.$element[0].getBoundingClientRect(),
			bottom = this._getBottom(item, group),
			height = item.$element.height(),
			top = this.getY() + bound.top,
			$target;
		if (pos.y > top && pos.y <= top + (height / 2)) {
			$target = item.$element;
			$target.way = 'before';
		} else if (pos.y > top + (height / 2) && pos.y < bottom) {
			$target = item.$element;
			$target.way = 'after';
		}

		return $target;
	},

	/**
	 * check is Vaild item
	 * @param {param} item
	 * @returns {boolean}
	 * @private
	 */
	_isValidItem: function(item) {
		return !!(item.$element[0] !== this.$temp[0]);
	},

	/**
	 * 다음요소가 있을 경우, 비교할 bottom 값으로 다음요소 top값을 넣어줌, 다음요소가 없으면 마지막 요소로 판단하여 limit(그룹의 bottom)값을 넣어줌
	 * @param {object} item
	 * @param {object} group
	 * @returns {*}
	 * @private
	 */
	_getBottom: function(item, group) {
		var next = item.$element.next(),
			bottom,
			gbound = group.$element[0].getBoundingClientRect(),
			limit = this.getY() + gbound.top + group.$element.height();
		if (next.hasClass(DIMMED_LAYER_CLASS)) {
			bottom = limit;
		} else {
			bottom = this.getY() + next[0].getBoundingClientRect().top;
		}
		return bottom;
	},

	/**
	 * get add index by $temp, $temp.way
	 * @returns {Number}
	 * @private
	 */
	_getAddIndex: function() {
		var temp = this.$temp,
			index = parseInt(temp.index, 10);
		if (temp.way === 'after') {
			index += 1;
		}
		return index;
	},

	/**
	 * get scrollX
	 * @returns {Number}
	 */
	getX: function() {
		return (window.scrollX || $(window).scrollLeft());
	},

	/**
	 * get scrollY
	 * @returns {Number}
	 */
	getY: function() {
		return (window.scrollY || $(window).scrollTop());
	},

	/**
	 * mouse up handler
	 * @param {JqueryEvent} e event object
	 * @private
	 */
	_onMouseUp: function(e) {
		var drag = this._drag;

		this._update();
		drag.finish();

		$(document).off('mousemove', this.onMouseMove);
		$(document).off('mouseup', this.onMouseUp);
	},

	/**
	 * update groups
	 * @private
	 */
	_update: function() {
		var temp = this.$temp,
			oldGroup = this._getGroup(temp.attr('data-groupInfo')),
			targetGroup = this._getGroup(temp.parent()),
			removeIndex = parseInt(temp.attr('data-index'), 10),
			addIndex = this._getAddIndex(),
			item = oldGroup.list[removeIndex];
		if (addIndex) {
			oldGroup.remove(removeIndex);
			targetGroup.add(item, addIndex);
			targetGroup.render();
			oldGroup.render();
		}
	}
});