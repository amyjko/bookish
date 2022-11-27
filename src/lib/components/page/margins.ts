// Hides the outline if there's a left inset marginal that might overlap it.
// This operates on the DOM directly, as scroll position isn't easily managed in React.
export function hideOutlineIfObscured() {

	// Get the outline's bounds.
	let outline = document.getElementsByClassName("outline")[0] as HTMLElement;

	// If there's no outline, don't bother.
	if(!outline)
		return

	// Set a threshold for hiding
	let threshold = 100;

	// If the outline isn't affixed to the footer
	if(window.getComputedStyle(outline).getPropertyValue("left") !== "0px") {

		let outlineRect = outline.getBoundingClientRect();
		let overlapRect: DOMRect | undefined = undefined;

		// Find the bottom-most left inset marginal within threshold of the outline.
		Array.from(document.getElementsByClassName("bookish-marginal-left-inset")).forEach(el => {
			let insetRect: DOMRect = el.getBoundingClientRect();
			if(!(outlineRect.bottom < insetRect.top - threshold || 
				outlineRect.top > insetRect.bottom + threshold))
				overlapRect = insetRect;
		});

		// If it overlaps, reduce opacity by the proportion of the vertical distance between two rectangles and the height of the marginal.
		if(overlapRect) {
			let overlap: DOMRect = overlapRect
			let distance = 
				outlineRect.bottom < overlap.top ? threshold :
				outlineRect.bottom < overlap.top + threshold ? threshold - (outlineRect.bottom - overlap.top) :
				outlineRect.top > overlap.bottom - threshold ? threshold - (overlap.bottom - outlineRect.top) :
				outlineRect.top > overlap.bottom ? threshold :
				0;
			let proportion = distance / threshold;
			outline.style.opacity = "" + (proportion * proportion);
		}
		// Otherwise, remove the dimming.
		else
			outline.style.removeProperty("opacity");
	}
	// If it is, it's always visible.
	else
		outline.style.removeProperty("opacity");

}

// After each render of the chapter, we need to adjust the layout of marginals, which by default are floating from
// their little spans within the body of the text. 
//
// We have to do two things:
//
// 1) Lay them out vertically so that they don't overlap.
// 2) Lay them out horizontally, so they're all left aligned with each other on the right margin of the text.
//
// We only want to do this if the marginals are floating; we exclude any marginals that are
// fixed in a fixed position.
export function layoutMarginals() {

	// Get the chapter DOM node, so we can calculate margins.
	let chapter = document.getElementsByClassName("bookish-chapter-body")[0] as HTMLElement;

	// If there's no chapter rendered yet, stop.
	if(chapter === undefined)
		return;

	let book = document.getElementsByClassName("bookish")[0] as HTMLElement;

	// This is the grid line we'll aline all marginals too horizontally.
	let margin = chapter.getBoundingClientRect().width;

	// This will track the current leading bottom edge for laying out marginals.
	let currentBottom: number | null = null;

	// Are there any marginal right inset images that might overlap?
	let rightInsets = document.getElementsByClassName("bookish-marginal-right-inset");

	const marginals = document.getElementsByClassName("bookish-marginal")

	// Layout all of the marginals vertically to prevent overlaps.
	Array.from(marginals).forEach((element: Element) => {

		const el = element as HTMLElement;

		if(el === null)
			return;

		if(window.getComputedStyle(el).getPropertyValue("position") !== "fixed") {

			if(el.parentElement) {

				let containingMarginal = el.parentElement.closest(".bookish-marginal");

				// Get the bounds of this marginal so we know it's size.
				let elementBounds = el.getBoundingClientRect();

				// Get the bounds of this marginal's parent so we know it's vertical position.
				let parentBounds = el.parentElement.getBoundingClientRect();
				let parentTop = parentBounds.top + window.scrollY - (book.getBoundingClientRect().top + window.scrollY);

				// If it's inside a marginal, position it below the marginal.
				if(containingMarginal !== null && currentBottom) {
					el.style.left = "0";
					el.style.top = "" + (currentBottom - (containingMarginal.getBoundingClientRect().top + window.scrollY)) + "px";
					currentBottom = currentBottom + elementBounds.height;
				}
				else {
					// If we don't have a bottom yet, or the current above is above the parent's top,
					// then set the current bottom to the bottom of the parent.
					if(currentBottom === null || currentBottom < parentTop) {
						el.style.top = parentTop + "px";
						currentBottom = parentTop + elementBounds.height;
					}
					// Otherwise, put the marginal below the last marginal's bottom.
					else {
						el.style.top = currentBottom + "px";
						currentBottom = currentBottom + elementBounds.height;
					}

					// If there are any right insets, do any intersect with this marginal?
					// If so, move the marginal below them.
					if(rightInsets.length > 0) {
						Array.from(rightInsets).forEach(inset => {
							// Compute the global positions of the marginal and the potential inset.
							let insetBounds = inset.getBoundingClientRect();
							let insetTop = insetBounds.top + window.scrollY;
							let insetBottom = insetTop + insetBounds.height;
							let elementTop = el.getBoundingClientRect().top + window.scrollY;
							let elementBottom = elementTop + elementBounds.height;

							// If they overlap...
							if(currentBottom !== null) {
								if((elementTop <= insetTop && elementBottom >= insetTop) ||
									(elementTop <= insetBottom && elementBottom >= insetBottom) ||
									(elementTop >= insetTop && elementBottom <= insetBottom)) {
									// Calculate the new position based on the preferred position, minus the element's height (which was added above), plus the overlap between the inset and the marginal.
									let newTop = currentBottom - elementBounds.height + (insetBottom - elementTop);
									// Reposition the marginal.
									el.style.top = newTop + "px";
									// Update the new bottom.
									currentBottom = newTop + elementBounds.height;

								}
							}
						});
					}

					// Reposition the marginal horizontally.
					el.style.left = "calc(2rem + " + margin + "px)";
				}

			}

		}
		// If it's fixed, remove any explicitly set inline values.
		else {
			el.style.removeProperty("top");
			el.style.removeProperty("left");
		}
	});
	
}