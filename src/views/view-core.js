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
    kSelectedClass: "selected",
    kDisabledClass: "disabled",
    kReadOnlyClass: "read-only",
    kMarkerClass: "nullValue",
    kFocusClass: "focused",
    kHoverClass: "hover",
    kAscendingClass: "asc",
    kDescendingClass: "desc",
    kActiveClass: "active",
    kUpdatingClass: "updating",
    kFadingClass: "invisible",
    kInvalidValueClass: "invalid",
    kInsertedClass: "inserted",
    kDeletedClass: "deleted",
    kReplacingClass: "replacing",
    kLoadingClass: "loading",
    kFirstClass: "first",
    kLastClass: "last",
    kDragAndDropCopy: "drag-and-drop-copy",
    kDragAndDropMove: "drag-and-drop-move",
    kDragAndDropLink: "drag-and-drop-link",
    kDragAndDropNo: "drag-and-drop-no",
    kInactiveWindow: 'coherent_windowInactive',
    kOutlineExpanded: 'outline-expanded',
    kOutlineLeaf: 'outline-leaf',
    kOutlineLevelPrefix: 'outline-level-',
    kOutlineDisclosureButton: 'outline-disclosure-button'
};

coherent.Style.__styles= (function(){
        var s= [];
        var styles= coherent.Style;
        for (var p in styles)
            s.push(styles[p]);
        return s;
    })();
