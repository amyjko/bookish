let smoothlyScrollElementToEyeLevel = (el: Element) => {
    // Top of the target minus a third of window height.
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3, behavior: 'smooth' }); 
}

export default smoothlyScrollElementToEyeLevel