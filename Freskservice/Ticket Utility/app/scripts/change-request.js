jQuery(document).ready(function () {
    setTimeout(initChevron(), 300);

    function initChevron() {
        var container = jQuery("#chevron-container"),
            chevron_width = 0,
            list = container.find(".chevron-list"),
            leftpanel_width = $("#change-chevron").width(),
            wrapper = container.find(".chevron-scroll-wrapper");

        list.find("li")
            .each(function () {
                // Get all statuses width
                chevron_width = chevron_width + jQuery(this).width();
            })
            .end()
            .width(chevron_width);

        // Reset
        container.removeClass("inline-block");
        wrapper.removeAttr("style");
        // Show / Hide slide control
        if (chevron_width > leftpanel_width) {
            // Long chevron
            if (chevron_width > container.width() + 30) toggleChevronControls(true);
            else toggleChevronControls(false);

            if (chevron_width < container.width() - 60) {
                container.addClass("inline-block");
                if (chevron_width < leftpanel_width + 40) toggleChevronControls(false);
                else {
                    wrapper.width(leftpanel_width - 20);
                    toggleChevronControls(true);
                }
            }
        } else toggleChevronControls(false);
    }

    function toggleChevronControls(show) {
        if (show) {
            jQuery("#chevron-container").addClass("has-controls");
            jQuery(".chevron-controls").show();
        } else {
            jQuery("#chevron-container").removeClass("has-controls");
            jQuery(".chevron-controls").hide();
        }
    }

    function chevronControlState() {
        var wrapper = jQuery(".chevron-scroll-wrapper"),
            wrapper_scroll = wrapper.scrollLeft(),
            wrapper_width = wrapper.width(),
            list_width = wrapper.find(".chevron-list").width() + 25,
            left_control = jQuery("#chevron_control_left"),
            right_control = jQuery("#chevron_control_right");

        jQuery(".chevron-controls").removeClass("active disabled");
        if (wrapper_scroll == 0) {
            // Start
            left_control.removeClass("active");
        } else {
            left_control.addClass("active");
        }

        if (list_width == wrapper_scroll + wrapper_width) {
            // End
            right_control.removeClass("active");
        } else {
            right_control.addClass("active");
        }
    }

    jQuery(".chevron-controls").click(function () {
        var wrapper = jQuery(".chevron-scroll-wrapper"),
            _this = jQuery(this);

        _this.addClass("disabled"); // Prevent multiple clicks

        jQuery(".chevron-scroll-wrapper, .chevron-list").animate(
            {
                scrollLeft: wrapper.scrollLeft() + (-wrapper.width() + 300) * (_this.attr("id") == "chevron_control_left" ? 1 : -1) * 1
            },
            500,
            function () {
                chevronControlState();
            }
        );
    });

    var resizeListener;
    jQuery(window).resize(function () {
        clearTimeout(resizeListener);
        resizeListener = setTimeout(initChevron(), 300);
    });

    jQuery(".custom-tab-item").click(function () {
        if ($(this).attr("disabled")) return;
        $(this).addClass("active").siblings().removeClass("active");

        $($(this).data("tab")).addClass("active").siblings().removeClass("active");
    });
});
