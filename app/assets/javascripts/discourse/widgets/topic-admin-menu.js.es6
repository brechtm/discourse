import { createWidget, applyDecorators } from "discourse/widgets/widget";
import { h } from "virtual-dom";

createWidget("admin-menu-button", {
  html(attrs) {
    let className = "btn";
    if (attrs.buttonClass) {
      className += " " + attrs.buttonClass;
    }

    return h(
      "li",
      { className: attrs.className },
      this.attach("button", {
        className,
        action: attrs.action,
        icon: attrs.icon,
        label: attrs.fullLabel || `topic.${attrs.label}`,
        title: attrs.title,
        secondaryAction: "hideAdminMenu"
      })
    );
  }
});

createWidget("topic-admin-menu-button", {
  tagName: "span",
  buildKey: () => `topic-admin-menu-button`,

  defaultState() {
    return { expanded: false, position: null };
  },

  html(attrs, state) {
    if (!this.currentUser || !this.currentUser.get("canManageTopic")) {
      return;
    }

    const result = [];

    // We don't show the button when expanded on the right side
    if (!(attrs.rightSide && state.expanded)) {
      result.push(
        this.attach("button", {
          className:
            "btn-default toggle-admin-menu" +
            (attrs.fixed ? " show-topic-admin" : ""),
          title: "topic_admin_menu",
          icon: "wrench",
          action: "showAdminMenu",
          sendActionEvent: true
        })
      );
    }

    if (state.expanded) {
      result.push(
        this.attach("topic-admin-menu", {
          position: state.position,
          fixed: attrs.fixed,
          topic: attrs.topic,
          openUpwards: attrs.openUpwards,
          rightSide: attrs.rightSide
        })
      );
    }

    return result;
  },

  hideAdminMenu() {
    this.state.expanded = false;
    this.state.position = null;
  },

  showAdminMenu(e) {
    this.state.expanded = true;

    const $button = $(e.target).closest("button");
    const position = $button.position();
    const rtl = $("html").hasClass("rtl");
    position.left = position.left;
    position.outerHeight = $button.outerHeight();

    if (rtl) {
      position.left -= 217 - $button.outerWidth();
    }

    if (this.attrs.fixed) {
      position.left += $button.width() - 203;
    }
    this.state.position = position;
    this.sendWidgetAction("hideMultiSelect");
  }
});

