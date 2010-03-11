/*jsl:import ../core/startup.js*/
/*jsl:import ../core/local.js*/
/*jsl:import ../core/model.js*/
/*jsl:import ../core/kvo.js*/
/*jsl:import ../core/transformers.js*/
/*jsl:import ../controllers/Controller.js*/
/*jsl:import ../dom/element.js*/
/*jsl:import ../dom/event.js*/
/*jsl:import ../nib/VIEW.js*/

/** Styles used by various views. These may be redefined if you have other
 *  preferences.
 *  
 *  @namespace
 */
coherent.Style= {
    kSelectedClass: "c-selected",
    kDisabledClass: "c-disabled",
    kReadOnlyClass: "c-read-only",
    kMarkerClass: "c-placeholder",
    kFocusClass: "c-focused",
    kHoverClass: "c-hover",
    kAscendingClass: "c-asc",
    kDescendingClass: "c-desc",
    kActiveClass: "c-active",
    kUpdatingClass: "c-updating",
    kFadingClass: "c-invisible",
    kInvalidValueClass: "c-invalid",
    kInsertedClass: "c-inserted",
    kDeletedClass: "c-deleted",
    kReplacingClass: "c-replacing",
    kLoadingClass: "c-loading",
    kFirstClass: "c-first",
    kLastClass: "c-last",
    kDragAndDropCopy: "c-drag-and-drop-copy",
    kDragAndDropMove: "c-drag-and-drop-move",
    kDragAndDropLink: "c-drag-and-drop-link",
    kDragAndDropNo: "c-drag-and-drop-no",
    kInactiveWindow: 'c-window-inactive',
    kOutlineExpanded: 'c-outline-expanded',
    kOutlineLeaf: 'c-outline-leaf',
    kOutlineLevelPrefix: 'c-outline-level-',
    kOutlineDisclosureButton: 'c-outline-disclosure-button'
};

coherent.Style.__styles= (function(){
        var s= [];
        var styles= coherent.Style;
        for (var p in styles)
            s.push(styles[p]);
        return s;
    })();