export default createWidget("topic-admin-menu", {
  tagName: "div.popup-menu.topic-admin-popup-menu",

  buildClasses(attrs) {
    if (attrs.rightSide) {
      return "right-side";
    }
  },

  buildAttributes(attrs) {
    let { top, left, outerHeight } = attrs.position;
    const position = attrs.fixed ? "fixed" : "absolute";

    if (attrs.rightSide) {
      return;
    }

    if (attrs.openUpwards) {
      const documentHeight = $(document).height();
      const mainHeight = $("#main").height();
      let bottom = documentHeight - top - 70 - $("#main").offset().top;

      if (documentHeight > mainHeight) {
        bottom = bottom - (documentHeight - mainHeight) - outerHeight;
      }

      return {
        style: `position: ${position}; bottom: ${bottom}px; left: ${left}px;`
      };
    } else {
      return {
        style: `position: ${position}; top: ${top}px; left: ${left}px;`
      };
    }
  },

  html(attrs) {
    const buttons = [];
    buttons.push({
      className: "topic-admin-multi-select",
      buttonClass: "btn-default",
      action: "toggleMultiSelect",
      icon: "tasks",
      label: "actions.multi_select",
      title: "topic.actions.multi_select_tooltip"
    });

    const topic = attrs.topic;
    const details = topic.get("details");

    if (details.get("can_delete")) {
      buttons.push({
        className: "topic-admin-delete",
        buttonClass: "btn-danger",
        action: "deleteTopic",
        icon: "far-trash-alt",
        label: "actions.delete",
        title: "topic.actions.delete_tooltip"
      });
    }

    if (topic.get("deleted") && details.get("can_recover")) {
      buttons.push({
        className: "topic-admin-recover",
        buttonClass: "btn-default",
        action: "recoverTopic",
        icon: "undo",
        label: "actions.recover",
        title: "topic.actions.recover_tooltip"
      });
    }

    if (topic.get("closed")) {
      buttons.push({
        className: "topic-admin-open",
        buttonClass: "btn-default",
        action: "toggleClosed",
        icon: "unlock",
        label: "actions.open",
        title: "topic.actions.open_tooltip"
      });
    } else {
      buttons.push({
        className: "topic-admin-close",
        buttonClass: "btn-default",
        action: "toggleClosed",
        icon: "lock",
        label: "actions.close",
        title: "topic.actions.close_tooltip"
      });
    }

    buttons.push({
      className: "topic-admin-status-update",
      buttonClass: "btn-default",
      action: "showTopicStatusUpdate",
      icon: "far-clock",
      label: "actions.timed_update",
      title: "topic.actions.timed_update_tooltip"
    });

    const isPrivateMessage = topic.get("isPrivateMessage");

    const featured = topic.get("pinned_at") || topic.get("isBanner");
    if (!isPrivateMessage && (topic.get("visible") || featured)) {
      buttons.push({
        className: "topic-admin-pin",
        buttonClass: "btn-default",
        action: "showFeatureTopic",
        icon: "thumbtack",
        label: featured ? "actions.unpin" : "actions.pin",
        title: featured
          ? "topic.actions.unpin_tooltip"
          : "topic.actions.pin_tooltip"
      });
    }

    if (this.currentUser.get("staff")) {
      buttons.push({
        className: "topic-admin-change-timestamp",
        buttonClass: "btn-default",
        action: "showChangeTimestamp",
        icon: "calendar-alt",
        label: "change_timestamp.title",
        title: "topic.change_timestamp.tooltip"
      });
    }

    buttons.push({
      className: "topic-admin-reset-bump-date",
      buttonClass: "btn-default",
      action: "resetBumpDate",
      icon: "anchor",
      label: "actions.reset_bump_date",
      title: "topic.actions.reset_bump_date_tooltip"
    });

    if (!isPrivateMessage) {
      buttons.push({
        className: "topic-admin-archive",
        buttonClass: "btn-default",
        action: "toggleArchived",
        icon: "folder",
        label: topic.get("archived") ? "actions.unarchive" : "actions.archive",
        title: topic.get("archived")
          ? "topic.actions.unarchive_tooltip"
          : "topic.actions.archive_tooltip"
      });
    }

    const visible = topic.get("visible");
    buttons.push({
      className: "topic-admin-visible",
      buttonClass: "btn-default",
      action: "toggleVisibility",
      icon: visible ? "far-eye-slash" : "far-eye",
      label: visible ? "actions.invisible" : "actions.visible",
      title: visible
        ? "topic.actions.invisible_tooltip"
        : "topic.actions.visible_tooltip"
    });

    if (details.get("can_convert_topic")) {
      buttons.push({
        className: "topic-admin-convert",
        buttonClass: "btn-default",
        action: isPrivateMessage
          ? "convertToPublicTopic"
          : "convertToPrivateMessage",
        icon: isPrivateMessage ? "comment" : "envelope",
        label: isPrivateMessage
          ? "actions.make_public"
          : "actions.make_private",
        title: isPrivateMessage
          ? "topic.actions.make_public_tooltip"
          : "topic.actions.make_private_tooltip"
      });
    }

    if (this.currentUser.get("staff")) {
      buttons.push({
        action: "showModerationHistory",
        buttonClass: "btn-default",
        icon: "list",
        fullLabel: "admin.flags.moderation_history",
        title: "admin.flags.moderation_history_tooltip"
      });
    }

    const extraButtons = applyDecorators(
      this,
      "adminMenuButtons",
      this.attrs,
      this.state
    );

    return [
      h("h3", I18n.t("admin_title")),
      h(
        "ul",
        buttons
          .concat(extraButtons)
          .map(b => this.attach("admin-menu-button", b))
      )
    ];
  },

  clickOutside() {
    this.sendWidgetAction("hideAdminMenu");
  }
});
